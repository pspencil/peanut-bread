use debug_ignore::DebugIgnore;
use rand::{distributions::Uniform, Rng};
use std::{collections::HashMap, fmt::Debug, sync::Arc};

use axum::extract::ws::Message;
use tokio::sync::{mpsc, RwLock};

use crate::types::Room;

pub type WsSender = mpsc::Sender<Message>;

#[derive(Debug, Default)]
pub struct Server {
    rooms: HashMap<String, Arc<RwLock<Room>>>,
    player_connections: HashMap<String, DebugIgnore<WsSender>>,
}

pub type Global = Arc<RwLock<Server>>;

fn generate_new_room_code() -> String {
    rand::thread_rng()
        .sample_iter(&Uniform::new_inclusive(b'A', b'Z'))
        .take(4)
        .map(char::from)
        .collect()
}

impl Server {
    pub fn new() -> Global {
        Arc::new(RwLock::new(Server::default()))
    }

    pub fn create_new_room(&mut self, player_name: &str) -> String {
        let room_code = generate_new_room_code();
        let room = Arc::new(RwLock::new(Room::new(player_name)));
        self.rooms.insert(room_code.clone(), room);
        room_code
    }

    pub fn remove_room(&mut self, room_code: &str) {
        self.rooms.remove(room_code);
    }

    pub fn get_room(&self, room_code: &str) -> Option<&Arc<RwLock<Room>>> {
        return self.rooms.get(room_code);
    }

    pub fn player_connected(&mut self, player_name: &str, conn: WsSender) {
        self.player_connections
            .insert(player_name.to_string(), conn.into());
    }

    pub fn player_disconnected(&mut self, player_name: &str) {
        self.player_connections.remove(player_name);
    }

    pub fn get_player_connection(&self, player_name: &str) -> Option<&WsSender> {
        self.player_connections.get(player_name).map(|x| &x.0)
    }
}
