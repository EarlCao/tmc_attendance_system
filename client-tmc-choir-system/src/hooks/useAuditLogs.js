import { useState, useEffect, useCallback, useRef } from 'react';
import { auditLogsAPI } from '../lib/api';
import socket from '../lib/socket';

const MAX_LIVE_LOGS = 500;

export function useAuditLogs({ category = 'ALL', search = '' } = {}) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newLogIds, setNewLogIds] = useState(new Set());
  const timerRef = useRef({});

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = { limit: 200 };
      if (category && category !== 'ALL') params.category = category;
      if (search) params.search = search;

      const res = await auditLogsAPI.getLogs(params);
      setLogs(res.data?.logs || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch audit logs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Real-time: prepend new logs as they arrive via socket
  useEffect(() => {
    const onNewLog = (log) => {
      // Apply active filters client-side before prepending
      const matchesCategory = !category || category === 'ALL' || log.category === category;
      const matchesSearch = !search ||
        (log.username || '').toLowerCase().includes(search.toLowerCase()) ||
        (log.target || '').toLowerCase().includes(search.toLowerCase()) ||
        (log.action || '').toLowerCase().includes(search.toLowerCase());

      if (!matchesCategory || !matchesSearch) return;

      setLogs((prev) => {
        const next = [log, ...prev];
        return next.slice(0, MAX_LIVE_LOGS);
      });

      // Highlight the new row briefly
      setNewLogIds((prev) => new Set([...prev, log.id]));
      timerRef.current[log.id] = setTimeout(() => {
        setNewLogIds((prev) => {
          const next = new Set(prev);
          next.delete(log.id);
          return next;
        });
      }, 3000);
    };

    socket.on('auditLog:created', onNewLog);
    return () => {
      socket.off('auditLog:created', onNewLog);
      Object.values(timerRef.current).forEach(clearTimeout);
    };
  }, [category, search]);

  const clearLogs = async () => {
    await auditLogsAPI.clearLogs();
    setLogs([]);
  };

  return { logs, loading, error, fetchLogs, clearLogs, newLogIds };
}
