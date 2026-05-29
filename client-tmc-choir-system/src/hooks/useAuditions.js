import { useState, useEffect, useCallback } from 'react';
import { auditionsAPI } from '../lib/api';

export function useAuditions() {
  const [auditionees, setAuditionees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAuditionees = useCallback(async () => {
    try {
      setLoading(true);
      const res = await auditionsAPI.getAuditionees();
      setAuditionees(res.data?.auditionees || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch auditionees');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuditionees();
  }, [fetchAuditionees]);

  const createAuditionee = async (data) => {
    const res = await auditionsAPI.createAuditionee(data);
    await fetchAuditionees();
    return res;
  };

  const updateAuditionee = async (id, data) => {
    const res = await auditionsAPI.updateAuditionee(id, data);
    await fetchAuditionees();
    return res;
  };

  const deleteAuditionee = async (id) => {
    const res = await auditionsAPI.deleteAuditionee(id);
    await fetchAuditionees();
    return res;
  };

  const updateStatus = async (id, data) => {
    const res = await auditionsAPI.updateStatus(id, data);
    await fetchAuditionees();
    return res;
  };

  const saveEvaluation = async (data) => {
    const res = await auditionsAPI.saveEvaluation(data);
    await fetchAuditionees();
    return res;
  };

  return { auditionees, loading, error, fetchAuditionees, createAuditionee, updateAuditionee, deleteAuditionee, updateStatus, saveEvaluation };
}
