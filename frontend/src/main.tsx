import { StrictMode, useCallback, useContext, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Root from './routes/Root.tsx'
import Room from './routes/Room.tsx'
import './index.css'
import { BackendWrapper, useWebSocket, WebSocketContext, WebSocketProvider } from './WebSocketContext.tsx'
import { StatusPopup } from './Popup.tsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />
  },
  {
    path: "/room/:roomCode",
    element: <Room />,
  },
]);

function StatusIndicator() {
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WebSocketProvider>
      <StatusIndicator />
      <RouterProvider router={router} />
    </WebSocketProvider>
  </StrictMode>,
)
