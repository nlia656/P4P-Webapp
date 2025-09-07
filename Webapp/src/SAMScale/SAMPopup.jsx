import { useState, useEffect } from 'react';
import './SAMPopup.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import valenceSAM from '../assets/SAMValence.png';
import arousalSAM from '../assets/SAMArousal.png';

function SAMPopup({ open, onClose, onComplete, currentTime = 0 }) {
  const [valenceRating, setValenceRating] = useState(null);
  const [arousalRating, setArousalRating] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.log('SAMPopup mounted, open state:', open);
  }, []);

  useEffect(() => {
    console.log('SAMPopup open state changed to:', open);
  }, [open]);

  if (!open || !mounted) {
    console.log('SAMPopup not rendering - open:', open, 'mounted:', mounted);
    return null;
  }

  console.log('SAMPopup rendering with open:', open);

  const handleValenceChange = (value) => {
    console.log('Valence rating changed to:', value);
    setValenceRating(parseInt(value));
  };

  const handleArousalChange = (value) => {
    console.log('Arousal rating changed to:', value);
    setArousalRating(parseInt(value));
  };

  const handleSubmit = () => {
    console.log('Submit clicked with ratings:', { valence: valenceRating, arousal: arousalRating });
    if (valenceRating !== null && arousalRating !== null) {
      onComplete(valenceRating, arousalRating);
      // Reset ratings for next use
      setValenceRating(null);
      setArousalRating(null);
    } else {
      alert('Please select ratings for both valence and arousal scales.');
    }
  };

  const handleClose = () => {
    console.log('Close clicked');
    // Reset ratings when closing without submitting
    setValenceRating(null);
    setArousalRating(null);
    onClose();
  };

  const isFormValid = valenceRating !== null && arousalRating !== null;

  return (
    <div className="sam-popup-overlay">
      <div className="overlay" onClick={handleClose}></div>
      <div className="modal">
        <nav className="close-button">
          <div className="circle-button" onClick={handleClose}>
            <FontAwesomeIcon icon={faXmark} size="lg" />
          </div>
        </nav>
        
        <div className="rating-header">
          <h2>Rate Your Current Emotions</h2>
          <p>Video Time: {Math.floor(currentTime)}s</p>
          <p>Please select one option for each scale below:</p>
        </div>

        <div className='scales'>
          <div className="valence-scale">
            <h3>Valence (Pleasure-Displeasure)</h3>
            <img src={valenceSAM} alt="Valence SAM Scale" />
            <div className="radio-buttons">
              <label>
                <input 
                  type="radio" 
                  name="valence" 
                  value="1"
                  checked={valenceRating === 1}
                  onChange={() => handleValenceChange(1)}
                />
                <span>1</span>
              </label>
              <label>
                <input 
                  type="radio" 
                  name="valence" 
                  value="2"
                  checked={valenceRating === 2}
                  onChange={() => handleValenceChange(2)}
                />
                <span>2</span>
              </label>
              <label>
                <input 
                  type="radio" 
                  name="valence" 
                  value="3"
                  checked={valenceRating === 3}
                  onChange={() => handleValenceChange(3)}
                />
                <span>3</span>
              </label>
              <label>
                <input 
                  type="radio" 
                  name="valence" 
                  value="4"
                  checked={valenceRating === 4}
                  onChange={() => handleValenceChange(4)}
                />
                <span>4</span>
              </label>
              <label>
                <input 
                  type="radio" 
                  name="valence" 
                  value="5"
                  checked={valenceRating === 5}
                  onChange={() => handleValenceChange(5)}
                />
                <span>5</span>
              </label>
            </div>
          </div>
          
          <div className="arousal-scale">
            <h3>Arousal (Calm-Excited)</h3>
            <img src={arousalSAM} alt="Arousal SAM Scale" />
            <div className="radio-buttons">
              <label>
                <input 
                  type="radio" 
                  name="arousal" 
                  value="1"
                  checked={arousalRating === 1}
                  onChange={() => handleArousalChange(1)}
                />
                <span>1</span>
              </label>
              <label>
                <input 
                  type="radio" 
                  name="arousal" 
                  value="2"
                  checked={arousalRating === 2}
                  onChange={() => handleArousalChange(2)}
                />
                <span>2</span>
              </label>
              <label>
                <input 
                  type="radio" 
                  name="arousal" 
                  value="3"
                  checked={arousalRating === 3}
                  onChange={() => handleArousalChange(3)}
                />
                <span>3</span>
              </label>
              <label>
                <input 
                  type="radio" 
                  name="arousal" 
                  value="4"
                  checked={arousalRating === 4}
                  onChange={() => handleArousalChange(4)}
                />
                <span>4</span>
              </label>
              <label>
                <input 
                  type="radio" 
                  name="arousal" 
                  value="5"
                  checked={arousalRating === 5}
                  onChange={() => handleArousalChange(5)}
                />
                <span>5</span>
              </label>
            </div>
          </div>
        </div>
        
        <div className="rating-summary">
          {valenceRating && arousalRating && (
            <div className="selected-ratings">
              <p>Selected Ratings:</p>
              <p>Valence: {valenceRating}, Arousal: {arousalRating}</p>
            </div>
          )}
        </div>

        <button 
          className="submit-button"
          onClick={handleSubmit}
          disabled={!isFormValid}
        >
          Submit Rating
        </button>
      </div>
    </div>
  );
}

export default SAMPopup;
