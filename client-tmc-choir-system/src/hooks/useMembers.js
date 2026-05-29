import { useState, useEffect, useCallback } from 'react';
import { membersAPI } from '../lib/api';

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

  const createMember = async (data) => {
    const res = await membersAPI.createMember(data);
    await fetchMembers();
    return res;
  };

  const updateMember = async (id, data) => {
    const res = await membersAPI.updateMember(id, data);
    await fetchMembers();
    return res;
  };

  const deleteMember = async (id) => {
    const res = await membersAPI.deleteMember(id);
    await fetchMembers();
    return res;
  };

  return { members, loading, error, fetchMembers, createMember, updateMember, deleteMember };
}
