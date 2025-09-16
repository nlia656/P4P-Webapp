import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StudyProvider } from './context/StudyContext';
import Landing from './Landing';
import Home from './Home';
import Admin from './Admin';
import Player from './Player';
import './App.css';

function App() {
  console.log('App component rendering');
  
  return (
    <StudyProvider>
      <BrowserRouter>
        <div className="app">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/home" element={<Home />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/player" element={<Player />} />
          </Routes>
        </div>
      </BrowserRouter>
    </StudyProvider>
  );
}

export default App;
