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
    // Refetch on create/delete so the member relation is always included.
    // user:created from member auto-creation doesn't carry the member object;
    // user.deleteMany (used by deleteMember) doesn't fire user:deleted at all,
    // so we also listen to member:created / member:deleted and refetch.
    const refetch = () => fetchAccounts();

    // Merge socket payload but preserve the existing member relation
    const onUpdated = (account) => {
      setAccounts((prev) =>
        prev.map((a) => (a.id === account.id ? { ...a, ...account } : a))
      );
    };

    socket.on('user:created', refetch);
    socket.on('user:updated', onUpdated);
    socket.on('user:deleted', refetch);
    socket.on('member:created', refetch);
    socket.on('member:deleted', refetch);

    return () => {
      socket.off('user:created', refetch);
      socket.off('user:updated', onUpdated);
      socket.off('user:deleted', refetch);
      socket.off('member:created', refetch);
      socket.off('member:deleted', refetch);
    };
  }, [fetchAccounts]);

  const createAccountForMember = async (memberId) => {
    const res = await accountsAPI.createAccountForMember(memberId);
    return res;
  };

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

  return { accounts, loading, error, fetchAccounts, createAccount, createAccountForMember, updateAccount, deleteAccount };
}
