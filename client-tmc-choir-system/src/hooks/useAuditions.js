import { useState, useEffect, useCallback } from 'react';
import { auditionsAPI } from '../lib/api';
import socket from '../lib/socket';

const splitName = (fullName = '') => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const lastName = parts.length > 1 ? parts.pop() : '';
  return {
    firstName: parts.join(' ') || fullName || '',
    lastName,
  };
};

const normalizeAuditionee = (auditionee = {}) => {
  const sourceName = auditionee.name || auditionee.fullName || `${auditionee.firstName || ''} ${auditionee.lastName || ''}`.trim();
  const split = splitName(sourceName);
  const targetPart = auditionee.targetPart ||
    (auditionee.targetVoiceType
      ? auditionee.targetVoiceType.charAt(0).toUpperCase() + auditionee.targetVoiceType.slice(1).toLowerCase()
      : auditionee.voicePart) ||
    'Soprano';

  return {
    ...auditionee,
    name: sourceName,
    firstName: auditionee.firstName || split.firstName,
    lastName: auditionee.lastName || split.lastName,
    targetPart,
    voicePart: auditionee.voicePart || targetPart,
    religion: auditionee.religion || auditionee.religionDenomination || '',
    contactNumber: auditionee.contactNumber || auditionee.contact || auditionee.contactNo || '',
    notes: auditionee.notes || auditionee.registryNotes || '',
    evaluations: auditionee.evaluations || auditionee.ratings || [],
  };
};

const sortAuditionees = (auditionees) =>
  [...auditionees].sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));

export function useAuditions() {
  const [auditionees, setAuditionees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAuditionees = useCallback(async () => {
    try {
      setLoading(true);
      const res = await auditionsAPI.getAuditionees();
      setAuditionees(sortAuditionees((res.data?.auditionees || []).map(normalizeAuditionee)));
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

  // Real-time sync
  useEffect(() => {
    const onCreated = (auditionee) => {
      const normalized = normalizeAuditionee(auditionee);
      setAuditionees((prev) => {
        if (prev.find((a) => a.id === normalized.id)) return prev;
        return sortAuditionees([...prev, normalized]);
      });
    };

    const onUpdated = (auditionee) => {
      const normalized = normalizeAuditionee(auditionee);
      setAuditionees((prev) => sortAuditionees(prev.map((a) => (a.id === normalized.id ? { ...a, ...normalized } : a))));
    };

    const onDeleted = ({ id }) => {
      setAuditionees((prev) => prev.filter((a) => a.id !== id));
    };

    const onStatusChanged = (auditionee) => {
      setAuditionees((prev) => prev.map((a) => (a.id === auditionee.id ? { ...a, status: auditionee.status } : a)));
    };

    const onEvaluated = ({ auditioneeId, averageRating }) => {
      setAuditionees((prev) =>
        prev.map((a) => (a.id === auditioneeId ? { ...a, averageRating } : a))
      );
    };

    socket.on('auditionee:created', onCreated);
    socket.on('auditionee:updated', onUpdated);
    socket.on('auditionee:deleted', onDeleted);
    socket.on('auditionee:statusChanged', onStatusChanged);
    socket.on('auditionee:evaluated', onEvaluated);

    return () => {
      socket.off('auditionee:created', onCreated);
      socket.off('auditionee:updated', onUpdated);
      socket.off('auditionee:deleted', onDeleted);
      socket.off('auditionee:statusChanged', onStatusChanged);
      socket.off('auditionee:evaluated', onEvaluated);
    };
  }, []);

  const createAuditionee = async (data) => {
    const res = await auditionsAPI.createAuditionee(data);
    return res;
  };

  const updateAuditionee = async (id, data) => {
    const res = await auditionsAPI.updateAuditionee(id, data);
    return res;
  };

  const deleteAuditionee = async (id) => {
    const res = await auditionsAPI.deleteAuditionee(id);
    return res;
  };

  const updateStatus = async (id, data) => {
    const res = await auditionsAPI.updateStatus(id, data);
    return res;
  };

  const saveEvaluation = async (data) => {
    const res = await auditionsAPI.saveEvaluation(data);
    return res;
  };

  return { auditionees, loading, error, fetchAuditionees, createAuditionee, updateAuditionee, deleteAuditionee, updateStatus, saveEvaluation };
}
