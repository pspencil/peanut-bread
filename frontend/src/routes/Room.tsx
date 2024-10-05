import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { RoomInfo, useWebSocket } from "../WebSocketContext";
import { RoomConfiguration } from "../components/RoomConfiguration";
import { RedButton } from "../components/Button";

function LeaveButton({ playerName, roomCode }: { playerName: string; roomCode: string; }) {
    const wrapper = useWebSocket();
    const navigate = useNavigate();

    function handleLeaveGame() {
        wrapper.leave_game(playerName, roomCode);
        navigate("/");
    }

    return <RedButton onClick={handleLeaveGame} text="Leave Room" />;
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

    const { playerName } = location.state;

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
            <RoomConfiguration roomCode={roomCode} roomInfo={roomInfo} playerName={playerName} />
        </div>
    );
}

export default Room;