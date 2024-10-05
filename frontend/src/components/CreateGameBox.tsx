import { useContext } from 'react';
import { WebSocketContext, BackendWrapper } from '../WebSocketContext';
import { useNavigate } from 'react-router-dom';
import { NormalButton } from './Button';
import { PlayerNameBox } from './PlayerNameBox';

export interface CreateGameBoxProps {
    playerName: string;
    setPlayerName: (e: string) => void;
}


export function CreateGameBox({ playerName, setPlayerName }: CreateGameBoxProps) {
    const wrapper = useContext<BackendWrapper>(WebSocketContext);
    const navigate = useNavigate();

    const handleCreateGame = () => {
        wrapper.on('CreateGameBox', 'RoomCreated', (data: { room_code: string; }) => {
            console.log(`Room created with code: ${data.room_code}`);
            navigate(`/room/${data.room_code}`, { state: { playerName: playerName } });
        });

        wrapper.create_game(playerName);
    };

    return (
        <div className="grid grid-cols-1 gap-6 mt-4">
            <PlayerNameBox playerName={playerName} setPlayerName={setPlayerName} />
            <NormalButton onClick={handleCreateGame} text="Create Game" />
        </div>
    );
} 
