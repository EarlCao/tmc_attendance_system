import { useState, useEffect, useCallback } from 'react';
import { rulesAPI } from '../lib/api';
import socket from '../lib/socket';

export function useRules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      const res = await rulesAPI.getRules();
      setRules(res.data?.rules || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch rules');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  // Real-time sync
  useEffect(() => {
    const onCreated = (rule) => {
      setRules((prev) => {
        if (prev.find((r) => r.id === rule.id)) return prev;
        return [...prev, rule];
      });
    };

    const onUpdated = (rule) => {
      setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, ...rule } : r)));
    };

    const onDeleted = ({ id }) => {
      setRules((prev) => prev.filter((r) => r.id !== id));
    };

    socket.on('rule:created', onCreated);
    socket.on('rule:updated', onUpdated);
    socket.on('rule:deleted', onDeleted);

    return () => {
      socket.off('rule:created', onCreated);
      socket.off('rule:updated', onUpdated);
      socket.off('rule:deleted', onDeleted);
    };
  }, []);

  const createRule = async (data) => {
    const res = await rulesAPI.createRule(data);
    return res;
  };

  const updateRule = async (id, data) => {
    const res = await rulesAPI.updateRule(id, data);
    return res;
  };

  const deleteRule = async (id) => {
    const res = await rulesAPI.deleteRule(id);
    return res;
  };

  return { rules, loading, error, fetchRules, createRule, updateRule, deleteRule };
}
