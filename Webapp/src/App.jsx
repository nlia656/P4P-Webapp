import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StudyProvider } from './context/StudyContext';
import Home from './Home';
import Player from './Player';
import './App.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  console.log('App component rendering');
  
  return (
    <StudyProvider>
      <BrowserRouter>
      <ToastContainer />
        <div className="app">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/player" element={<Player />} />
          </Routes>
        </div>
      </BrowserRouter>
    </StudyProvider>
  );
}

export default App;
