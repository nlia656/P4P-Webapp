import { useState } from 'react'
import SAMPopup from './SAMScale/SAMPopup';
import './App.css'

function App() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div>
        <SAMPopup open={isOpen} onClose={() => setIsOpen(false)}></SAMPopup>
        <iframe 
          width="1120" 
          height="630" 
          src="https://www.youtube.com/embed/983bBbJx0Mk?si=uyldbZ9fKwIGtKtn" 
          title="YouTube video player" 
          frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
          referrerpolicy="strict-origin-when-cross-origin">
        </iframe>
        <button onClick={() => setIsOpen(true)}>Open Modal</button>
      </div>
    </>
  )
}

export default App
