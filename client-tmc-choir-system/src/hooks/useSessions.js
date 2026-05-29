import { useState, useEffect, useCallback } from 'react';
import { sessionsAPI, attendanceAPI } from '../lib/api';

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

  const createSession = async (data) => {
    const res = await sessionsAPI.createSession(data);
    await fetchSessions();
    return res;
  };

  const updateSession = async (id, data) => {
    const res = await sessionsAPI.updateSession(id, data);
    await fetchSessions();
    return res;
  };

  const deleteSession = async (id) => {
    const res = await sessionsAPI.deleteSession(id);
    await fetchSessions();
    return res;
  };

  // Returns flat array of attendance records: [{ memberId, status, notes, ... }]
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
