import { useState, useEffect, useCallback } from 'react';
import { accountsAPI } from '../lib/api';
import socket from '../lib/socket';

export function useAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await accountsAPI.getAccounts();
      setAccounts(res.data?.accounts || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch accounts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Real-time
  useEffect(() => {
    const onCreated = (account) => {
      setAccounts((prev) => {
        if (prev.find((a) => a.id === account.id)) return prev;
        return [account, ...prev]; // newer first
      });
    };

    const onUpdated = (account) => {
      setAccounts((prev) => prev.map((a) => (a.id === account.id ? account : a)));
    };

    const onDeleted = ({ id }) => {
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    };

    socket.on('user:created', onCreated);
    socket.on('user:updated', onUpdated);
    socket.on('user:deleted', onDeleted);

    return () => {
      socket.off('user:created', onCreated);
      socket.off('user:updated', onUpdated);
      socket.off('user:deleted', onDeleted);
    };
  }, []);

  const createAccount = async (data) => {
    const res = await accountsAPI.createAccount(data);
    return res;
  };

  const updateAccount = async (id, data) => {
    const res = await accountsAPI.updateAccount(id, data);
    return res;
  };

  const deleteAccount = async (id) => {
    const res = await accountsAPI.deleteAccount(id);
    return res;
  };

  return { accounts, loading, error, fetchAccounts, createAccount, updateAccount, deleteAccount };
}
