import { useState } from 'react'
import './App.css'
import { useNavigate } from "react-router-dom";
import videoLinks from "./Videos/videos.json";


function Home() {
  const navigate = useNavigate();

  return (
    <>
        <div>
            <label for="name">Please enter your full name: </label>
            <input type="text" id="name" autocomplete='off'></input>
        </div>
        <button style={{marginTop: 20}} onClick={()=>navigate("/player", {
            state:{
                links: videoLinks,
        }})}>Start</button>
    </>
  )
}

export default Home
