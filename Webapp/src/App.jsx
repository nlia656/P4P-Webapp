import { useState } from 'react'
import SAMPopup from './SAMScale/SAMPopup';
import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Player from './Player';
import Home from './Home';

function App() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />}></Route>
        <Route path="/player" element={<Player />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
