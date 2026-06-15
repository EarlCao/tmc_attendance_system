import { useState, useCallback } from 'react';
import { portalAPI } from '../lib/api';

export function usePortal() {
  const [dashboardData, setDashboardData] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [semesterSummaryData, setSemesterSummaryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await portalAPI.getDashboard();
      setDashboardData(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const res = await portalAPI.getAttendance();
      setAttendanceData(res.data?.attendance || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSemesterSummary = useCallback(async () => {
    try {
      setLoading(true);
      const res = await portalAPI.getSemesterSummary();
      setSemesterSummaryData(res.data?.semesters || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch semester summary');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await portalAPI.getProfile();
      setProfileData(res.data?.profile || null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = async (data) => {
    const res = await portalAPI.updateProfile(data);
    return res;
  };

  return {
    dashboardData,
    attendanceData,
    profileData,
    semesterSummaryData,
    loading,
    error,
    fetchDashboard,
    fetchAttendance,
    fetchProfile,
    fetchSemesterSummary,
    updateProfile
  };
}
