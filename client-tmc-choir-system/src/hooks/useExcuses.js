import { useState, useEffect, useCallback } from 'react';
import { attendanceAPI } from '../lib/api';

export function useExcuses() {
  const [excuses, setExcuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchExcuses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await attendanceAPI.getExcuses();
      setExcuses(res.data?.excuses || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch excuses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExcuses();
  }, [fetchExcuses]);

  const updateExcuseStatus = async (id, status, notes) => {
    try {
      setLoading(true);
      const res = await attendanceAPI.updateExcuseStatus(id, { status, notes });
      await fetchExcuses();
      return res;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { excuses, loading, error, fetchExcuses, updateExcuseStatus };
}
