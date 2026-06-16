import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data.user);
    } catch (error) {
      console.error('Error fetching user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    setJustLoggedIn(true);
    // Re-handshake the socket with the freshly issued token.
    connectSocket();
  };

  const logout = async () => {
    // Notify the server so it can create an audit log entry
    try {
      if (localStorage.getItem('token')) {
        await authAPI.logout();
      }
    } catch (_) {
      // Swallow — we still clear the session locally
    }
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setJustLoggedIn(false);
    // Tear down the authenticated socket connection.
    disconnectSocket();
  };

  const clearWelcome = () => setJustLoggedIn(false);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, justLoggedIn, clearWelcome }}>
      {children}
    </AuthContext.Provider>
  );
};
