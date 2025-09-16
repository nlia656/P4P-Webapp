import React, { useEffect, useRef } from 'react';
import { useStudy } from '../context/StudyContext';

function FusionSensor() {
  const { currentSession, currentVideo, videoTime, isPaused, visualPredictions, passivePredictions, recordFusedPrediction } = useStudy();
  const lastBoundaryRef = useRef(-1);
  const apiHostRef = useRef(import.meta?.env?.VITE_ACTIVE_API || 'http://localhost:8001');

  useEffect(() => {
    lastBoundaryRef.current = -1;
  }, [currentVideo?.id]);

  useEffect(() => {
    if (!currentSession || !currentVideo) return;
    if (isPaused) return;
    const t = Math.floor(videoTime || 0);
    if (t <= 0) return;
    const boundarySec = Math.floor(t / 12) * 12; // 12,24,36,...
    if (boundarySec <= 0) return;
    if (boundarySec === lastBoundaryRef.current) return;

    // collect latest predictions at or before the boundary second
    const latestVisual = Array.isArray(visualPredictions)
      ? [...visualPredictions].reverse().find(p => (p?.videoId === currentVideo?.id) && typeof p?.videoTimeSec === 'number' && p.videoTimeSec <= boundarySec)
      : null;
    const latestPassive = Array.isArray(passivePredictions)
      ? [...passivePredictions].reverse().find(p => (p?.videoId === currentVideo?.id) && typeof p?.videoTimeSec === 'number' && p.videoTimeSec <= boundarySec)
      : null;

    if (!latestVisual && !latestPassive) return;

    // gate immediately to avoid duplicate calls
    lastBoundaryRef.current = boundarySec;

    const payload = {
      visual: latestVisual ? {
        valence: typeof latestVisual?.valence === 'number' ? latestVisual.valence : 0,
        arousal: typeof latestVisual?.arousal === 'number' ? latestVisual.arousal : 0,
        confidence: typeof latestVisual?.confidence === 'number' ? Math.max(0, Math.min(1, latestVisual.confidence)) : 0
      } : null,
      passive: latestPassive ? {
        valence: typeof latestPassive?.valence === 'number' ? latestPassive.valence : 0,
        arousal: typeof latestPassive?.arousal === 'number' ? latestPassive.arousal : 0
      } : null,
      videoId: currentVideo?.id || null,
      videoTimeSec: boundarySec
    };

    const send = async () => {
      try {
        const res = await fetch(`${apiHostRef.current}/fusion/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) return;
        const json = await res.json();
        const fused = {
          id: `fused_${Date.now()}`,
          at: new Date().toISOString(),
          videoId: currentVideo?.id || null,
          videoTimeSec: boundarySec,
          valence: typeof json?.valence === 'number' ? json.valence : null,
          arousal: typeof json?.arousal === 'number' ? json.arousal : null,
          discreteEmotion: json?.discrete_emotion || null,
          fusionConfidence: typeof json?.fusion_confidence === 'number' ? json.fusion_confidence : null,
          strategy: json?.strategy || 'rule_based'
        };
        recordFusedPrediction(fused);
      } catch (_) {}
    };

    send();
  }, [videoTime, isPaused, currentSession, currentVideo, visualPredictions, passivePredictions, recordFusedPrediction]);

  return null;
}

export default FusionSensor;
