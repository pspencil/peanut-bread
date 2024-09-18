import React, { useContext, useState } from 'react';
import { WebSocketContext, BackendWrapper } from './WebSocketContext';

function PlayerNameBox({ playerName, setPlayerName }: { playerName: string, setPlayerName: (a: string) => void }) {
    return (
        <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)
            }
        />
    );
}


const LandingPage: React.FC = () => {
    const [playerName, setPlayerName] = useState<string>('');
    const [roomCode, setRoomCode] = useState<string>('');
    const wrapper = useContext<BackendWrapper | null>(WebSocketContext);

    const handleCreateGame = () => {
        wrapper?.create_game(playerName);
    };

    wrapper?.on('RoomCreated', (data: { room_code: string }) => {
        console.log(`Room created with code: ${data.room_code}`);
    });


    const handleJoinGame = () => {
        wrapper?.join_game(playerName, roomCode);
    };

    wrapper?.on('PlayerJoined', (data: { player_name: string }) => {
        console.log(`${data.player_name} joined the game`);
    });

    return (
        <div>
            <h2>Game Setup</h2>
            <br />
            <PlayerNameBox playerName={playerName} setPlayerName={setPlayerName} />
            <button onClick={handleCreateGame}>Create Game</button>
            <br />
            <input
                type="text"
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
            />
            <button onClick={handleJoinGame}>Join Game</button>
        </div>
    );
};

export default LandingPage;
