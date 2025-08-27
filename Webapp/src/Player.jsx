import { useState } from 'react'
import SAMPopup from './SAMScale/SAMPopup';
import './Player.css'
import { useLocation, useNavigate } from "react-router-dom";

function Player() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const links = location.state?.links || [];
  const [videoIndex, setVideoIndex] = useState(0);
  const [currentVideo, setCurrentVideo] = useState(links[videoIndex] || null);
  

  return (
      <div className='video-player'>
        <SAMPopup open={isOpen} onClose={() => setIsOpen(false)}></SAMPopup>
        <iframe 
          width="1120" 
          height="630" 
          src={currentVideo.link} 
          title="YouTube video player" 
          frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
          referrerpolicy="strict-origin-when-cross-origin">
        </iframe>
        <button onClick={() => {
            setIsOpen(true);
            setVideoIndex(prevIndex => {
                const nextIndex = prevIndex + 1;
                if (nextIndex < links.length) {
                    setCurrentVideo(links[nextIndex]);
                    return nextIndex;
                }
                return prevIndex; 
            });
        }}>
            Next
        </button>
      </div>
  )
}

export default Player
