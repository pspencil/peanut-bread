// src/App.tsx
import React from 'react';
import GameSetup from './LandingPage';
import { WebSocketProvider } from './WebSocketContext';

const App: React.FC = () => {
  return (
    <div className="App">
      <WebSocketProvider>
        <header className="App-header">
          <h1>One Night Werewolf</h1>
          <GameSetup />
        </header>
      </WebSocketProvider>
    </div>
  );
};

export default App;
