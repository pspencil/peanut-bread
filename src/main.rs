use axum::{
    extract::{
        ws::{Message, WebSocket},
        WebSocketUpgrade,
    },
    response::IntoResponse,
    routing::get,
    Router,
};
use futures_util::{SinkExt, StreamExt};
use rand::{distributions::Uniform, Rng};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{
    mpsc::{self},
    RwLock,
};

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
    LeaveGame {
        player_name: String,
        room_code: String,
    },
    GetRoomInfo {
        room_code: String,
    },
}

#[derive(Debug, Serialize, Deserialize, Default, Clone)]
struct Room {
    players: Vec<String>,
    host: String,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "action")]
enum ServerMessage {
    RoomCreated { room_code: String },
    PlayerJoined { player_name: String },
    RoomDoesNotExist,
    RoomExists,
    RoomInfo(Room),
}

type WsSender = mpsc::Sender<Message>;

async fn send_message(sender: &WsSender, message: ServerMessage) {
    let response = serde_json::json!(message);
    sender
        .send(Message::Text(response.to_string()))
        .await
        .unwrap();
}

#[derive(Debug, Default)]
struct ServerState {
    rooms: HashMap<String, Arc<RwLock<Room>>>,
    player_connections: HashMap<String, WsSender>,
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

async fn broadcast_room_update(state: &ServerState, room_code: &str, updated_room: Room) {
    if let Some(room) = state.rooms.get(room_code) {
        let room = room.read().await;
        for player in &room.players {
            if let Some(sender) = state.player_connections.get(player) {
                let message = ServerMessage::RoomInfo(updated_room.clone());
                send_message(sender, message).await;
            }
        }
    }
}

async fn handle_client_message(
    client_message: ClientMessage,
    state: SharedState,
    sender: WsSender,
) {
    println!("Received client message. {client_message:?}");
    match client_message {
        ClientMessage::CreateGame { player_name } => {
            let room_code = generate_new_room_code();
            let room = Arc::new(RwLock::new(Room {
                players: vec![player_name.clone()],
                host: player_name.clone(),
            }));

            let mut state = state.write().await;
            state.rooms.insert(room_code.clone(), room);

            send_message(
                &sender,
                ServerMessage::RoomCreated {
                    room_code: room_code.clone(),
                },
            )
            .await;
        }
        ClientMessage::JoinGame {
            player_name,
            room_code,
        } => {
            let state = state.read().await;
            if let Some(room) = state.rooms.get(&room_code) {
                let mut room = room.write().await;
                room.players.push(player_name);

                send_message(&sender, ServerMessage::RoomExists).await;

                // Notify other players that a player has joined by sending a new RoomInfo
                let updated_room = room.clone();
                drop(room); // Release the write lock
                broadcast_room_update(&state, &room_code, updated_room).await;
            } else {
                send_message(&sender, ServerMessage::RoomDoesNotExist).await;
            }
        }
        ClientMessage::LeaveGame {
            player_name,
            room_code,
        } => {
            let state = state.read().await;
            if let Some(room) = state.rooms.get(&room_code) {
                let mut room = room.write().await;
                let index = room.players.iter().position(|x| *x == player_name).unwrap();
                room.players.remove(index);
                println!("Removed {player_name} from {room_code}");

                // Notify other players that a player has left by sending a new RoomInfo
                let updated_room = room.clone();
                drop(room); // Release the write lock
                broadcast_room_update(&state, &room_code, updated_room).await;
            } else {
                // Do nothing
            }
        }
        ClientMessage::GetRoomInfo { room_code } => {
            let state = state.read().await;
            if let Some(room) = state.rooms.get(&room_code) {
                let room = room.read().await;
                send_message(&sender, ServerMessage::RoomInfo(room.clone())).await;
            } else {
                send_message(&sender, ServerMessage::RoomDoesNotExist).await;
            }
        }
    }
}

async fn handle_socket(socket: WebSocket, state: SharedState) {
    let (mut sender, mut receiver) = socket.split();
    let (tx, mut rx) = mpsc::channel::<Message>(100);

    let sender_task = tokio::spawn(async move {
        while let Some(message) = rx.recv().await {
            if sender.send(message).await.is_err() {
                break;
            }
        }
    });

    let mut player_name = String::new();

    while let Some(Ok(msg)) = receiver.next().await {
        if let Message::Text(text) = msg {
            match serde_json::from_str(&text) {
                Ok(client_message) => {
                    if let ClientMessage::CreateGame { player_name: name }
                    | ClientMessage::JoinGame {
                        player_name: name, ..
                    } = &client_message
                    {
                        player_name = name.clone();
                        state
                            .write()
                            .await
                            .player_connections
                            .insert(player_name.clone(), tx.clone());
                    }
                    handle_client_message(client_message, state.clone(), tx.clone()).await
                }
                Err(error) => println!("Got error while deserializing message {error}"),
            }
        } else {
            println!("Non-text message received from web socket. {msg:?}");
        }
    }

    // Clean up when the WebSocket is closed
    if !player_name.is_empty() {
        state.write().await.player_connections.remove(&player_name);
    }
    sender_task.abort();
}

#[shuttle_runtime::main]
async fn axum() -> shuttle_axum::ShuttleAxum {
    let state = Arc::new(RwLock::new(ServerState::default()));
    let app = Router::new().route("/ws", get(move |ws| handle_ws(ws, state.clone())));
    Ok(app.into())
}
