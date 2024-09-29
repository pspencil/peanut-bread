import React, { useContext, useEffect, useState } from 'react';
import { WebSocketContext, BackendWrapper } from './WebSocketContext';
import { redirect, useLocation, useNavigate } from 'react-router-dom';
import { ErrorPopup } from './Popup';


interface InputWithLabelProps {
    value: string,
    setValue: (a: string) => void,
    id: string,
    placeholder: string
}
function InputWithLabel({ value, setValue, id, placeholder }: InputWithLabelProps) {
    return (
        <div>
            <label className="text-gray-700 dark:text-gray-200" htmlFor={id}>{id}</label>
            <input
                id={id}
                type="text"
                placeholder={placeholder}
                className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 focus:ring-opacity-40 dark:focus:border-blue-300 focus:outline-none focus:ring"
                value={value}
                onChange={(e) => setValue(e.target.value)
                }
            />
        </div>
    );
}

interface PlayerNameBoxProps {
    playerName: string,
    setPlayerName: (a: string) => void
}

function PlayerNameBox({ playerName, setPlayerName }: PlayerNameBoxProps) {
    return (
        <InputWithLabel value={playerName} setValue={setPlayerName} id="Username" placeholder='Enter your name' />
    );
}


enum Tab { CreateGame = "CreateGame", JoinGame = "JoinGame" }

interface TabBarProps {
    activeTab: Tab,
    setActiveTab: (t: Tab) => void
}
function TabBar({ activeTab, setActiveTab }: TabBarProps) {
    const commonClass = "inline-flex items-center h-10 px-4 -mb-px text-lg font-medium sm:text-xl text-center bg-transparent border-b-2 whitespace-nowrap focus:outline-none";
    function createActiveTab(tab: Tab) {
        const classes = commonClass + " text-blue-600 border-blue-500 dark:border-blue-400 dark:text-blue-300";
        return <button className={classes} key={tab}>
            {tab}
        </button>
    }

    function createPassiveTab(tab: Tab) {
        const classes = commonClass + " text-gray-700 border-transparent dark:text-white cursor-base hover:border-gray-400";
        return <button className={classes} key={tab} onClick={() => setActiveTab(tab)}>
            {tab}
        </button>

    }

    const tabs = Object.values(Tab).map((tab) => {
        if (tab === activeTab) {
            return createActiveTab(tab);
        } else {
            return createPassiveTab(tab);
        }
    });

    return <div className="flex overflow-x-auto overflow-y-hidden border-b border-gray-200 whitespace-nowrap dark:border-gray-700">
        {tabs}
    </div>
}
const confirmButtonClass = "px-6 py-2 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-indigo-900 rounded-lg hover:bg-indigo-800 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-50"


function CreateGameBox() {
    const [playerName, setPlayerName] = useState<string>('');
    const wrapper = useContext<BackendWrapper>(WebSocketContext);
    const navigate = useNavigate();

    const handleCreateGame = () => {
        wrapper.on('CreateGameBox', 'RoomCreated', (data: { room_code: string }) => {
            console.log(`Room created with code: ${data.room_code}`);
            navigate(`/room/${data.room_code}`, { state: { playerName: playerName } });
        });

        wrapper.create_game(playerName);
    };

    return (
        <div className="grid grid-cols-1 gap-6 mt-4">
            <PlayerNameBox playerName={playerName} setPlayerName={setPlayerName} />
            <button onClick={handleCreateGame} className={confirmButtonClass}>Create Game</button>
        </div>
    )
}

function JoinGameBox({ setMessage }: { setMessage: (a: string) => void }) {
    const [playerName, setPlayerName] = useState<string>('');
    const [roomCode, setRoomCode] = useState<string>('');
    const navigate = useNavigate();
    const wrapper = useContext<BackendWrapper>(WebSocketContext);

    const handleJoinGame = () => {
        wrapper.on("JoinGameBox", 'RoomDoesNotExist', ({ }: {}) => {
            setMessage(`Room ${roomCode} does not exist.`);
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
            <button onClick={handleJoinGame} className={confirmButtonClass}>Join Game</button>
        </div>
    )
}

const LandingPage: React.FC = () => {
    const [message, setMessage] = useState<string | null>(null);
    const [trigger, setTrigger] = useState<number>(0);
    const location = useLocation();
    const navigate = useNavigate();

    function setMessageAndRefresh(message: string) {
        setMessage(message);
        setTrigger(trigger + 1);
    }


    useEffect(() => {
        if (location.state && 'message' in location.state) {
            setMessageAndRefresh(location.state.message);
            // Clear the message from the location state
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate]);

    const [activeTab, setActiveTab] = useState<Tab>(Tab.CreateGame)
    return (
        <div>
            {message && <ErrorPopup message={message} trigger={trigger} />}
            <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className='max-w-4xl p-6 mx-auto rounded-md shadow-md'>
                {activeTab as Tab === Tab.CreateGame && <CreateGameBox />}
                {activeTab as Tab === Tab.JoinGame && <JoinGameBox setMessage={setMessageAndRefresh} />}
            </div>
        </div>
    );
};

export default LandingPage;
