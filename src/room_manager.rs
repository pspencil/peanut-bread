use log::{error, info};

use crate::{
    protocol::ServerMessage,
    state::{self, WsSender},
    types::{Role, Room},
    utils::send_message,
};

async fn broadcast_room_update(
    state: &state::Server,
    room_code: &str,
    updated_room: Room,
    except: &str,
) {
    info!("Broadcasting room info to all players in {room_code} except {except}");
    if let Some(room) = state.get_room(room_code) {
        let room = room.read().await;
        for player in room.players() {
            if player == except {
                continue;
            }
            if let Some(sender) = state.get_player_connection(player) {
                let message = ServerMessage::RoomInfo(updated_room.clone());
                send_message(sender, message).await;
            } else {
                error!("Connection for player {player} is not found.");
            }
        }
    } else {
        error!("Room not found");
    }
}

pub async fn create_game(state: state::Global, sender: WsSender, player_name: &str) {
    let mut state = state.write().await;

    state.player_connected(player_name, sender.clone());
    let room_code = state.create_new_room(player_name);

    send_message(
        &sender,
        ServerMessage::RoomCreated {
            room_code: room_code.clone(),
        },
    )
    .await;
}

pub async fn join_game(state: state::Global, sender: WsSender, player_name: &str, room_code: &str) {
    let room_opt = {
        let state_ro = state.read().await;
        state_ro.get_room(room_code).cloned()
    };
    if let Some(room) = room_opt {
        if room.read().await.player_exists(player_name) {
            send_message(&sender, ServerMessage::PlayerExists).await;
        } else {
            state
                .write()
                .await
                .player_connected(player_name, sender.clone());
            let mut room = room.write().await;
            room.add_player(player_name);
            send_message(&sender, ServerMessage::RoomExists).await;

            // Notify other players that a player has joined by sending a new RoomInfo
            let updated_room = room.clone();
            drop(room); // Release the write lock
            let state = state.read().await;
            broadcast_room_update(&state, room_code, updated_room, player_name).await;
        }
    } else {
        send_message(&sender, ServerMessage::RoomDoesNotExist).await;
    }
}

pub async fn leave_game(state: state::Global, player_name: &str, room_code: &str) {
    let room_opt = {
        let state_ro = state.read().await;
        state_ro.get_room(room_code).cloned()
    };
    if let Some(room) = room_opt {
        let mut room = room.write().await;
        room.remove_player(player_name);

        state.write().await.player_disconnected(player_name);

        if room.is_empty() {
            drop(room);
            state.write().await.remove_room(room_code);
        } else {
            // Notify other players that a player has left by sending a new RoomInfo
            let updated_room = room.clone();
            drop(room); // Release the write lock
            let state_ro = state.read().await;
            broadcast_room_update(&state_ro, room_code, updated_room, player_name).await;
        }
    } else {
        // Do nothing
    }
}

pub async fn get_room_info(state: state::Global, sender: WsSender, room_code: &str) {
    let state = state.read().await;
    if let Some(room) = state.get_room(room_code) {
        let room = room.read().await;
        send_message(&sender, ServerMessage::RoomInfo(room.clone())).await;
    } else {
        send_message(&sender, ServerMessage::RoomDoesNotExist).await;
    }
}

pub async fn kick(state: state::Global, player_name: &str, room_code: &str) {
    if let Some(sender) = state.read().await.get_player_connection(player_name) {
        send_message(sender, ServerMessage::Kicked).await;
    }
    leave_game(state, player_name, room_code).await;
}

pub async fn change_role(state: state::Global, room_code: &str, role: Role, count: i64) {
    let room_opt = {
        let state_ro = state.read().await;
        state_ro.get_room(room_code).cloned()
    };
    if let Some(room) = room_opt {
        let mut room = room.write().await;
        room.change_role(role, count);

        // Notify other players that a player has joined by sending a new RoomInfo
        let updated_room = room.clone();
        drop(room); // Release the write lock
        let state = state.read().await;
        broadcast_room_update(&state, room_code, updated_room, "").await;
    } else {
        // Do nothing
    }
}
