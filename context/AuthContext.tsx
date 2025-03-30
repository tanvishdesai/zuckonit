'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getCurrentUser, login, logout, createUserAccount, updateUserName, updateUserEmail, updateUserPassword } from '@/lib/appwrite';
import { Models } from 'appwrite';

interface AuthContextProps {
  user: Models.User<Models.Preferences> | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  updateEmail: (email: string, password: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error checking user:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const loginUser = async (email: string, password: string) => {
    try {
      setLoading(true);
      await login(email, password);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = async () => {
    try {
      setLoading(true);
      await logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      await createUserAccount(email, password, name);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUserNameHandler = async (name: string) => {
    try {
      setLoading(true);
      await updateUserName(name);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Update name error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUserEmailHandler = async (email: string, password: string) => {
    try {
      setLoading(true);
      await updateUserEmail(email, password);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Update email error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUserPasswordHandler = async (currentPassword: string, newPassword: string) => {
    try {
      setLoading(true);
      await updateUserPassword(currentPassword, newPassword);
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login: loginUser,
        logout: logoutUser,
        register: registerUser,
        updateName: updateUserNameHandler,
        updateEmail: updateUserEmailHandler,
        updatePassword: updateUserPasswordHandler,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 