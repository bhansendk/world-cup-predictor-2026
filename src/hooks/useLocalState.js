import { useState, useEffect, useCallback } from 'react';

const LS_KEY = 'vm2026_tirsdagsklubben';
const LS_MYNAME_KEY = 'vm2026_tirsdagsklubben_myname';

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function useLocalState() {
  const [mode, setModeRaw] = useState(() => loadState()?.mode || null);
  const [S, setS]   = useState(() => loadState()?.S || {g:{}, third:[], r32:{}, r16:{}, qf:{}, sf:{}, final:{}, bronze:{}});
  const [FUN, setFUN] = useState(() => loadState()?.FUN || {});
  const [SIMPLE, setSIMPLE] = useState(() => loadState()?.SIMPLE || {top1:null,top2:null,top3:null,top4:null,topscorer:null,golden_ball:null,most_yellow:null,most_goals_team:null});
  const [myName, setMyNameRaw] = useState(() => {
    try { return localStorage.getItem(LS_MYNAME_KEY) || ''; } catch { return ''; }
  });

  const setMyName = useCallback((name) => {
    setMyNameRaw(name);
    try { localStorage.setItem(LS_MYNAME_KEY, name); } catch {}
  }, []);

  // persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ mode, S, FUN, SIMPLE }));
    } catch {}
  }, [mode, S, FUN, SIMPLE]);

  const setMode = useCallback((m) => {
    setModeRaw(m);
  }, []);

  const updateGroup = useCallback((grp, field, value) => {
    setS(prev => ({ ...prev, g: { ...prev.g, [grp]: { ...(prev.g[grp] || {}), [field]: value } } }));
  }, []);

  const setThird = useCallback((arr) => {
    setS(prev => ({ ...prev, third: arr }));
  }, []);

  const updateBracketRound = useCallback((round, id, value) => {
    setS(prev => ({ ...prev, [round]: { ...(prev[round] || {}), [id]: value } }));
  }, []);

  const updateFun = useCallback((id, value) => {
    setFUN(prev => ({ ...prev, [id]: value }));
    // sync shared fields to SIMPLE
    if (['topscorer','golden_ball','most_yellow','most_goals_team'].includes(id)) {
      setSIMPLE(prev => ({ ...prev, [id]: value }));
    }
  }, []);

  const updateSimple = useCallback((field, value) => {
    setSIMPLE(prev => ({ ...prev, [field]: value }));
    // sync shared fields to FUN
    if (['topscorer','golden_ball','most_yellow','most_goals_team'].includes(field)) {
      setFUN(prev => ({ ...prev, [field]: value }));
    }
  }, []);

  const resetAll = useCallback(() => {
    setS({g:{}, third:[], r32:{}, r16:{}, qf:{}, sf:{}, final:{}, bronze:{}});
    setFUN({});
    setSIMPLE({top1:null,top2:null,top3:null,top4:null,topscorer:null,golden_ball:null,most_yellow:null,most_goals_team:null});
  }, []);

  const loadFromObject = useCallback((obj) => {
    if (obj.S) setS(obj.S);
    if (obj.FUN) setFUN(obj.FUN);
    if (obj.SIMPLE) setSIMPLE(obj.SIMPLE);
    if (obj.mode) setModeRaw(obj.mode);
  }, []);

  return {
    mode, setMode,
    S, FUN, SIMPLE,
    myName, setMyName,
    updateGroup, setThird, updateBracketRound,
    updateFun, updateSimple,
    resetAll, loadFromObject,
    setS, setFUN, setSIMPLE
  };
}
