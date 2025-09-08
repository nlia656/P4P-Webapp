import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useStudy } from './context/StudyContext';
import './App.css';
import videoList from "./videos/videos.json";

function Home() {
  const navigate = useNavigate();
  const { setParticipant, startSession, setStudyPhase } = useStudy();
  const [participantName, setParticipantName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log('Home component rendering');

  const handleStartStudy = async () => {
    if (!participantName.trim()) {
      alert('Please enter your name to continue.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create participant object
      const participant = {
        id: `participant_${Date.now()}`,
        name: participantName.trim(),
        registrationDate: new Date().toISOString()
      };

      console.log('Creating participant:', participant);

      // Set participant in context
      setParticipant(participant);

      // Start study session
      const session = startSession(participant.id);
      console.log('Started session:', session);

      // Update study phase
      setStudyPhase('video');

      console.log('Navigating to player...');
      // Navigate to player
      navigate("/player", {
            state:{
                links: videoList,
        }});
    } catch (error) {
      console.error('Error starting study:', error);
      alert('Error starting study. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleStartStudy();
    }
  };

  return (
    <div className="home-container">
      <div className="welcome-section">
        <h1>Emotion Recognition Study</h1>
        <p>Welcome! This study will help us understand how different videos affect emotional responses.</p>
        <p>You will watch several videos and rate your emotions using the SAM scale.</p>
      </div>

      <div className="registration-form">
        <h2>Participant Registration</h2>
        <div className="input-group">
          <label htmlFor="name">Please enter your full name:</label>
          <input
            type="text"
            id="name"
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter your name"
            autoComplete="off"
            disabled={isSubmitting}
          />
        </div>
        
        <button 
          className="start-button"
          onClick={handleStartStudy}
          disabled={isSubmitting || !participantName.trim()}
        >
          {isSubmitting ? 'Starting...' : 'Start Study'}
        </button>
      </div>

      <div className="study-info">
        <h3>What to Expect:</h3>
        <ul>
          <li>You'll watch several videos</li>
          <li>Disclaimer: Videos may be disturbing</li>
          <li>Every minute, videos will pause for emotion ratings</li>
          <li>Use the SAM scale to rate your valence and arousal</li>
          <li>The study takes approximately 40 minutes</li>
          <li>You can pause and resume at any time</li>
        </ul>
      </div>
    </div>
  );
}

export default Home;
