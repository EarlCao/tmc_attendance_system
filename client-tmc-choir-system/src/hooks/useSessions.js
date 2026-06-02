import { useState, useEffect, useCallback } from 'react';
import { sessionsAPI, attendanceAPI } from '../lib/api';
import socket from '../lib/socket';

// Mirrors server's formatSession — socket emits raw DB rows (sessionDate, description)
const formatSession = (session) => ({
  ...session,
  date:  session.date  ?? session.sessionDate  ?? null,
  notes: session.notes ?? session.description  ?? '',
  counts: session.counts ?? { Present: 0, Late: 0, Absent: 0, Excused: 0 },
});

export function useSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSessions = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const res = await sessionsAPI.getSessions();
      setSessions(res.data?.sessions || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch sessions');
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Real-time sync
  useEffect(() => {
    const onCreated = (session) => {
      const formatted = formatSession(session);
      setSessions((prev) => {
        if (prev.find((s) => s.id === formatted.id)) return prev;
        return [formatted, ...prev];
      });
    };

    const onUpdated = (session) => {
      const formatted = formatSession(session);
      setSessions((prev) => prev.map((s) => (s.id === formatted.id ? formatted : s)));
    };

    const onDeleted = ({ id }) => {
      setSessions((prev) => prev.filter((s) => s.id !== id));
    };

    // When attendance is saved for a session, refetch to get updated counts
    const onAttendanceSaved = ({ sessionId }) => {
      fetchSessions({ silent: true });
    };

    socket.on('session:created', onCreated);
    socket.on('session:updated', onUpdated);
    socket.on('session:deleted', onDeleted);
    socket.on('attendance:saved', onAttendanceSaved);

    return () => {
      socket.off('session:created', onCreated);
      socket.off('session:updated', onUpdated);
      socket.off('session:deleted', onDeleted);
      socket.off('attendance:saved', onAttendanceSaved);
    };
  }, [fetchSessions]);

  const createSession = useCallback(async (data) => {
    const res = await sessionsAPI.createSession(data);
    return res;
  }, []);

  const updateSession = useCallback(async (id, data) => {
    const res = await sessionsAPI.updateSession(id, data);
    return res;
  }, []);

  const deleteSession = useCallback(async (id) => {
    const res = await sessionsAPI.deleteSession(id);
    return res;
  }, []);

  const getSessionAttendance = useCallback(async (sessionId) => {
    const res = await attendanceAPI.getSessionAttendance(sessionId);
    return (res.data?.records || []).map((record) => ({
      ...record,
      reason: record.reason ?? record.notes ?? '',
    }));
  }, []);

  const saveSessionAttendance = useCallback(async (sessionId, data) => {
    const records = data.records || data.attendanceData || [];
    const payload = {
      records: records.map((record) => ({
        ...record,
        notes: record.notes ?? record.reason ?? '',
      })),
    };
    const res = await attendanceAPI.saveSessionAttendance(sessionId, payload);
    return res;
  }, []);

  return {
    sessions, loading, error,
    fetchSessions, createSession, updateSession, deleteSession,
    getSessionAttendance, saveSessionAttendance,
  };
}
