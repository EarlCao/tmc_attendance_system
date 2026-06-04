import { useState, useEffect, useCallback } from 'react';
import { judgesAPI } from '../lib/api';
import socket from '../lib/socket';

const formatJudge = (judge = {}) => ({
  ...judge,
  name: judge.name ?? judge.fullName ?? '',
  title: judge.title ?? judge.titleRole ?? '',
  specialization: judge.specialization ?? '',
  contact: judge.contact ?? judge.contactNo ?? '',
  email: judge.email ?? '',
  facebookAccount: judge.facebookAccount ?? '',
  notes: judge.notes ?? '',
  status: judge.status ?? 'active',
  ratingsGiven: judge.ratingsGiven ?? judge._count?.evaluations ?? 0,
});

export function useJudges(semesterId) {
  const [judges, setJudges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isInScope = useCallback(
    (judge) => !semesterId || String(judge.semesterId) === String(semesterId),
    [semesterId]
  );

  const fetchJudges = useCallback(async () => {
    try {
      setLoading(true);
      const res = await judgesAPI.getJudges(semesterId ? { semesterId } : undefined);
      setJudges((res.data?.judges || []).map(formatJudge));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch judges');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [semesterId]);

  useEffect(() => {
    fetchJudges();
  }, [fetchJudges]);

  // Real-time sync
  useEffect(() => {
    const onCreated = (judge) => {
      const formatted = formatJudge(judge);
      if (!isInScope(formatted)) return;
      setJudges((prev) => {
        if (prev.find((j) => j.id === formatted.id)) return prev;
        return [...prev, formatted].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      });
    };

    const onUpdated = (judge) => {
      const formatted = formatJudge(judge);
      setJudges((prev) => {
        if (!isInScope(formatted)) return prev.filter((j) => j.id !== formatted.id);
        if (!prev.find((j) => j.id === formatted.id)) {
          return [...prev, formatted].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        }
        return prev.map((j) => (j.id === formatted.id ? { ...j, ...formatted } : j));
      });
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
  }, [isInScope]);

  const createJudge = async (data) => {
    const res = await judgesAPI.createJudge(data);
    const judge = res.data?.judge;
    if (judge) {
      const formatted = formatJudge(judge);
      if (isInScope(formatted)) {
        setJudges((prev) => {
          if (prev.find((j) => j.id === formatted.id)) return prev;
          return [...prev, formatted].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        });
      }
    }
    return res;
  };

  const updateJudge = async (id, data) => {
    const res = await judgesAPI.updateJudge(id, data);
    const judge = res.data?.judge;
    if (judge) {
      const formatted = formatJudge(judge);
      setJudges((prev) => {
        if (!isInScope(formatted)) return prev.filter((j) => j.id !== formatted.id);
        return prev.map((j) => (j.id === formatted.id ? { ...j, ...formatted } : j));
      });
    }
    return res;
  };

  const deleteJudge = async (id) => {
    const res = await judgesAPI.deleteJudge(id);
    return res;
  };

  return { judges, loading, error, fetchJudges, createJudge, updateJudge, deleteJudge };
}
