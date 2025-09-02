import { useState, useRef, useEffect } from 'react';
import { useStudy } from './context/StudyContext';
import YouTubePlayer from './components/YouTubePlayer';
import MP4Player from './components/MP4Player';
import SAMPopup from './SAMScale/SAMPopup';
import './App.css';
import { useLocation, useNavigate } from "react-router-dom";

//temp mp4
import mp4test from './videos/HVHA2.mp4';

function Player() {
  const studyContext = useStudy();
  
  // Destructure with default values to prevent null reference errors
  const { 
    participant = null, 
    currentSession = null, 
    currentVideo = null, 
    videoTime = 0, 
    isPaused = false, 
    setCurrentVideo = () => {}, 
    setVideoTime = () => {}, 
    setPaused = () => {},
    setStudyPhase = () => {} 
  } = studyContext || {};

  const [isSAMOpen, setIsSAMOpen] = useState(false);
  const [showPauseMessage, setShowPauseMessage] = useState(false);
  const [lastRatingTime, setLastRatingTime] = useState(0);
  const [debugInfo, setDebugInfo] = useState('');
  const playerRef = useRef(null);

  const location = useLocation();
  const links = location.state?.links || [];
  const [videoIndex, setVideoIndex] = useState(0);

  // Sample video for testing (this will be replaced with actual video management)
  const sampleVideo = {
    id: '983bBbJx0Mk',
    title: 'Sample Video',
    duration: 180, // 3 minutes for testing
    quadrant: 'high-valence-high-arousal'
  };

  // Initialize video when component mounts
  useEffect(() => {
    if (!currentVideo && setCurrentVideo) {
      setCurrentVideo(links[videoIndex] || null);
    }
  }, [currentVideo, setCurrentVideo]);

  // Handle video time updates
  const handleTimeUpdate = (time) => {
    setVideoTime(time || 0);
    
    // Check if it's time to pause for rating (every 60 seconds)
    // Only trigger if we haven't already rated at this time
    if (Math.floor(time || 0) > 0 && Math.floor(time || 0) % 60 === 0 && Math.floor(time || 0) !== lastRatingTime) {
      console.log('Time to rate emotions at:', Math.floor(time || 0), 'seconds');
      setDebugInfo(`Auto-triggering rating at ${Math.floor(time || 0)}s`);
      handlePauseForRating();
      setLastRatingTime(Math.floor(time || 0));
    }
  };

  // Handle video end
  const handleVideoEnd = () => {
    console.log('Video ended');
    setDebugInfo('Video ended');
    // TODO: Move to next video or end study
  };

  // Handle video pause
  const handleVideoPause = () => {
    console.log('Video paused');
    setDebugInfo('Video paused');
  };

  // Handle video play
  const handleVideoPlay = () => {
    console.log('Video playing');
    setDebugInfo('Video playing');
    setShowPauseMessage(false);
  };

  // Pause video for rating
  const handlePauseForRating = () => {
    console.log('Pausing video for rating');
    setDebugInfo('Attempting to pause video for rating');
    
    try {
      // && playerRef.current.player
      if (playerRef.current) {
        console.log('Player ref available, pausing video');
        //playerRef.current.player.pauseVideo();
        playerRef.current.pauseVideo();
        setPaused(true);
        setShowPauseMessage(true);
        setIsSAMOpen(true);
        setDebugInfo('Video paused, SAM popup opened');
      } else {
        console.error('Player reference not available');
        setDebugInfo('Player reference not available');
      }
    } catch (error) {
      console.error('Error pausing video:', error);
      setDebugInfo(`Error pausing video: ${error.message}`);
    }
  };

  // Handle SAM rating completion
  const handleSAMComplete = (valenceRating, arousalRating) => {
    console.log('SAM Rating completed:', { 
      valence: valenceRating, 
      arousal: arousalRating, 
      time: videoTime,
      timestamp: new Date().toISOString()
    });
    
    setDebugInfo(`Rating completed: V${valenceRating}, A${arousalRating}`);
    
    // TODO: Save rating data to session
    // TODO: Resume video or move to next phase
    
    setIsSAMOpen(false);
    setShowPauseMessage(false);
    
    // Resume video after rating
    if (playerRef.current) {
      setTimeout(() => {
        //playerRef.current.player.playVideo();
        playerRef.current.playVideo();
        setPaused(false);
        setDebugInfo('Video resumed after rating');
      }, 1000); // Small delay to show completion
    }
  };

  // Handle manual pause/resume
  const handlePauseResume = () => {
    try {
      if (playerRef.current) {
        if (isPaused) {
          //playerRef.current.player.playVideo();
          playerRef.current.playVideo();
          setPaused(false);
          setDebugInfo('Video resumed manually');
        } else {
          //playerRef.current.player.pauseVideo();
          playerRef.current.pauseVideo();
          setPaused(true);
          setDebugInfo('Video paused manually');
        }
      } else {
        setDebugInfo('Player reference not available for manual control');
      }
    } catch (error) {
      console.error('Error in manual pause/resume:', error);
      setDebugInfo(`Error in manual control: ${error.message}`);
    }
  };

  // Handle manual rating request
  const handleManualRating = () => {
    console.log('Manual rating requested');
    setDebugInfo('Manual rating requested');
    handlePauseForRating();
  };

  // Handle SAM popup close
  const handleSAMClose = () => {
    console.log('SAM popup closed');
    setDebugInfo('SAM popup closed');
    setIsSAMOpen(false);
    setShowPauseMessage(false);
    
    // Resume video if it was paused for rating
    if (isPaused && playerRef.current && playerRef.current.player) {
      playerRef.current.player.playVideo();
      setPaused(false);
      setDebugInfo('Video resumed after popup close');
    }
  };

  // Test function to manually open SAM popup
  const testSAMPopup = () => {
    console.log('Testing SAM popup');
    setDebugInfo('Testing SAM popup');
    setIsSAMOpen(true);
    setShowPauseMessage(true);
  };

  // Check if participant exists before rendering
  if (!participant) {
    return (
      <div className="error-container">
        <h2>Error: No participant found</h2>
        <p>Please return to the home page and register.</p>
        <p>Debug: Context available: {studyContext ? 'Yes' : 'No'}</p>
      </div>
    );
  }

  return (
    <div className="player-container">
      <div className="player-header">
        <h2>Emotion Study - Video Player</h2>
        <div className="participant-info">
          <span>Participant: {participant?.name || 'Unknown'}</span>
          <span>Session: {currentSession?.id || 'No Session'}</span>
        </div>
      </div>

      <div className="video-section">
        {currentVideo && (
          <YouTubePlayer
            ref={playerRef}
            videoId={currentVideo.id}
            onVideoEnd={handleVideoEnd}
            onVideoPause={handleVideoPause}
            onVideoPlay={handleVideoPlay}
            onTimeUpdate={handleTimeUpdate}
            isPaused={isPaused}
          />
          //  <MP4Player
          //   ref={playerRef}
          //   videoSrc={mp4test}
          //   onVideoEnd={handleVideoEnd}
          //   onVideoPause={handleVideoPause}
          //   onVideoPlay={handleVideoPlay}
          //   onTimeUpdate={handleTimeUpdate}
          //   isPaused={isPaused}
          // />
        )}
      </div>

      <div className="player-controls">
        <button 
          className="control-button"
          onClick={handlePauseResume}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>
        
        <button 
          className="control-button"
          onClick={handleManualRating}
        >
          Rate Emotions
        </button>

        <button 
          className="control-button"
          onClick={testSAMPopup}
          style={{ backgroundColor: '#dc3545' }}
        >
          Test SAM Popup
        </button>

        <div className="video-info">
          <span>Current Time: {Math.floor(videoTime || 0)}s</span>
          <span>Video: {currentVideo?.title || 'No Video'}</span>
          <span>Status: {isPaused ? 'Paused' : 'Playing'}</span>
        </div>
      </div>

      {showPauseMessage && (
        <div className="pause-message">
          <h3>Time for Emotion Rating!</h3>
          <p>The video has been paused. Please rate your current emotions using the SAM scale.</p>
        </div>
      )}

      {/* Debug info */}
      <div className="debug-info" style={{ fontSize: '12px', color: '#666', marginTop: '1rem', textAlign: 'left', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
        <h4>Debug Information:</h4>
        <p>• SAM Open: {(isSAMOpen || false).toString()}</p>
        <p>• Paused: {(isPaused || false).toString()}</p>
        <p>• Last Rating Time: {lastRatingTime || 0}s</p>
        <p>• Current Time: {Math.floor(videoTime || 0)}s</p>
        <p>• Player Ref Available: {(playerRef.current !== null).toString()}</p>
        <p>• Player Instance Available: {String(Boolean(playerRef.current && playerRef.current.player))}</p>
        <p>• Participant: {participant ? 'Yes' : 'No'}</p>
        <p>• Participant Name: {participant?.name || 'N/A'}</p>
        <p>• Context Available: {studyContext ? 'Yes' : 'No'}</p>
        <p>• Debug Info: {debugInfo || 'No debug info'}</p>
      </div>

      <SAMPopup 
        open={isSAMOpen} 
        onClose={handleSAMClose}
        onComplete={handleSAMComplete}
        currentTime={videoTime || 0}
      />
    </div>
  );
}

export default Player;
