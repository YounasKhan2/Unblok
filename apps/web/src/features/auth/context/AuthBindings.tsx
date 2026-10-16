import {createContext,useContext} from 'react';
import type {AuthStatus,AuthenticatedUser,WorkspaceMembership,AuthAdapter,AuthResult} from '../types';
export interface AuthContextType {
  mode?: 'live' | 'demo';
  status: AuthStatus;
  user: AuthenticatedUser | null;
  membership: WorkspaceMembership | null;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<AuthResult>;
  signup: (data: { name: string; email: string; password: string }) => Promise<AuthResult>;
  logout: () => void;
  expireSession: () => void;
  restoreSession: () => void;
  setGuest: () => void;
  switchReviewerUser: (email: string) => void;
  adapter: AuthAdapter;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
