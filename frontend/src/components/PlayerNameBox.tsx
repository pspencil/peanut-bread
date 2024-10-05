import { InputWithLabel } from './InputWithLabel';

export interface PlayerNameBoxProps {
    playerName: string;
    setPlayerName: (a: string) => void;
}

export function PlayerNameBox({ playerName, setPlayerName }: PlayerNameBoxProps) {
    return (
        <InputWithLabel value={playerName} setValue={setPlayerName} id="Username" placeholder='Enter your name' />
    );
}
