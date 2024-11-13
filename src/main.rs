mod protocol;
mod room_manager;
mod state;
mod types;
mod utils;

use axum::{
    extract::{
        ws::{Message, WebSocket},
        State, WebSocketUpgrade,
    },
    response::IntoResponse,
    routing::get,
    Router,
};
use axum_macros::debug_handler;
use futures_util::{SinkExt, StreamExt};
use log::{error, info, warn};
use room_manager::{change_role, create_game, get_room_info, join_game, kick, leave_game};
use tokio::sync::mpsc::{self};
use tower_http::services::ServeDir;

use protocol::ClientMessage;

#[debug_handler]
async fn handle_ws(ws: WebSocketUpgrade, State(state): State<state::Global>) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, state))
}

async fn handle_client_message(
    client_message: ClientMessage,
    state: state::Global,
    sender: state::WsSender,
) {
    info!("Received client message. {client_message:?}");
    match client_message {
        ClientMessage::CreateGame { player_name } => create_game(state, sender, &player_name).await,
        ClientMessage::JoinGame {
            player_name,
            room_code,
        } => join_game(state, sender, &player_name, &room_code).await,
        ClientMessage::LeaveGame {
            player_name,
            room_code,
        } => leave_game(state, &player_name, &room_code).await,
        ClientMessage::Kick {
            player_name,
            room_code,
        } => kick(state, &player_name, &room_code).await,
        ClientMessage::GetRoomInfo { room_code } => get_room_info(state, sender, &room_code).await,
        ClientMessage::ChangeRole {
            room_code,
            role,
            count,
        } => change_role(state, &room_code, role, count).await,
    }
}

async fn handle_socket(socket: WebSocket, state: state::Global) {
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
                    match &client_message {
                        ClientMessage::CreateGame { player_name: name }
                        | ClientMessage::JoinGame {
                            player_name: name, ..
                        } => {
                            player_name.clone_from(name);
                        }
                        ClientMessage::LeaveGame { .. } | ClientMessage::Kick { .. } => {
                            player_name = String::new();
                        }
                        _ => {}
                    }

                    handle_client_message(client_message, state.clone(), tx.clone()).await;
                }
                Err(error) => error!("Got error while deserializing message {error}"),
            }
            info!("State after {state:?}");
        } else {
            warn!("Non-text message received from web socket. {msg:?}");
        }
    }

    // Clean up when the WebSocket is closed
    if !player_name.is_empty() {
        state.write().await.player_disconnected(&player_name);
    }
    sender_task.abort();
}

#[shuttle_runtime::main]
#[allow(clippy::unused_async)]
async fn axum() -> shuttle_axum::ShuttleAxum {
    let state = state::Server::new();

    let app = Router::new()
        .route("/ws", get(handle_ws).with_state(state))
        .nest_service("/", ServeDir::new("frontend/static"));
    Ok(app.into())
}
