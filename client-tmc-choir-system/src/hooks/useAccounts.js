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

  // Real-time: refetch on any event that changes the accounts list
  useEffect(() => {
    const refetch = () => fetchAccounts();

    // Merge socket payload but preserve the existing member relation
    const onUpdated = (account) => {
      setAccounts((prev) =>
        prev.map((a) => (a.id === account.id ? { ...a, ...account } : a))
      );
    };

    // user:created — fires when a new User row is inserted (both from
    // createMember auto-create AND from createAccountForMember)
    socket.on('user:created', refetch);
    socket.on('user:updated', onUpdated);
    // user:deleted — fires from deleteAccount; for deleteMember we emit
    // user:deleted manually in member.controller.js before deleteMany
    socket.on('user:deleted', refetch);
    // member:created / member:deleted — catch-all safety net so the
    // "No Account" placeholder rows stay in sync
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
    // Optimistically refetch in case socket is slow
    await fetchAccounts();
    return res;
  };

  const createAccount = async (data) => {
    const res = await accountsAPI.createAccount(data);
    await fetchAccounts();
    return res;
  };

  const updateAccount = async (id, data) => {
    const res = await accountsAPI.updateAccount(id, data);
    return res;
  };

  const deleteAccount = async (id) => {
    const res = await accountsAPI.deleteAccount(id);
    await fetchAccounts();
    return res;
  };

  return { accounts, loading, error, fetchAccounts, createAccount, createAccountForMember, updateAccount, deleteAccount };
}
