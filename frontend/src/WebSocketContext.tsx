import { useEffect, useRef, createContext, MutableRefObject } from "react";

const wsUrl = 'ws://127.0.0.1:3000/ws';

interface ServerMessageMap {
    RoomCreated: { room_code: string };
    PlayerJoined: { player_name: string };
}
type ServerMessage = {
    [K in keyof ServerMessageMap]: { action: K } & ServerMessageMap[K];
}[keyof ServerMessageMap];

type ServerAction = ServerMessage['action'];

type Callback = (message: ServerMessage) => void

// TODO
type ClientMessage =
    | { action: 'CreateGame'; player_name: string }
    | { action: 'JoinGame'; player_name: string; room_code: string };

type Props = {
    children?: React.ReactNode
}


class BackendWrapper {
    ws: WebSocket;
    clients: { [id: string]: Callback[] }

    constructor(wsUrl: string) {
        this.clients = {}
        this.ws = new WebSocket(wsUrl);
        this.ws.onopen = () => { console.log("Web Socket Open") };
        this.ws.onclose = () => { console.log("Web Socket Close") };
        this.ws.onmessage = (message) => {
            const data: ServerMessage = JSON.parse(message.data as string);
            this.clients[data.action]?.forEach(callback => {
                callback(data);
            });

        };
    }

    private subscribe(action: string, callback: Callback) {
        if (action in this.clients) {
            this.clients[action]!.push(callback);
        } else {
            this.clients[action] = [callback];
        }
    }

    private send(message: ClientMessage) {
        const json = JSON.stringify(message);
        this.ws.send(json);
    };

    create_game(player_name: string) {
        this.send({ action: 'CreateGame', player_name })
    }

    join_game(player_name: string, room_code: string) {
        this.send({ action: 'JoinGame', player_name, room_code })
    }

    on<K extends ServerAction>(
        action: K,
        callback: (data: ServerMessageMap[K]) => void
    ) {
        this.subscribe(action, (message) => {
            if (message.action == action) {
                const { action: _, ...payload } = message;
                callback(payload as ServerMessageMap[K]);
            }
        })
    }
    close() {
        this.ws.close();
    }
}

type Context = MutableRefObject<BackendWrapper | null> | null

const WebSocketContext = createContext<Context>(null)


const WebSocketProvider: React.FC<Props> = ({ children }) => {
    const wrapper = useRef<BackendWrapper | null>(null);

    useEffect(() => {
        wrapper.current = new BackendWrapper(wsUrl);
        return () => { wrapper.current?.close() }
    }, []);

    return (
        <WebSocketContext.Provider value={wrapper} >
            {children}
        </WebSocketContext.Provider>
    );
}

export { WebSocketProvider, WebSocketContext };
export type { BackendWrapper, Context };
