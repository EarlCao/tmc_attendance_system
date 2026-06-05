import { useState, useEffect, useCallback } from 'react';
import { categoriesAPI } from '../lib/api';
import socket from '../lib/socket';

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await categoriesAPI.getCategories();
      setCategories(res.data?.categories || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch categories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Real-time sync
  useEffect(() => {
    const onCreated = (cat) => {
      setCategories((prev) => {
        if (prev.find((c) => c.id === cat.id)) return prev;
        return [...prev, cat].sort((a, b) => a.name.localeCompare(b.name));
      });
    };
    const onUpdated = (cat) => {
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, ...cat } : c))
      );
    };
    const onDeleted = ({ id }) => {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    };

    socket.on('category:created', onCreated);
    socket.on('category:updated', onUpdated);
    socket.on('category:deleted', onDeleted);

    return () => {
      socket.off('category:created', onCreated);
      socket.off('category:updated', onUpdated);
      socket.off('category:deleted', onDeleted);
    };
  }, []);

  const createCategory = async (data) => categoriesAPI.createCategory(data);
  const updateCategory = async (id, data) => categoriesAPI.updateCategory(id, data);
  const deleteCategory = async (id) => categoriesAPI.deleteCategory(id);

  return { categories, loading, error, fetchCategories, createCategory, updateCategory, deleteCategory };
}
