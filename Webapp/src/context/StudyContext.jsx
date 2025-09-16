import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { 
  saveParticipantData, 
  getParticipantData, 
  saveSessionData, 
  getSessionData,
  saveStudyConfig,
  getStudyConfig,
  isStorageAvailable,
  setCurrentParticipantId,
  getCurrentParticipantId,
  setCurrentSessionId,
  getCurrentSessionId
} from '../utils/localStorage';

// Initial state
const initialState = {
  participant: null,
  currentSession: null,
  studyConfig: null,
  isStorageAvailable: false,
  currentVideo: null,
  videoTime: 0,
  isPaused: false,
  studyPhase: 'registration', // registration, video, rating, complete
  error: null,
  webcamStream: null,
  isWebcamActive: false,
  showWebcam: false,
  webcamDevices: [],
  selectedWebcamId: null,
  webcamError: null,
  visualPredictions: [],
  passivePredictions: [],
  fusedPredictions: []
};

// Action types
const STUDY_ACTIONS = {
  SET_PARTICIPANT: 'SET_PARTICIPANT',
  SET_SESSION: 'SET_SESSION',
  SET_STUDY_CONFIG: 'SET_STUDY_CONFIG',
  SET_STORAGE_AVAILABLE: 'SET_STORAGE_AVAILABLE',
  SET_CURRENT_VIDEO: 'SET_CURRENT_VIDEO',
  SET_VIDEO_TIME: 'SET_VIDEO_TIME',
  SET_PAUSED: 'SET_PAUSED',
  SET_STUDY_PHASE: 'SET_STUDY_PHASE',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  RESET_STUDY: 'RESET_STUDY',
  SET_WEBCAM_STREAM: 'SET_WEBCAM_STREAM',
  SET_WEBCAM_ACTIVE: 'SET_WEBCAM_ACTIVE',
  SET_SHOW_WEBCAM: 'SET_SHOW_WEBCAM',
  SET_WEBCAM_DEVICES: 'SET_WEBCAM_DEVICES',
  SET_SELECTED_WEBCAM_ID: 'SET_SELECTED_WEBCAM_ID',
  SET_WEBCAM_ERROR: 'SET_WEBCAM_ERROR'
};

// Reducer function
const studyReducer = (state, action) => {
  switch (action.type) {
    case STUDY_ACTIONS.SET_PARTICIPANT:
      return { ...state, participant: action.payload };
    
    case STUDY_ACTIONS.SET_SESSION:
      return { ...state, currentSession: action.payload };
    
    case STUDY_ACTIONS.SET_STUDY_CONFIG:
      return { ...state, studyConfig: action.payload };
    
    case STUDY_ACTIONS.SET_STORAGE_AVAILABLE:
      return { ...state, isStorageAvailable: action.payload };
    
    case STUDY_ACTIONS.SET_CURRENT_VIDEO:
      return { ...state, currentVideo: action.payload };
    
    case STUDY_ACTIONS.SET_VIDEO_TIME:
      return { ...state, videoTime: action.payload };
    
    case STUDY_ACTIONS.SET_PAUSED:
      return { ...state, isPaused: action.payload };
    
    case STUDY_ACTIONS.SET_STUDY_PHASE:
      return { ...state, studyPhase: action.payload };
    
    case STUDY_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    
    case STUDY_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    
    case STUDY_ACTIONS.RESET_STUDY:
      return { ...initialState, isStorageAvailable: state.isStorageAvailable };

    case STUDY_ACTIONS.SET_WEBCAM_STREAM:
      return { ...state, webcamStream: action.payload };

    case STUDY_ACTIONS.SET_WEBCAM_ACTIVE:
      return { ...state, isWebcamActive: action.payload };

    case STUDY_ACTIONS.SET_SHOW_WEBCAM:
      return { ...state, showWebcam: action.payload };

    case STUDY_ACTIONS.SET_WEBCAM_DEVICES:
      return { ...state, webcamDevices: action.payload };

    case STUDY_ACTIONS.SET_SELECTED_WEBCAM_ID:
      return { ...state, selectedWebcamId: action.payload };

    case STUDY_ACTIONS.SET_WEBCAM_ERROR:
      return { ...state, webcamError: action.payload };
    
    case 'ADD_VISUAL_PREDICTION':
      return { ...state, visualPredictions: [...(state.visualPredictions || []), action.payload] };

    case 'ADD_PASSIVE_PREDICTION':
      return { ...state, passivePredictions: [...(state.passivePredictions || []), action.payload] };

    case 'ADD_FUSED_PREDICTION':
      return { ...state, fusedPredictions: [...(state.fusedPredictions || []), action.payload] };
    
    default:
      return state;
  }
};

// Create context
const StudyContext = createContext();

// Provider component
export const StudyProvider = ({ children }) => {
  const [state, dispatch] = useReducer(studyReducer, initialState);

  //console.log('StudyProvider rendering with state:', state);

  // Check storage availability on mount and rehydrate session/participant
  useEffect(() => {
    const init = async () => {
      console.log('StudyProvider: Checking storage availability...');
      const available = isStorageAvailable();
      console.log('StudyProvider: Storage available:', available);
      dispatch({ type: STUDY_ACTIONS.SET_STORAGE_AVAILABLE, payload: available });
      
      if (!available) return;

      // Load existing study configuration
      const config = getStudyConfig();
      if (config) {
        console.log('StudyProvider: Loaded existing config:', config);
        dispatch({ type: STUDY_ACTIONS.SET_STUDY_CONFIG, payload: config });
      }

      // Rehydrate participant and session if IDs exist
      const pid = getCurrentParticipantId();
      const sid = getCurrentSessionId();
      if (pid) {
        const p = getParticipantData(pid);
        if (p) {
          dispatch({ type: STUDY_ACTIONS.SET_PARTICIPANT, payload: p });
          // If participant exists, move phase to video by default
          dispatch({ type: STUDY_ACTIONS.SET_STUDY_PHASE, payload: 'video' });
        }
      }
      if (sid) {
        const s = getSessionData(sid);
        if (s) {
          dispatch({ type: STUDY_ACTIONS.SET_SESSION, payload: s });
        }
      }
    };
    
    init();
  }, []);

  // Actions
  const actions = {
    // Participant management
    setParticipant: (participant) => {
      console.log('StudyProvider: Setting participant:', participant);
      dispatch({ type: STUDY_ACTIONS.SET_PARTICIPANT, payload: participant });
      if (state.isStorageAvailable && participant) {
        saveParticipantData(participant.id, participant);
        setCurrentParticipantId(participant.id);
      }
    },

    // Session management
    startSession: (participantId) => {
      console.log('StudyProvider: Starting session for participant:', participantId);
      const session = {
        id: `session_${Date.now()}`,
        participantId,
        startTime: new Date().toISOString(),
        status: 'active',
        videos: [],
        ratings: [],
        visualPredictions: [],
        passivePredictions: [],
        fusedPredictions: []
      };
      
      dispatch({ type: STUDY_ACTIONS.SET_SESSION, payload: session });
      
      if (state.isStorageAvailable) {
        saveSessionData(session.id, session);
        setCurrentSessionId(session.id);
      }
      
      return session;
    },

    updateSession: (updates) => {
      console.log('StudyProvider: Updating session:', updates);
      const updatedSession = { ...state.currentSession, ...updates };
      dispatch({ type: STUDY_ACTIONS.SET_SESSION, payload: updatedSession });
      
      if (state.isStorageAvailable && updatedSession) {
        saveSessionData(updatedSession.id, updatedSession);
      }
    },

    // Video management
    setCurrentVideo: (video) => {
      console.log('StudyProvider: Setting current video:', video);
      dispatch({ type: STUDY_ACTIONS.SET_CURRENT_VIDEO, payload: video });

      // Track viewed videos in session list
      const session = state.currentSession;
      if (session && video) {
        const videos = Array.isArray(session.videos) ? session.videos.slice() : [];
        const exists = videos.find(v => v.id === video.id);
        if (!exists) {
          videos.push({ id: video.id, name: video.name || '', firstSeenAt: new Date().toISOString() });
          const updatedSession = { ...session, videos };
          dispatch({ type: STUDY_ACTIONS.SET_SESSION, payload: updatedSession });
          if (state.isStorageAvailable) saveSessionData(updatedSession.id, updatedSession);
        }
      }
    },

    setVideoTime: (time) => {
      dispatch({ type: STUDY_ACTIONS.SET_VIDEO_TIME, payload: time });
    },

    setPaused: (paused) => {
      console.log('StudyProvider: Setting paused state:', paused);
      dispatch({ type: STUDY_ACTIONS.SET_PAUSED, payload: paused });
    },

    // Study phase management
    setStudyPhase: (phase) => {
      console.log('StudyProvider: Setting study phase:', phase);
      dispatch({ type: STUDY_ACTIONS.SET_STUDY_PHASE, payload: phase });
    },

    // Record a SAM rating for the current session
    recordRating: ({ videoId, videoTimeSec, valence, arousal }) => {
      try {
        if (!state.currentSession) return;
        const ratings = Array.isArray(state.currentSession.ratings) ? state.currentSession.ratings.slice() : [];
        ratings.push({
          id: `rating_${Date.now()}`,
          videoId,
          videoTimeSec,
          valence,
          arousal,
          recordedAt: new Date().toISOString()
        });
        const updatedSession = { ...state.currentSession, ratings };
        dispatch({ type: STUDY_ACTIONS.SET_SESSION, payload: updatedSession });
        if (state.isStorageAvailable) saveSessionData(updatedSession.id, updatedSession);
      } catch (e) {
        console.error('recordRating error:', e);
      }
    },

    // Configuration management
    setStudyConfig: (config) => {
      console.log('StudyProvider: Setting study config:', config);
      dispatch({ type: STUDY_ACTIONS.SET_STUDY_CONFIG, payload: config });
      
      if (state.isStorageAvailable) {
        saveStudyConfig(config);
      }
    },

    // Error handling
    setError: (error) => {
      console.error('StudyProvider: Setting error:', error);
      dispatch({ type: STUDY_ACTIONS.SET_ERROR, payload: error });
    },

    clearError: () => {
      dispatch({ type: STUDY_ACTIONS.CLEAR_ERROR });
    },

    // Reset study
    resetStudy: () => {
      console.log('StudyProvider: Resetting study');
      try {
        if (state.webcamStream) {
          state.webcamStream.getTracks().forEach(t => t.stop());
        }
      } catch (e) {
        console.warn('StudyProvider: Error stopping webcam on reset:', e);
      }
      dispatch({ type: STUDY_ACTIONS.RESET_STUDY });
    },

    // Webcam controls
    startWebcam: async (deviceId) => {
      try {
        if (state.isWebcamActive && state.webcamStream) {
          return state.webcamStream;
        }
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('getUserMedia not supported in this browser');
        }
        console.log('StudyProvider: Requesting webcam access...');
        const idealConstraints = deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30, max: 60 } }
          : { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30, max: 60 } };

        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: idealConstraints, audio: false });
        } catch (e1) {
          console.warn('1080p constraints failed, trying 1280x720...', e1);
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: deviceId ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } } : { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
              audio: false
            });
          } catch (e2) {
            console.warn('720p constraints failed, falling back to default...', e2);
            stream = await navigator.mediaDevices.getUserMedia({ video: deviceId ? { deviceId: { exact: deviceId } } : true, audio: false });
          }
        }

        try {
          const track = stream.getVideoTracks && stream.getVideoTracks()[0];
          if (track && track.applyConstraints) {
            const hardConstraints = deviceId
              ? { deviceId: { exact: deviceId }, width: { min: 1280, ideal: 1920 }, height: { min: 720, ideal: 1080 }, frameRate: { min: 24, ideal: 30 } }
              : { width: { min: 1280, ideal: 1920 }, height: { min: 720, ideal: 1080 }, frameRate: { min: 24, ideal: 30 } };
            await track.applyConstraints(hardConstraints).catch(() => {});
          }
        } catch (e) {
          console.warn('applyConstraints failed:', e);
        }

        const settings = (stream.getVideoTracks && stream.getVideoTracks()[0] && stream.getVideoTracks()[0].getSettings && stream.getVideoTracks()[0].getSettings()) || {};
        console.log('Webcam settings:', settings);

        dispatch({ type: STUDY_ACTIONS.SET_WEBCAM_STREAM, payload: stream });
        dispatch({ type: STUDY_ACTIONS.SET_WEBCAM_ACTIVE, payload: true });
        dispatch({ type: STUDY_ACTIONS.SET_WEBCAM_ERROR, payload: null });
        return stream;
      } catch (err) {
        console.error('StudyProvider: startWebcam error:', err);
        dispatch({ type: STUDY_ACTIONS.SET_WEBCAM_ACTIVE, payload: false });
        dispatch({ type: STUDY_ACTIONS.SET_WEBCAM_STREAM, payload: null });
        dispatch({ type: STUDY_ACTIONS.SET_WEBCAM_ERROR, payload: String(err?.message || err) });
        dispatch({ type: STUDY_ACTIONS.SET_ERROR, payload: String(err?.message || err) });
        throw err;
      }
    },

    stopWebcam: () => {
      try {
        if (state.webcamStream) {
          state.webcamStream.getTracks().forEach(t => t.stop());
        }
      } catch (e) {
        console.warn('StudyProvider: stopWebcam warning:', e);
      } finally {
        dispatch({ type: STUDY_ACTIONS.SET_WEBCAM_STREAM, payload: null });
        dispatch({ type: STUDY_ACTIONS.SET_WEBCAM_ACTIVE, payload: false });
      }
    },

    // Capture a single frame from the active webcam as a data URL
    captureWebcamFrameDataUrl: (mime = 'image/jpeg', quality = 0.8) => {
      try {
        const stream = state.webcamStream;
        if (!state.isWebcamActive || !stream) return null;
        const track = stream.getVideoTracks?.()[0];
        if (!track) return null;
        const video = document.createElement('video');
        video.srcObject = stream;
        // We assume the stream is already playing in UI; draw directly
        const settings = track.getSettings?.() || {};
        const width = settings.width || 320;
        const height = settings.height || 240;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        // Draw without waiting; using the live track content
        try { ctx.drawImage(video, 0, 0, canvas.width, canvas.height); } catch (_) {}
        try { track.applyConstraints?.({}); } catch (_) {}
        return canvas.toDataURL(mime, quality);
      } catch (e) {
        console.warn('captureWebcamFrameDataUrl failed:', e);
        return null;
      }
    },

    toggleWebcamOverlay: () => {
      dispatch({ type: STUDY_ACTIONS.SET_SHOW_WEBCAM, payload: !state.showWebcam });
    },

    showWebcamOverlay: () => {
      dispatch({ type: STUDY_ACTIONS.SET_SHOW_WEBCAM, payload: true });
    },

    hideWebcamOverlay: () => {
      dispatch({ type: STUDY_ACTIONS.SET_SHOW_WEBCAM, payload: false });
    },

    refreshWebcamDevices: async () => {
      try {
        if (!navigator.mediaDevices?.enumerateDevices) return [];
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cams = devices.filter(d => d.kind === 'videoinput');
        dispatch({ type: STUDY_ACTIONS.SET_WEBCAM_DEVICES, payload: cams });
        return cams;
      } catch (e) {
        console.warn('enumerateDevices failed:', e);
        dispatch({ type: STUDY_ACTIONS.SET_WEBCAM_DEVICES, payload: [] });
        return [];
      }
    },

    selectWebcam: (deviceId) => {
      dispatch({ type: STUDY_ACTIONS.SET_SELECTED_WEBCAM_ID, payload: deviceId || null });
    },

    // Record a visual prediction into session JSON
    recordVisualPrediction: (prediction) => {
      try {
        // local list for quick access
        dispatch({ type: 'ADD_VISUAL_PREDICTION', payload: prediction });
        // persist into session object
        const session = state.currentSession;
        if (!session) return;
        const visual = Array.isArray(session.visualPredictions) ? session.visualPredictions.slice() : [];
        visual.push(prediction);
        const updatedSession = { ...session, visualPredictions: visual };
        dispatch({ type: STUDY_ACTIONS.SET_SESSION, payload: updatedSession });
        if (state.isStorageAvailable) saveSessionData(updatedSession.id, updatedSession);
      } catch (e) {
        console.warn('recordVisualPrediction error:', e);
      }
    },

    // Record a passive prediction into session JSON
    recordPassivePrediction: (prediction) => {
      try {
        dispatch({ type: 'ADD_PASSIVE_PREDICTION', payload: prediction });
        const session = state.currentSession;
        if (!session) return;
        const passive = Array.isArray(session.passivePredictions) ? session.passivePredictions.slice() : [];
        passive.push(prediction);
        const updatedSession = { ...session, passivePredictions: passive };
        dispatch({ type: STUDY_ACTIONS.SET_SESSION, payload: updatedSession });
        if (state.isStorageAvailable) saveSessionData(updatedSession.id, updatedSession);
      } catch (e) {
        console.warn('recordPassivePrediction error:', e);
      }
    },

    // Record a fused prediction into session JSON
    recordFusedPrediction: (prediction) => {
      try {
        dispatch({ type: 'ADD_FUSED_PREDICTION', payload: prediction });
        const session = state.currentSession;
        if (!session) return;
        const fused = Array.isArray(session.fusedPredictions) ? session.fusedPredictions.slice() : [];
        fused.push(prediction);
        const updatedSession = { ...session, fusedPredictions: fused };
        dispatch({ type: STUDY_ACTIONS.SET_SESSION, payload: updatedSession });
        if (state.isStorageAvailable) saveSessionData(updatedSession.id, updatedSession);
      } catch (e) {
        console.warn('recordFusedPrediction error:', e);
      }
    }
  };

  // Context value
  const contextValue = {
    ...state,
    ...actions
  };

  //console.log('StudyProvider: Providing context value:', contextValue);

  return (
    <StudyContext.Provider value={contextValue}>
      {children}
    </StudyContext.Provider>
  );
};

// Custom hook to use the study context
export const useStudy = () => {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return context;
};

export default StudyContext;

