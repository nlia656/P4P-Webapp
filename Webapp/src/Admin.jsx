import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudy } from './context/StudyContext';
import { 
  exportAllData, 
  clearAllData, 
  getCurrentSessionId, 
  getSessionData,
  clearCurrentIds,
  saveSessionData
} from './utils/localStorage';
import './App.css';

function Admin() {
  const navigate = useNavigate();
  const { resetStudy, currentSession } = useStudy();

  const currentSessionFromStorage = useMemo(() => {
    const sid = getCurrentSessionId();
    return sid ? getSessionData(sid) : null;
  }, []);

  const handleExportCurrentSession = () => {
    try {
      const session = currentSession || currentSessionFromStorage;
      if (!session) {
        alert('No active session to export.');
        return;
      }
      const dataStr = JSON.stringify({ session }, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `emotion_study_session_${session.id}.json`;
      link.click();
    } catch (e) {
      console.error(e);
      alert('Failed to export session. See console for details.');
    }
  };


  const handleExportAll = () => {
    try {
      // Ensure latest in-memory session (including passive/visual predictions) is flushed to storage
      if (currentSession?.id) {
        saveSessionData(currentSession.id, currentSession);
      }
    } catch (_) {}
    const ok = exportAllData();
    if (!ok) alert('Failed to export data.');
  };

  const handleReset = () => {
    const confirmReset = confirm('This will clear all participant, session, and config data. Continue?');
    if (!confirmReset) return;
    try {
      clearAllData();
      clearCurrentIds();
      resetStudy();
      alert('Study data has been reset.');
      navigate('/');
    } catch (e) {
      console.error(e);
      alert('Failed to reset data. See console for details.');
    }
  };

  return (
    <div className="home-container">
      <div className="welcome-section" style={{ textAlign: 'center' }}>
        <h1>Study Admin</h1>
        <p>Manage the current study session and data exports.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 520, margin: '24px auto' }}>
        <button className="start-button" onClick={handleExportCurrentSession}>
          Export Current Session JSON
        </button>
        <button className="start-button" onClick={handleExportAll}>
          Export All Data JSON
        </button>
        <button className="start-button" onClick={handleReset}>
          Reset Study Session and Data
        </button>
        <button className="start-button" onClick={() => navigate('/')}>Back to Landing</button>
      </div>

      <div className="study-info" style={{ maxWidth: 720, margin: '0 auto' }}>
        <h3>Current Session Overview</h3>
        <pre style={{ whiteSpace: 'pre-wrap', background: '#f7f7f7', padding: 12, borderRadius: 8 }}>
{JSON.stringify(currentSession || currentSessionFromStorage || { message: 'No active session' }, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default Admin;