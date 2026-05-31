import { useState, useEffect, useCallback } from 'react';
import { membersAPI } from '../lib/api';
import socket from '../lib/socket';

export function useMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await membersAPI.getMembers();
      setMembers(res.data?.members || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch members');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Real-time: sync state directly without a full refetch
  useEffect(() => {
    const onCreated = (member) => {
      setMembers((prev) => {
        if (prev.find((m) => m.id === member.id)) return prev;
        return [...prev, member].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      });
    };

    const onUpdated = (member) => {
      setMembers((prev) => prev.map((m) => (m.id === member.id ? member : m)));
    };

    const onDeleted = ({ id }) => {
      setMembers((prev) => prev.filter((m) => m.id !== id));
    };

    socket.on('member:created', onCreated);
    socket.on('member:updated', onUpdated);
    socket.on('member:deleted', onDeleted);

    return () => {
      socket.off('member:created', onCreated);
      socket.off('member:updated', onUpdated);
      socket.off('member:deleted', onDeleted);
    };
  }, []);

  const createMember = async (data) => {
    const res = await membersAPI.createMember(data);
    return res;
  };

  const updateMember = async (id, data) => {
    const res = await membersAPI.updateMember(id, data);
    return res;
  };

  const deleteMember = async (id) => {
    const res = await membersAPI.deleteMember(id);
    return res;
  };

  return { members, loading, error, fetchMembers, createMember, updateMember, deleteMember };
}
