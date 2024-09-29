import { useState, useCallback, useEffect } from "react";
import { StatusPopup } from "./Popup";
import { useWebSocket } from "./WebSocketContext";

export default function StatusIndicator() {
    const [connected, setConnected] = useState<boolean>(false);
    const wrapper = useWebSocket();

    const updateConnectionStatus = useCallback((status: boolean) => {
        setConnected(status);
    }, []);

    useEffect(() => {
        const client_id = "StatusIndicator";
        wrapper.listen_to_status_change(client_id, updateConnectionStatus);

        return () => {
            wrapper.stop_listening_to_status_change(client_id);
        }
    }, [wrapper, updateConnectionStatus])

    return <StatusPopup connected={connected} />;
}
