import { useState } from 'react'
import './App.css'
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <>
        <div>
            <label for="name">Please enter your full name: </label>
            <input type="text" id="name" autocomplete='off'></input>
        </div>
        <button style={{marginTop: 20}} onClick={()=>navigate("/player")}>Start</button>
    </>
  )
}

export default Home
