import { Role, RoleArray, ofRustRole, roleName, toRustRole } from "../GameConstants";
import { RoomInfo, useWebSocket } from "../WebSocketContext";
import { InlineButton, NormalButton } from "../components/Button";
import React from "react";

interface PlayerBarProps {
    roomCode: string,
    roomInfo: RoomInfo
    playerName: string
}

function PlayerBar({ playerName, roomInfo, roomCode }: PlayerBarProps) {
    const wrapper = useWebSocket();

    function kick(player: string, roomCode: string) {
        return () => {
            wrapper.kick(player, roomCode);
        }
    }

    const playerString = roomInfo.players.map((player: string, index: number) => (
        <React.Fragment key={player}>
            {index > 0 && ', '}
            <span className={player === roomInfo.host ? "font-bold" : ""}>
                {player}
            </span>
            {player !== roomInfo.host && playerName === roomInfo.host && <InlineButton onClick={kick(player, roomCode)} text="[kick]" />}
        </React.Fragment>
    ));


    return (
        <div className="text-white p-4">
            <p >Players: {playerString}</p>
        </div>
    );
}

interface CounterWithLabelProps {
    label: string;
    value: number;
    setValue: (n: number) => void;
    disabled: boolean;
}

function CounterWithLabel({ label, value, setValue, disabled }: CounterWithLabelProps) {

    function increment() {
        if (!disabled) {
            setValue(value + 1);
        }
    }

    function decrement() {
        if (value > 0 && !disabled) {
            setValue(value - 1);
        }
    }

    const buttonClass = `size-10 inline-flex justify-center items-center gap-x-2 text-lg font-medium rounded-md border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800 dark:focus:bg-neutral-800 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;
    const inputClass = `p-0 w-6 bg-transparent border-0 text-gray-800 text-center focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none dark:text-white ${disabled ? 'opacity-50' : ''}`
    const svgClass = "shrink-0 size-4";
    const textClass = `text-lg dark:text-white ${disabled ? 'opacity-50' : ''}`;
    return (
        <div className="flex items-center gap-x-1.5">
            <button
                type="button"
                onClick={decrement}
                className={buttonClass}
                disabled={disabled}
                aria-label="Decrease"
                data-hs-input-number-decrement="">
                <svg className={svgClass} xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    <path d="M5 12h14"></path>
                </svg>
            </button>
            <span className={inputClass} >{value}</span>
            <button
                type="button"
                onClick={increment}
                className={buttonClass}
                disabled={disabled}
                aria-label="Increase"
                data-hs-input-number-increment="">
                <svg className={svgClass}
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    <path d="M5 12h14"></path>
                    <path d="M12 5v14"></path>
                </svg>
            </button>
            <span className={textClass}>{label}</span>
        </div>
    );
}

type Roles = { [K in Role]: number };

function ofRustRoles(rustRoles: { [id: string]: number }): Roles {
    return Object.fromEntries(Object.entries(rustRoles).map(([rustRole, number]) => {
        return [ofRustRole(rustRole), number]
    })) as Roles;
}

interface RoleSelectionProps {
    isHost: boolean,
    roles: Roles,
    changeRole: (role: Role, diff: number) => void
}

function RoleSelection({ isHost, roles, changeRole }: RoleSelectionProps) {
    function setValue(role: Role) {
        return (value: number) => {
            changeRole(role, value);
        }
    }
    const containerClass = "space-y-2.5";
    return (
        <div className={containerClass}>
            {RoleArray.map((role) => (
                <CounterWithLabel
                    key={role}
                    label={roleName(role as Role)}
                    value={roles[role as Role]}
                    setValue={setValue(role as Role)}
                    disabled={!isHost}
                />
            ))}
        </div>
    );
}

function StartGame() {
    function handleStartGame() {
        console.log("TODO: start game")
    }

    return <NormalButton onClick={handleStartGame} text="Start Game" />;
}

interface RoomConfigurationProps {
    roomCode: string,
    roomInfo: RoomInfo
    playerName: string
}

export function RoomConfiguration({ roomInfo, roomCode, playerName }: RoomConfigurationProps) {
    const wrapper = useWebSocket();
    const roles = ofRustRoles(roomInfo.roles);

    function changeRole(role: Role, count: number) {
        wrapper.change_role(toRustRole(role), roomCode, count);
    }

    const isHost = playerName == roomInfo.host;
    return (
        <div className='max-w-4xl p-6 mx-auto rounded-md shadow-md'>
            <div className="grid grid-cols-1 gap-6 mt-4">
                <RoleSelection isHost={isHost} roles={roles} changeRole={changeRole} />
                <PlayerBar roomInfo={roomInfo} roomCode={roomCode} playerName={playerName} />
                <StartGame />
            </div>
        </div>
    );
}