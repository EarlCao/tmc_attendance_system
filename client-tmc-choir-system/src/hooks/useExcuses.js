import { useState, useEffect, useCallback } from 'react';
import { attendanceAPI } from '../lib/api';
import socket from '../lib/socket';

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

  // Real-time: when an excuse status changes, update it in-place
  useEffect(() => {
    const onExcuseUpdated = ({ id, excuseStatus, notes }) => {
      setExcuses((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, status: excuseStatus, notes: notes || e.notes } : e
        )
      );
    };

    socket.on('excuse:updated', onExcuseUpdated);
    return () => {
      socket.off('excuse:updated', onExcuseUpdated);
    };
  }, []);

  const updateExcuseStatus = async (id, status, notes) => {
    try {
      setLoading(true);
      const res = await attendanceAPI.updateExcuseStatus(id, { status, notes });
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
