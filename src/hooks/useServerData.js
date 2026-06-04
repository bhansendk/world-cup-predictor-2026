import { useState, useEffect, useCallback, useRef } from 'react';

export default function useServerData() {
  const [serverData, setServerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);
  const pollRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/data');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setServerData(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    fetchData();
    pollRef.current = setInterval(fetchData, 30000);
    return () => clearInterval(pollRef.current);
  }, [fetchData]);

  const submitPrediction = useCallback(async (name, mode, prediction) => {
    setLoading(true);
    try {
      const res = await fetch('/api/data?action=submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mode, prediction })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Fejl ved indsendelse');
      await fetchData();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  const adminUpdateResults = useCallback(async (results, password) => {
    setLoading(true);
    try {
      const res = await fetch('/api/data?action=results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results, password })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Forkert kode');
      await fetchData();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  const adminDeleteOne = useCallback(async (name, password) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/data?name=${encodeURIComponent(name)}&password=${encodeURIComponent(password)}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Forkert kode');
      await fetchData();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  const adminClearAll = useCallback(async (password) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/data?action=clearAll&password=${encodeURIComponent(password)}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Forkert kode');
      await fetchData();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  return {
    serverData, loading, error, fetchData,
    submitPrediction, adminUpdateResults, adminDeleteOne, adminClearAll
  };
}
