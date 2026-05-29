import { useState, useEffect, useCallback } from 'react';
import { rulesAPI } from '../lib/api';

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

  const createRule = async (data) => {
    const res = await rulesAPI.createRule(data);
    await fetchRules();
    return res;
  };

  const updateRule = async (id, data) => {
    const res = await rulesAPI.updateRule(id, data);
    await fetchRules();
    return res;
  };

  const deleteRule = async (id) => {
    const res = await rulesAPI.deleteRule(id);
    await fetchRules();
    return res;
  };

  return { rules, loading, error, fetchRules, createRule, updateRule, deleteRule };
}
