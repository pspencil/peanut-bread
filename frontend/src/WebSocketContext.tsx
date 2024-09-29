import { useEffect, createContext, useState, useContext } from "react";

const wsUrl = ((window.location.protocol == "https:" && "wss://") || "ws://") +
    window.location.host +
    "/ws";

interface RoomInfo {
    players: string[], host: string
}

interface ServerMessageMap {
    RoomCreated: { room_code: string };
    PlayerJoined: { player_name: string };
    RoomDoesNotExist: {};
    RoomExists: {};
    PlayerExists: {};
    Kicked: {};
    RoomInfo: RoomInfo;
}

type ServerMessage = {
    [K in keyof ServerMessageMap]: { action: K } & ServerMessageMap[K];
}[keyof ServerMessageMap];

type ServerAction = ServerMessage['action'];

type Callback = (message: ServerMessage) => void

type ClientMap<T> = { [id: string]: T }

// TODO
type ClientMessage =
    | { action: 'CreateGame'; player_name: string }
    | { action: 'JoinGame'; player_name: string; room_code: string }
    | { action: 'LeaveGame'; player_name: string; room_code: string }
    | { action: 'GetRoomInfo'; room_code: string }
    | { action: 'Kick'; player_name: string; room_code: string };

type Props = {
    children?: React.ReactNode
}


class BackendWrapper {
    wsUrl: string
    ws: WebSocket | null;
    clients: { [id: string]: ClientMap<Callback> }
    connected: boolean
    status_listeners: ClientMap<(status: boolean) => void>

    constructor(wsUrl: string) {
        this.clients = {};
        this.wsUrl = wsUrl;
        this.ws = null;
        this.connected = false;
        this.status_listeners = {};
    }
    private notifyStatusListeners() {
        Object.values(this.status_listeners).forEach(listener => listener(this.connected));
    }

    connect() {
        this.ws = new WebSocket(wsUrl);
        this.ws.onopen = () => { this.connected = true; this.notifyStatusListeners(); };
        this.ws.onerror = (error) => {
            // Are we still connected?
            console.error("WebSocket Error", error);
        };
        this.ws.onclose = (event) => {
            this.connected = false;
            this.notifyStatusListeners();
            console.log("WebSocket closed. Code:", event.code, "Reason:", event.reason);
        };
        this.ws.onmessage = (message) => {
            console.log(`Received message ${message}`);
            try {
                const data: ServerMessage = JSON.parse(message.data as string);
                console.log("Received message", data);
                let clients = this.clients[data.action];
                if (!clients) {
                    return;
                }
                for (let client in clients) {
                    let callback = clients[client];
                    console.log(`Sending message to ${client}: ${message.data}`);
                    callback(data);
                }
            } catch (error) {
                console.error("Error processing WebSocket message:", error);
            }
        };
    }

    private subscribe(client_id: string, action: string, callback: Callback) {
        console.log(`${client_id} subscribing to ${action}`);
        if (!(action in this.clients)) {
            this.clients[action] = {};
        }
        this.clients[action][client_id] = callback;
    }

    public unsubscribe(client_id: string, action: string) {
        console.log(`${client_id} unsubscribing to ${action}`);
        if (action in this.clients) {
            delete this.clients[action][client_id];
        }
    }

    private send(message: ClientMessage) {
        const json = JSON.stringify(message);
        console.log(`Sending message ${json}`);
        this.ws?.send(json);
    };

    create_game(player_name: string) {
        this.send({ action: 'CreateGame', player_name })
    }

    join_game(player_name: string, room_code: string) {
        this.send({ action: 'JoinGame', player_name, room_code })
    }

    leave_game(player_name: string, room_code: string) {
        this.send({ action: 'LeaveGame', player_name, room_code })
    }

    kick(player_name: string, room_code: string) {
        this.send({ action: 'Kick', player_name, room_code })
    }

    get_room_info(room_code: string) {
        this.send({ action: 'GetRoomInfo', room_code })
    }

    on<K extends ServerAction>(
        client_id: string,
        action: K,
        callback: (data: ServerMessageMap[K]) => void
    ) {
        this.subscribe(client_id, action, (message) => {
            if (message.action == action) {
                const { action: _, ...payload } = message;
                callback(payload as ServerMessageMap[K]);
            }
        })
    }

    listen_to_status_change(client_id: string, callback: (connected: boolean) => void) {
        callback(this.connected);
        this.status_listeners[client_id] = callback;
    }

    stop_listening_to_status_change(client_id: string) {
        delete this.status_listeners[client_id];
    }

    when_ready(client_id: string, f: () => void) {
        this.listen_to_status_change(client_id, (connected: boolean) => {
            if (connected) {
                f();
                this.stop_listening_to_status_change(client_id);
            }
        });
    }

    close() {
        this.ws?.close();
    }
}

const WebSocketContext = createContext<BackendWrapper>(new BackendWrapper(wsUrl));


const WebSocketProvider: React.FC<Props> = ({ children }) => {
    const [wrapper] = useState(() => new BackendWrapper(wsUrl));

    useEffect(() => {
        wrapper.connect();
        return () => { wrapper.close() }
    }, []);

    return (
        <WebSocketContext.Provider value={wrapper} >
            {children}
        </WebSocketContext.Provider>
    );
}

function useWebSocket() {
    const context = useContext<BackendWrapper>(WebSocketContext);
    if (context === null) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
}

export { WebSocketProvider, WebSocketContext, useWebSocket };
export type { BackendWrapper, RoomInfo };
