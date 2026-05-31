import { useState, useEffect, useCallback } from 'react';
import { judgesAPI } from '../lib/api';
import socket from '../lib/socket';

export function useJudges() {
  const [judges, setJudges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchJudges = useCallback(async () => {
    try {
      setLoading(true);
      const res = await judgesAPI.getJudges();
      setJudges(res.data?.judges || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch judges');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJudges();
  }, [fetchJudges]);

  // Real-time sync
  useEffect(() => {
    const onCreated = (judge) => {
      setJudges((prev) => {
        if (prev.find((j) => j.id === judge.id)) return prev;
        return [...prev, judge].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      });
    };

    const onUpdated = (judge) => {
      setJudges((prev) => prev.map((j) => (j.id === judge.id ? { ...j, ...judge } : j)));
    };

    const onDeleted = ({ id }) => {
      setJudges((prev) => prev.filter((j) => j.id !== id));
    };

    socket.on('judge:created', onCreated);
    socket.on('judge:updated', onUpdated);
    socket.on('judge:deleted', onDeleted);

    return () => {
      socket.off('judge:created', onCreated);
      socket.off('judge:updated', onUpdated);
      socket.off('judge:deleted', onDeleted);
    };
  }, []);

  const createJudge = async (data) => {
    const res = await judgesAPI.createJudge(data);
    return res;
  };

  const updateJudge = async (id, data) => {
    const res = await judgesAPI.updateJudge(id, data);
    return res;
  };

  const deleteJudge = async (id) => {
    const res = await judgesAPI.deleteJudge(id);
    return res;
  };

  return { judges, loading, error, fetchJudges, createJudge, updateJudge, deleteJudge };
}
