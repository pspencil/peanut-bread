import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { RoomInfo, useWebSocket } from "../WebSocketContext";

function LeaveButton({ playerName, roomCode }: { playerName: string; roomCode: string }) {
    const wrapper = useWebSocket();
    const navigate = useNavigate();

    function handleLeaveGame() {
        wrapper.leave_game(playerName, roomCode);
        navigate("/");
    }

    return (
        <button
            onClick={handleLeaveGame}
            className="px-6 py-2 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-red-600 rounded-lg hover:bg-red-500 focus:outline-none focus:ring focus:ring-red-300 focus:ring-opacity-50"
        >
            Leave Room
        </button>
    );
}

function Room() {
    const { roomCode } = useParams<{ roomCode: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const wrapper = useWebSocket();

    useEffect(() => {
        const handleRoomInfo = (data: RoomInfo) => {
            if (!location.state || !location.state.playerName || !data.players.includes(location.state.playerName)) {
                navigate("/", { state: { join: roomCode, playerName: location?.state?.playerName } });
                return;
            }
            setRoomInfo(data);
            setIsLoading(false);
        };

        const handleRoomDoesNotExist = () => {
            navigate("/", { state: { message: `Room ${roomCode} doesn't exist.` } });
        };

        const handleKicked = () => {
            navigate("/", { state: { message: "Kicked by host." } });
        };

        const client_id = "Room";

        wrapper.when_ready(client_id, () => {
            wrapper.on(client_id, 'RoomInfo', handleRoomInfo);
            wrapper.on(client_id, 'RoomDoesNotExist', handleRoomDoesNotExist);
            wrapper.on(client_id, 'Kicked', handleKicked);

            if (roomCode) {
                wrapper.get_room_info(roomCode);
            } else {
                navigate("/", { state: { message: "Invalid room code." } });
            }
        });

        return () => {
            wrapper.unsubscribe(client_id, 'RoomInfo');
            wrapper.unsubscribe(client_id, 'RoomDoesNotExist');
        };
    }, [roomCode, navigate, location.state, wrapper]);

    if (isLoading) {
        return <div className="bg-slate-900 min-h-screen text-white flex items-center justify-center">
            <p>Loading room information...</p>
        </div>;
    }

    if (!roomInfo || !roomCode) {
        return null;
    }

    function kick(player: string, roomCode: string) {
        return () => {
            wrapper.kick(player, roomCode);
        }
    }

    const { playerName } = location.state;
    const kickClass = "text-gray-400 underline";
    const playerString = roomInfo.players.map((player: string, index: number) => (
        <React.Fragment key={player}>
            {index > 0 && ', '}
            <span className={player === roomInfo.host ? "font-bold" : ""}>
                {player}
            </span>
            {player !== roomInfo.host && playerName === roomInfo.host && <button onClick={kick(player, roomCode)} className={kickClass}>[kick]</button>}
        </React.Fragment>
    ));

    return (
        <div className="bg-slate-900 min-h-screen">
            <header>
                <nav className='bg-white border-gray-200 dark:bg-gray-900 p-3 flex flex-row space-x-4'>
                    <h1 className='self-center text-2xl font-semibold whitespace-nowrap dark:text-white'>
                        Room: {roomCode} | {playerName}
                    </h1>
                    <LeaveButton playerName={playerName} roomCode={roomCode} />
                </nav>
            </header>
            <div className="text-white p-4">
                <p >Players: {playerString}</p>
            </div>
        </div>
    );
}

export default Room;