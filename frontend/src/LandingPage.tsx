import React, { useContext, useState } from 'react';
import { WebSocketContext, Context } from './WebSocketContext';

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

function CreateGameBox() {
    const [playerName, setPlayerName] = useState<string>('');
    const wrapper = useContext<Context>(WebSocketContext);

    const handleCreateGame = () => {
        wrapper?.current?.create_game(playerName);
    };

    wrapper?.current?.on('RoomCreated', (data: { room_code: string }) => {
        console.log(`Room created with code: ${data.room_code}`);
    });

    return (
        <div>
            <PlayerNameBox playerName={playerName} setPlayerName={setPlayerName} />
            <button onClick={handleCreateGame}>Create Game</button>
        </div>
    )

}

const LandingPage: React.FC = () => {
    return (
        <div>
            <CreateGameBox />
        </div>
    );
};

export default LandingPage;
