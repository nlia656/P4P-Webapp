import { useState } from 'react'
import './App.css'

function Home() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
        <div>
            <label for="name">Please enter your full name: </label>
            <input type="text" id="name"></input>
        </div>
        <button></button>
    </>
  )
}

export default Home
