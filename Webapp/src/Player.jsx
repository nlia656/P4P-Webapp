import { useState, useRef, useEffect } from 'react';
import { useStudy } from './context/StudyContext';
import { exportAllData } from './utils/localStorage';
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
    setStudyPhase = () => {},
    recordRating = () => {}
  } = studyContext || {};

  const [isSAMOpen, setIsSAMOpen] = useState(false);
  const [showPauseMessage, setShowPauseMessage] = useState(false);
  const [lastRatingTime, setLastRatingTime] = useState(0);
  const [debugInfo, setDebugInfo] = useState('');
  const location = useLocation();
  const links = location.state?.links || [];
  const [videoIndex, setVideoIndex] = useState(location.state?.id || []);
  const playerRef = useRef(null);

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
      setDebugInfo(`Auto-triggering rating at ${Math.floor(time || 0)}s`);
      handlePauseForRating();
      setLastRatingTime(Math.floor(time || 0));
    }
  };

  // Handle video end
  const handleVideoEnd = () => {
    setDebugInfo('Video ended');
    let nextIndex = videoIndex + 1;
    if (nextIndex >= links.length){
      nextIndex = 0;
    }
    setVideoIndex(nextIndex);
    setCurrentVideo(links[nextIndex]);
    handleLastSam();
  };

  const handleLastSam = () => {
      if ((videoTime%60)>20){
      setIsSAMOpen(true);
    }
  }

  // Handle video pause
  const handleVideoPause = () => {
    setDebugInfo('Video paused');
  };

  // Handle video play
  const handleVideoPlay = () => {
    setDebugInfo('Video playing');
    setShowPauseMessage(false);
  };

  // Pause video for rating
  const handlePauseForRating = () => {
    setDebugInfo('Attempting to pause video for rating');
    
    try {

      // && playerRef.current.player
      if (playerRef.current) {
        //playerRef.current.player.pauseVideo();
        playerRef.current.pauseVideo();
        setPaused(true);
        setShowPauseMessage(true);
        setIsSAMOpen(true);
        setDebugInfo('Video paused, SAM popup opened');
      } else {
        setDebugInfo('Player reference not available');
      }
    } catch (error) {
      setDebugInfo(`Error pausing video: ${error.message}`);
    }
  };

  // Handle SAM rating completion
  const handleSAMComplete = (valenceRating, arousalRating) => {
    setDebugInfo(`Rating completed: V${valenceRating}, A${arousalRating}`);

    // Persist rating against current session
    try {
      recordRating({
        videoId: currentVideo?.id || '',
        videoTimeSec: Math.floor(videoTime || 0),
        valence: valenceRating,
        arousal: arousalRating
      });
    } catch (e) {
      console.error('recordRating failed:', e);
    }
    
    setIsSAMOpen(false);
    setShowPauseMessage(false);
    
    // Resume video after rating
    if (playerRef.current) {
      setTimeout(() => {
        //playerRef.current.player.playVideo();
        playerRef.current.playVideo();
        setPaused(false);
        setDebugInfo('Video resumed after rating');
      }, 500);
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
      setDebugInfo(`Error in manual control: ${error.message}`);
    }
  };

  // const handlePrev = () => {
  //   setCurrentIndex((idx) => (idx > 0 ? idx - 1 : 0));
  // };

  // const handleNext = () => {
  //   setCurrentIndex((idx) => (idx < playlist.length - 1 ? idx + 1 : idx));
  // };

  // Handle SAM popup close
  const handleSAMClose = () => {
    setIsSAMOpen(false);
    setShowPauseMessage(false);
    
    if (isPaused && playerRef.current && playerRef.current.player) {
      playerRef.current.player.playVideo();
      setPaused(false);
      setDebugInfo('Video resumed after popup close');
    }
  };

  // Test function to manually open SAM popup
  const testSAMPopup = () => {
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

  // Progress calculations
  // const safeDuration = duration || (playerRef.current?.getDuration?.() ?? 0) || 0;
  // const progress = safeDuration > 0 ? Math.min(100, Math.max(0, (videoTime / safeDuration) * 100)) : 0;
  // const remaining = Math.max(0, safeDuration - videoTime);

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
          currentVideo.type === "youtube" ? (
            <YouTubePlayer
              ref={playerRef}
              videoId={currentVideo.id}
              onVideoEnd={handleVideoEnd}
              onVideoPause={handleVideoPause}
              onVideoPlay={handleVideoPlay}
              onTimeUpdate={handleTimeUpdate}
              isPaused={isPaused}
            />
          ) : currentVideo.type === "mp4" ? (
              <MP4Player
              ref={playerRef}
              videoSrc={mp4test}
              onVideoEnd={handleVideoEnd}
              onVideoPause={handleVideoPause}
              onVideoPlay={handleVideoPlay}
              onTimeUpdate={handleTimeUpdate}
              isPaused={isPaused}
            />
          ) : null
        )}
      </div>

      {/* Progress Bar */}
      {/* <div style={{ width: '100%', maxWidth: 800, margin: '0.75rem auto 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666' }}>
          <span>Progress</span>
          <span>{Math.floor(videoTime)}s / {Math.floor(safeDuration)}s · Remaining {Math.floor(remaining)}s</span>
        </div>
        <div style={{ height: 10, background: '#eee', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: '#667eea' }} />
        </div>
      </div> */}

      <div className="player-controls">
        <button 
          className="control-button"
          onClick={handlePauseResume}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>
        
        {/* <button 
          className="control-button"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          Prev
        </button> */}

        {/* <button 
          className="control-button"
          onClick={handleNext}
          disabled={currentIndex >= playlist.length - 1}
        >
          Next
        </button> */}

        <button 
          className="control-button"
          onClick={testSAMPopup}
          style={{ backgroundColor: '#dc3545' }}
        >
          Test SAM Popup
        </button>

        <button 
          className="control-button"
          onClick={exportAllData}
          style={{ backgroundColor: '#198754' }}
        >
          Export Data (JSON)
        </button>

        <div className="video-info">
          <span>Current Time: {Math.floor(videoTime || 0)}s</span>
          <span>Video: {currentVideo?.name || 'No Video'}</span>
          <span>Status: {isPaused ? 'Paused' : 'Playing'}</span>
          <span>Clip {videoIndex + 1}/{links.length}</span>
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
