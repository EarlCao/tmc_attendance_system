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

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await sessionsAPI.getSessions();
      setSessions(res.data?.sessions || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch sessions');
      console.error(err);
    } finally {
      setLoading(false);
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
      fetchSessions();
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

  const createSession = async (data) => {
    const res = await sessionsAPI.createSession(data);
    return res;
  };

  const updateSession = async (id, data) => {
    const res = await sessionsAPI.updateSession(id, data);
    return res;
  };

  const deleteSession = async (id) => {
    const res = await sessionsAPI.deleteSession(id);
    return res;
  };

  const getSessionAttendance = async (sessionId) => {
    const res = await attendanceAPI.getSessionAttendance(sessionId);
    return res.data?.records || [];
  };

  const saveSessionAttendance = async (sessionId, data) => {
    const res = await attendanceAPI.saveSessionAttendance(sessionId, data);
    return res;
  };

  return {
    sessions, loading, error,
    fetchSessions, createSession, updateSession, deleteSession,
    getSessionAttendance, saveSessionAttendance,
  };
}
