import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Root from './routes/Root.tsx'
import Room from './routes/Room.tsx'
import './index.css'
import { WebSocketProvider } from './WebSocketContext.tsx'
import StatusIndicator from './StatusIndicator.tsx'

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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WebSocketProvider>
      <StatusIndicator />
      <RouterProvider router={router} />
    </WebSocketProvider>
  </StrictMode>,
)
