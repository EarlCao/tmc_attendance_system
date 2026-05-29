import { useState, useEffect, useCallback } from 'react';
import { officersAPI } from '../lib/api';

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

  const createOfficer = async (data) => {
    const res = await officersAPI.createOfficer(data);
    await fetchOfficers();
    return res;
  };

  const updateOfficer = async (id, data) => {
    const res = await officersAPI.updateOfficer(id, data);
    await fetchOfficers();
    return res;
  };

  const deleteOfficer = async (id) => {
    const res = await officersAPI.deleteOfficer(id);
    await fetchOfficers();
    return res;
  };

  return { officers, loading, error, fetchOfficers, createOfficer, updateOfficer, deleteOfficer };
}
