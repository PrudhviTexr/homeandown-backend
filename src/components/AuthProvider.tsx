import React from 'react';
import { AuthProvider as ContextAuthProvider } from '@/contexts/AuthContext';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  return <ContextAuthProvider>{children}</ContextAuthProvider>;
};