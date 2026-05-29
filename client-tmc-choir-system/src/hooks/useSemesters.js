import { useState, useEffect, useCallback } from 'react';
import { semestersAPI } from '../lib/api';

export function useSemesters() {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSemesters = useCallback(async () => {
    try {
      setLoading(true);
      const res = await semestersAPI.getSemesters();
      setSemesters(res.data?.semesters || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch semesters');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSemesters();
  }, [fetchSemesters]);

  const createSemester = async (data) => {
    const res = await semestersAPI.createSemester(data);
    await fetchSemesters();
    return res;
  };

  const updateSemester = async (id, data) => {
    const res = await semestersAPI.updateSemester(id, data);
    await fetchSemesters();
    return res;
  };

  const endSemester = async (id) => {
    const res = await semestersAPI.endSemester(id);
    await fetchSemesters();
    return res;
  };

  const deleteSemester = async (id) => {
    const res = await semestersAPI.deleteSemester(id);
    await fetchSemesters();
    return res;
  };

  const activeSemester = semesters.find(s => s.status === 'active');

  return { semesters, activeSemester, loading, error, fetchSemesters, createSemester, updateSemester, endSemester, deleteSemester };
}
