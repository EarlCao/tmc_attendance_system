import { useState, useEffect, useCallback } from 'react';
import { officersAPI } from '../lib/api';
import socket from '../lib/socket';

export function useOfficers() {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOfficers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await officersAPI.getOfficers();
      setOfficers(res.data?.officers || []);
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
      setOfficers((prev) => {
        if (prev.find((o) => o.id === officer.id)) return prev;
        return [...prev, officer];
      });
    };

    const onUpdated = (officer) => {
      setOfficers((prev) => prev.map((o) => (o.id === officer.id ? { ...o, ...officer } : o)));
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
    return res;
  };

  const updateOfficer = async (id, data) => {
    const res = await officersAPI.updateOfficer(id, data);
    return res;
  };

  const deleteOfficer = async (id) => {
    const res = await officersAPI.deleteOfficer(id);
    return res;
  };

  return { officers, loading, error, fetchOfficers, createOfficer, updateOfficer, deleteOfficer };
}
