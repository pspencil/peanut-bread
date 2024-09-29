import React, { useEffect, useState } from 'react';

interface ErrorPopupProps {
    message: string;
    duration?: number;
    trigger: number;
}

const ErrorPopup: React.FC<ErrorPopupProps> = ({ message, duration = 3000, trigger }) => {
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        // Trigger the animation whenever the message or duration changes
        setIsAnimating(true);

        // Reset the animation after the specified duration
        const timer = setTimeout(() => {
            setIsAnimating(false);
        }, duration);

        // Cleanup the timeout when component unmounts or message/duration changes
        return () => clearTimeout(timer);
    }, [trigger, duration]);

    return (
        <span
            className={`fixed bg-red-500 top-4 right-4 text-white px-6 py-3 rounded ${isAnimating ? 'animate-fade' : 'opacity-0'
                }`}
        >
            {message}
        </span>
    );
};

interface StatusPopupProps {
    connected: boolean;
}

const StatusPopup: React.FC<StatusPopupProps> = ({ connected }) => {
    const message = connected ? "Connected" : "Disconnected";
    const bg = connected ? "bg-green-500" : "bg-red-500";
    return (
        <span
            className={`fixed ${bg} bottom-4 right-4 text-white px-6 py-3 rounded`}>
            {message}
        </span>
    );
};

export { ErrorPopup, StatusPopup };
