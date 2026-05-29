import { useState, useEffect, useCallback } from 'react';
import { judgesAPI } from '../lib/api';

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

  const createJudge = async (data) => {
    const res = await judgesAPI.createJudge(data);
    await fetchJudges();
    return res;
  };

  const updateJudge = async (id, data) => {
    const res = await judgesAPI.updateJudge(id, data);
    await fetchJudges();
    return res;
  };

  const deleteJudge = async (id) => {
    const res = await judgesAPI.deleteJudge(id);
    await fetchJudges();
    return res;
  };

  return { judges, loading, error, fetchJudges, createJudge, updateJudge, deleteJudge };
}
