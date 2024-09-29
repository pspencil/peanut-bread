use serde::{Deserialize, Serialize};
#[derive(Debug, Serialize, Deserialize, Default, Clone)]
pub struct Room {
    players: Vec<String>,
    host: String,
}

impl Room {
    pub fn new(player_name: &str) -> Room {
        Room {
            players: vec![player_name.to_string()],
            host: player_name.to_string(),
        }
    }

    fn player_index(&self, player_name: &str) -> Option<usize> {
        self.players.iter().position(|x| *x == player_name)
    }

    pub fn add_player(&mut self, player_name: &str) {
        self.players.push(player_name.to_string());
    }

    pub fn player_exists(&self, player_name: &str) -> bool {
        self.player_index(player_name).is_some()
    }

    pub fn remove_player(&mut self, player_name: &str) {
        if player_name == self.host {
            if let Some(player_name) = self.players.get(1) {
                self.host = player_name.clone();
            }
        }
        if let Some(index) = self.player_index(player_name) {
            self.players.remove(index);
        }
    }

    pub fn is_empty(&self) -> bool {
        self.players.is_empty()
    }

    pub fn players(&self) -> &Vec<String> {
        &self.players
    }
}
