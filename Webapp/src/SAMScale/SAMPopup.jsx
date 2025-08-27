import { useState } from 'react'
import './SAMPopup.css'
import ReactDOM from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import valenceSAM from '../assets/SAMValence.png';
import arousalSAM from '../assets/SAMArousal.png';

function SAMPopup({open, onClose}) {

    if(!open){
        return null;
    }

  return ReactDOM.createPortal(
        <>
            <div className="overlay"></div>
            <div className="modal">
                <nav className="close-button">
                    <div className="circle-button" onClick={onClose}>
                        <FontAwesomeIcon icon={faXmark} size="lg" />
                    </div>
                </nav>
                <div className='scales'>
                    <div className="valence-scale">
                        <img src={valenceSAM}></img>
                        <div className="radio-buttons">
                            <input type="radio" name="valence" value="1"></input>
                            <input type="radio" name="valence" value="2"></input>
                            <input type="radio" name="valence" value="3"></input>
                            <input type="radio" name="valence" value="4"></input>
                        </div>
                    </div>
                    <div className="arousal-scale">
                        <img src={arousalSAM}></img>
                        <div className="radio-buttons">
                            <input type="radio" name="arousal" value="1"></input>
                            <input type="radio" name="arousal" value="2"></input>
                            <input type="radio" name="arousal" value="3"></input>
                            <input type="radio" name="arousal" value="4"></input>
                        </div>
                    </div>
                </div>
                <button>Next</button>
            </div>
        </>,
        document.getElementById("portal")
    )
}

export default SAMPopup
