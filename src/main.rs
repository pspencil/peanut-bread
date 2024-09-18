use axum::{
    extract::{
        ws::{Message, WebSocket},
        WebSocketUpgrade,
    },
    response::IntoResponse,
    routing::get,
    Router,
};
use rand::{distributions::Uniform, Rng};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "action")]
enum ClientMessage {
    CreateGame {
        player_name: String,
    },
    JoinGame {
        player_name: String,
        room_code: String,
    },
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "action")]
enum ServerMessage {
    RoomCreated { room_code: String },
    PlayerJoined { player_name: String },
}

#[derive(Debug, Default)]
struct Room {
    players: Vec<String>,
}

#[derive(Debug, Default)]
struct ServerState {
    rooms: HashMap<String, Arc<RwLock<Room>>>,
}

type SharedState = Arc<RwLock<ServerState>>;

async fn handle_ws(ws: WebSocketUpgrade, state: SharedState) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

fn generate_new_room_code() -> String {
    rand::thread_rng()
        .sample_iter(&Uniform::new_inclusive(b'A', b'Z'))
        .take(4)
        .map(char::from)
        .collect()
}

async fn handle_client_message(
    client_message: ClientMessage,
    state: SharedState,
    socket: &mut WebSocket,
) {
    match client_message {
        ClientMessage::CreateGame { player_name } => {
            let room_code = generate_new_room_code();
            let room = Arc::new(RwLock::new(Room {
                players: vec![player_name],
            }));

            let mut state = state.write().await;
            state.rooms.insert(room_code.clone(), room);

            let response = serde_json::json!(ServerMessage::RoomCreated {
                room_code: room_code
            });
            socket
                .send(Message::Text(response.to_string()))
                .await
                .unwrap();
        }
        ClientMessage::JoinGame {
            player_name,
            room_code,
        } => {
            let state = state.read().await;
            if let Some(room) = state.rooms.get(&room_code) {
                let mut room = room.write().await;
                room.players.push(player_name);
            } else {
                // Handle non-existing room
            }
        }
    }
}

async fn handle_socket(mut socket: WebSocket, state: SharedState) {
    while let Some(Ok(msg)) = socket.recv().await {
        if let Message::Text(text) = msg {
            match serde_json::from_str(&text) {
                Ok(client_message) => {
                    handle_client_message(client_message, state.clone(), &mut socket).await
                }
                Err(error) => println!("Got error while deserializing message {error}"),
            }
        } else {
            println!("Non-text message received from web socket. {msg:?}");
        }
    }
}

#[shuttle_runtime::main]
async fn axum() -> shuttle_axum::ShuttleAxum {
    let state = Arc::new(RwLock::new(ServerState::default()));
    let app = Router::new().route("/ws", get(move |ws| handle_ws(ws, state.clone())));
    Ok(app.into())
}
