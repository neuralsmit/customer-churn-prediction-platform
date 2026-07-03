import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';

interface User {
  id: number;
  username: string;
  role: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Silently verify user details from backend
        try {
          const verifiedUser = await api.get<User>('/auth/me');
          setUser(verifiedUser);
          localStorage.setItem('user', JSON.stringify(verifiedUser));
        } catch (error) {
          console.error('Failed to verify token, logging out', error);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post<{ access_token: string; token_type: string }>('/auth/login', {
        username,
        password,
      });
      
      const accessToken = response.access_token;
      localStorage.setItem('token', accessToken);
      setToken(accessToken);
      
      // Fetch authenticated user info
      const userInfo = await api.get<User>('/auth/me');
      setUser(userInfo);
      localStorage.setItem('user', JSON.stringify(userInfo));
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, password: string) => {
    setLoading(true);
    try {
      await api.post<User>('/auth/register', {
        username,
        password,
        role: 'analyst',
      });
      // Automatically log in after registration
      await login(username, password);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
