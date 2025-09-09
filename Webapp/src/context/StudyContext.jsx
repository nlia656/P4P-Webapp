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
  error: null
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
  RESET_STUDY: 'RESET_STUDY'
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
        ratings: []
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
          videos.push({ id: video.id, title: video.title || '', firstSeenAt: new Date().toISOString() });
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
      dispatch({ type: STUDY_ACTIONS.RESET_STUDY });
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

