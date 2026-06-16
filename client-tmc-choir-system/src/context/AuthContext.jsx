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

  // Keep this tab in sync with the shared localStorage token. Two tabs/windows
  // of the same browser profile share one `token` key, so logging in as a
  // different user (e.g. a member) in another tab would otherwise leave this
  // tab running with a stale in-memory identity but the *other* tab's token.
  // React to cross-tab token changes by re-syncing (or logging out).
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key !== 'token') return;
      const newToken = e.newValue;
      if (newToken !== token) {
        if (newToken) {
          // A different session was established in another tab — adopt it and
          // re-fetch the matching user so identity and token stay consistent.
          setUser(null);
          setLoading(true);
          setToken(newToken);
        } else {
          // Logged out elsewhere — tear down this tab's session too.
          setToken(null);
          setUser(null);
          setJustLoggedIn(false);
          disconnectSocket();
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data.user);
    } catch (error) {
      console.error('Error fetching user:', error);
      // Only destroy the session when the token is genuinely invalid (401).
      // Transient failures — e.g. 429 rate-limit during fast navigation, a 5xx,
      // or a network blip — must NOT log the user out; doing so would bounce a
      // perfectly valid session back to /login. Keep the existing session and
      // let the next request recover.
      if (error.response?.status === 401) {
        logout();
      }
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
