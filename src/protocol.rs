use serde::{Deserialize, Serialize};

use crate::types::{Role, Room};
#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "action")]
pub enum ClientMessage {
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
    Kick {
        room_code: String,
        player_name: String,
    },
    ChangeRole {
        room_code: String,
        role: Role,
        count: i64,
    },
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "action")]
pub enum ServerMessage {
    RoomCreated { room_code: String },
    PlayerJoined { player_name: String },
    RoomDoesNotExist,
    PlayerExists,
    RoomExists,
    Kicked,
    RoomInfo(Room),
}
