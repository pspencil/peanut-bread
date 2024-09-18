import LandingPage from './LandingPage';
import { WebSocketProvider } from './WebSocketContext';
import './App.css'

function App() {
  return (
    <div className="App">
      <WebSocketProvider>
        <header className="App-header">
          <h1>One Night Werewolf</h1>
          <LandingPage />
        </header>
      </WebSocketProvider>
    </div>
  );
}

export default App
