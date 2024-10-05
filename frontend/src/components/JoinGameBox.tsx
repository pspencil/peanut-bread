import { useContext } from 'react';
import { WebSocketContext, BackendWrapper } from '../WebSocketContext';
import { useNavigate } from 'react-router-dom';
import { NormalButton } from './Button';
import { InputWithLabel } from './InputWithLabel';
import { PlayerNameBox } from './PlayerNameBox';

export interface JoinGameBoxProps {
    setMessage: (a: string) => void;
    playerName: string;
    setPlayerName: (e: string) => void;
    roomCode: string;
    setRoomCode: (e: string) => void;
}

export function JoinGameBox({ setMessage, playerName, setPlayerName, roomCode, setRoomCode }: JoinGameBoxProps) {
    const navigate = useNavigate();
    const wrapper = useContext<BackendWrapper>(WebSocketContext);

    const handleJoinGame = () => {
        wrapper.on("JoinGameBox", 'RoomDoesNotExist', ({ }: {}) => {
            setMessage(`Room ${roomCode} does not exist.`);
        });

        wrapper.on("JoinGameBox", 'PlayerExists', ({ }: {}) => {
            setMessage(`Player ${playerName} already in ${roomCode}.`);
        });

        wrapper.on("JoinGameBox", 'RoomExists', ({ }: {}) => {
            navigate(`/room/${roomCode}`, { state: { playerName: playerName } });
        });

        wrapper.join_game(playerName, roomCode);
    };

    return (
        <div className="grid grid-cols-1 gap-6 mt-4">
            <PlayerNameBox playerName={playerName} setPlayerName={setPlayerName} />
            <InputWithLabel value={roomCode} setValue={setRoomCode} id="Room Code" placeholder='Enter 4 character room code' />
            <NormalButton onClick={handleJoinGame} text="Join Game" />
        </div>
    );
} 