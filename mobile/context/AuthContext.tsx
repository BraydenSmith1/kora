import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { clearCredentials, devLogin, loadCredentials, refreshSession } from '@/lib/auth';
import { setUserContext } from '@/lib/api';

type User = {
  id: string;
  name?: string;
  email?: string;
  regionId?: string;
  [key: string]: unknown;
};

type Wallet = {
  id: string;
  balanceCents: number;
  currency?: string;
  [key: string]: unknown;
};

type AuthState = {
  user: User | null;
  wallet: Wallet | null;
  regionId: string | null;
  loading: boolean;
  initialized: boolean;
};

type AuthContextValue = {
  state: AuthState;
  login: (payload: { email: string; name: string; regionId: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const initialState: AuthState = {
  user: null,
  wallet: null,
  regionId: null,
  loading: true,
  initialized: false,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const credentials = await loadCredentials();
      if (!credentials || !isMounted) {
        setState(prev => ({ ...prev, loading: false, initialized: true }));
        return;
      }

      try {
        setUserContext(credentials.userId);
        const data = await refreshSession();
        if (!isMounted) return;
        setState({
          user: data?.user ?? null,
          wallet: data?.wallet ?? null,
          regionId: credentials.regionId,
          loading: false,
          initialized: true,
        });
      } catch (error) {
        if (!isMounted) return;
        setState(prev => ({ ...prev, loading: false, initialized: true }));
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useMemo(
    () => async (payload: { email: string; name: string; regionId: string }) => {
      setState(prev => ({ ...prev, loading: true }));
      try {
        const credentials = await devLogin(payload);
        const data = await refreshSession();
        setState({
          user: data?.user ?? null,
          wallet: data?.wallet ?? null,
          regionId: credentials.regionId,
          loading: false,
          initialized: true,
        });
      } catch (error) {
        setState(prev => ({ ...prev, loading: false, initialized: true }));
        throw error;
      }
    },
    []
  );

  const logout = useMemo(
    () => async () => {
      await clearCredentials();
      setState({
        user: null,
        wallet: null,
        regionId: null,
        loading: false,
        initialized: true,
      });
    },
    []
  );

  const refresh = useMemo(
    () => async () => {
      setState(prev => ({ ...prev, loading: true }));
      try {
        const data = await refreshSession();
        setState(prev => ({
          user: data?.user ?? null,
          wallet: data?.wallet ?? null,
          regionId: prev.regionId,
          loading: false,
          initialized: true,
        }));
      } catch (error) {
        setState({
          user: null,
          wallet: null,
          regionId: null,
          loading: false,
          initialized: true,
        });
      }
    },
    []
  );

  const value = useMemo(
    () => ({
      state,
      login,
      logout,
      refresh,
    }),
    [state, login, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used inside AuthProvider');
  }
  return ctx;
}
