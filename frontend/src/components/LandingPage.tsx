import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ErrorPopup } from './Popup';
import { JoinGameBox } from './JoinGameBox';
import { CreateGameBox } from './CreateGameBox';


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


const LandingPage: React.FC = () => {
    const [message, setMessage] = useState<string | null>(null);
    const [trigger, setTrigger] = useState<number>(0);
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<Tab>(Tab.CreateGame)
    const [playerName, setPlayerName] = useState<string>('');
    const [roomCode, setRoomCode] = useState<string>('');

    function setMessageAndRefresh(message: string) {
        setMessage(message);
        setTrigger(prev => prev + 1);
    }

    useEffect(() => {
        if (location.state && typeof location.state === 'object') {
            const { message, join, playerName } = location.state as { message?: string; join?: string; playerName?: string };

            if (message) {
                setMessageAndRefresh(message);
            }

            if (join) {
                setActiveTab(Tab.JoinGame);
                setRoomCode(join);
            }

            if (playerName) {
                setPlayerName(playerName);
            }

            // Clear the location state
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, []);

    return (
        <div>
            {message && <ErrorPopup message={message} trigger={trigger} />}
            <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className='max-w-4xl p-6 mx-auto rounded-md shadow-md'>
                {activeTab === Tab.CreateGame && <CreateGameBox playerName={playerName} setPlayerName={setPlayerName} />}
                {activeTab === Tab.JoinGame && <JoinGameBox setMessage={setMessageAndRefresh} playerName={playerName} setPlayerName={setPlayerName} roomCode={roomCode} setRoomCode={setRoomCode} />}
            </div>
        </div>
    );
};

export default LandingPage;
