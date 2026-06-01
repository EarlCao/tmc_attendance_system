import { useState, useEffect, useCallback } from 'react';
import { semestersAPI } from '../lib/api';
import socket from '../lib/socket';

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

  // Real-time sync — semester changes affect active-semester detection app-wide
  useEffect(() => {
    const computeStatus = (semester) => {
      const now = new Date();
      const hasStarted = !!semester.startDate;
      const notEnded = !semester.endDate || new Date(semester.endDate) > now;
      return hasStarted && notEnded ? 'active' : 'archived';
    };

    const onCreated = (semester) => {
      setSemesters((prev) => {
        if (prev.find((s) => s.id === semester.id)) return prev;
        return [{ ...semester, status: computeStatus(semester) }, ...prev];
      });
    };

    const onUpdated = (semester) => {
      setSemesters((prev) =>
        prev.map((s) =>
          s.id === semester.id ? { ...s, ...semester, status: computeStatus(semester) } : s
        )
      );
    };

    const onEnded = (semester) => {
      setSemesters((prev) =>
        prev.map((s) => (s.id === semester.id ? { ...s, ...semester, status: 'archived' } : s))
      );
    };

    const onDeleted = ({ id }) => {
      setSemesters((prev) => prev.filter((s) => s.id !== id));
    };

    socket.on('semester:created', onCreated);
    socket.on('semester:updated', onUpdated);
    socket.on('semester:ended', onEnded);
    socket.on('semester:deleted', onDeleted);

    return () => {
      socket.off('semester:created', onCreated);
      socket.off('semester:updated', onUpdated);
      socket.off('semester:ended', onEnded);
      socket.off('semester:deleted', onDeleted);
    };
  }, []);

  const createSemester = async (data) => {
    const res = await semestersAPI.createSemester(data);
    return res;
  };

  const updateSemester = async (id, data) => {
    const res = await semestersAPI.updateSemester(id, data);
    return res;
  };

  const endSemester = async (id) => {
    const res = await semestersAPI.endSemester(id);
    return res;
  };

  const deleteSemester = async (id) => {
    const res = await semestersAPI.deleteSemester(id);
    return res;
  };

  const activeSemester = semesters.find(s => s.status === 'active');

  return { semesters, activeSemester, loading, error, fetchSemesters, createSemester, updateSemester, endSemester, deleteSemester };
}
