use axum::extract::ws::Message;

use crate::{protocol::ServerMessage, state::WsSender};

pub async fn send_message(sender: &WsSender, message: ServerMessage) {
    println!("Sending message {message:?}");
    let response = serde_json::json!(message);
    let result = sender.send(Message::Text(response.to_string())).await;
    result.expect("Unexpected error while sending");
}
