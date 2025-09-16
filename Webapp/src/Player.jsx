import { useState, useRef, useEffect } from 'react';
import { captureWebcamBlob } from './utils/capture';
import { useStudy } from './context/StudyContext';
import { exportAllData } from './utils/localStorage';
import YouTubePlayer from './components/YouTubePlayer';
import MP4Player from './components/MP4Player';
import SAMPopup from './SAMScale/SAMPopup';
import './App.css';
import { useLocation, useNavigate } from "react-router-dom";

//temp mp4
import mp4test from './videos/HVHA2.mp4';
import PassiveSensor from './components/PassiveSensor';
import FusionSensor from './components/FusionSensor';

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
  const [videoIndex, setVideoIndex] = useState(0);
  const playerRef = useRef(null);
  const [advanceAfterSAM, setAdvanceAfterSAM] = useState(false);
  const [duration, setDuration] = useState(0);

useEffect(() => {
    if (!currentVideo && setCurrentVideo) {
      setCurrentVideo(links[videoIndex] || null);
    }
  }, [currentVideo, setCurrentVideo]);

  // Reset the last 60s checkpoint whenever the video changes
  useEffect(() => {
    setLastRatingTime(0);
  }, [currentVideo?.id]);

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

  // Handle video end → open SAM, advance after rating
  const handleVideoEnd = () => {
    setDebugInfo('Video ended');
    setAdvanceAfterSAM(true);
    setIsSAMOpen(true);
    setShowPauseMessage(true);
    setPaused(true);
  };

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

    // If rating was triggered at the end of a video, advance to next clip
    if (advanceAfterSAM) {
      let nextIndex = videoIndex + 1;
      if (nextIndex >= links.length) nextIndex = 0;
      setVideoIndex(nextIndex);
      setCurrentVideo(links[nextIndex] || null);
      setAdvanceAfterSAM(false);
      if (playerRef.current) {
        setTimeout(() => {
          playerRef.current.playVideo();
          setPaused(false);
          setDebugInfo('Next video started after end-of-video rating');
        }, 500);
      }
      return;
    }

    // Resume same video after mid-video rating
    if (playerRef.current) {
      setTimeout(() => {
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

  const handlePrev = () => {
    const prev = videoIndex > 0 ? videoIndex - 1 : 0;
    setVideoIndex(prev);
    setCurrentVideo(links[prev] || null);
  };

  const handleNext = () => {
    const next = videoIndex < links.length - 1 ? videoIndex + 1 : links.length - 1;
    setVideoIndex(next);
    setCurrentVideo(links[next] || null);
  };

  // Handle SAM popup close
  const handleSAMClose = () => {
    setIsSAMOpen(false);
    setShowPauseMessage(false);
    
    if (isPaused && playerRef.current) {
      playerRef.current.playVideo();
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
              onDuration={(d) => setDuration(d || 0)}
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
              onReady={(video) => setDuration((video && video.duration) || 0)}
            />
          ) : null
        )}
        {/* Headless passive and fusion runners */}
        <PassiveSensor />
        <FusionSensor />
      </div>

      <div className="player-controls">
        <button 
          className="control-button"
          onClick={handlePauseResume}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>

        <div className="video-info">
          <span>Current Time: {Math.floor(videoTime || 0)}s</span>
          <span>Video: {currentVideo?.name || currentVideo?.title || 'No Video'}</span>
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
