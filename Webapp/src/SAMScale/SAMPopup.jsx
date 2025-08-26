import { useState } from 'react'
import './SAMPopup.css'
import ReactDOM from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

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
            </div>
        </>,
        document.getElementById("portal")
    )
}

export default SAMPopup
