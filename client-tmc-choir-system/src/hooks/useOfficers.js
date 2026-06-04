import { useState, useEffect, useCallback } from 'react';
import { officersAPI } from '../lib/api';
import socket from '../lib/socket';

const formatOfficer = (officer = {}) => ({
  ...officer,
  memberId: officer.memberId ? Number(officer.memberId) : officer.memberId,
  position: officer.position || '',
  duties: officer.duties || '',
  status: (officer.status || 'ACTIVE').toLowerCase(),
  member: officer.member
    ? {
        ...officer.member,
        name: officer.member.name || officer.member.fullName || '',
        email: officer.member.email || officer.member.emailOrFacebook || '',
        contactNumber: officer.member.contactNumber || officer.member.contactNo || '',
      }
    : officer.member,
});

const sortOfficers = (officers) =>
  [...officers].sort((a, b) => (a.position || '').localeCompare(b.position || '', undefined, { sensitivity: 'base' }));

export function useOfficers() {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOfficers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await officersAPI.getOfficers();
      setOfficers(sortOfficers((res.data?.officers || []).map(formatOfficer)));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch officers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOfficers();
  }, [fetchOfficers]);

  // Real-time sync
  useEffect(() => {
    const onCreated = (officer) => {
      const formatted = formatOfficer(officer);
      setOfficers((prev) => {
        if (prev.find((o) => o.id === formatted.id)) return prev;
        return sortOfficers([...prev, formatted]);
      });
    };

    const onUpdated = (officer) => {
      const formatted = formatOfficer(officer);
      setOfficers((prev) => {
        if (!prev.find((o) => o.id === formatted.id)) return sortOfficers([...prev, formatted]);
        return sortOfficers(prev.map((o) => (o.id === formatted.id ? { ...o, ...formatted } : o)));
      });
    };

    const onDeleted = ({ id }) => {
      setOfficers((prev) => prev.filter((o) => o.id !== id));
    };

    socket.on('officer:created', onCreated);
    socket.on('officer:updated', onUpdated);
    socket.on('officer:deleted', onDeleted);

    return () => {
      socket.off('officer:created', onCreated);
      socket.off('officer:updated', onUpdated);
      socket.off('officer:deleted', onDeleted);
    };
  }, []);

  const createOfficer = async (data) => {
    const res = await officersAPI.createOfficer(data);
    const officer = res.data?.officer;
    if (officer) {
      const formatted = formatOfficer(officer);
      setOfficers((prev) => {
        if (prev.find((o) => o.id === formatted.id)) return prev;
        return sortOfficers([...prev, formatted]);
      });
    }
    return res;
  };

  const updateOfficer = async (id, data) => {
    const res = await officersAPI.updateOfficer(id, data);
    const officer = res.data?.officer;
    if (officer) {
      const formatted = formatOfficer(officer);
      setOfficers((prev) => sortOfficers(prev.map((o) => (o.id === formatted.id ? { ...o, ...formatted } : o))));
    }
    return res;
  };

  const deleteOfficer = async (id) => {
    const res = await officersAPI.deleteOfficer(id);
    setOfficers((prev) => prev.filter((o) => o.id !== id));
    return res;
  };

  return { officers, loading, error, fetchOfficers, createOfficer, updateOfficer, deleteOfficer };
}
