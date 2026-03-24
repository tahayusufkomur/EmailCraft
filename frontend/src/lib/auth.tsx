import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { api } from './api';
import type { OrganizationSummary, SiteUser } from '../types/api';

const TOKEN_KEY = 'mailcraft_site_token';

interface AuthContextValue {
  token: string | null;
  user: SiteUser | null;
  organization: OrganizationSummary | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (payload: {
    username: string;
    email: string;
    password: string;
    organization_name: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function extractOAuthToken(): string | null {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  if (token) {
    // Clean the URL without reloading
    params.delete('token');
    const cleanUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    window.history.replaceState({}, '', cleanUrl);
    return token;
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    // OAuth callback token takes priority
    const oauthToken = extractOAuthToken();
    if (oauthToken) {
      localStorage.setItem(TOKEN_KEY, oauthToken);
      return oauthToken;
    }
    return localStorage.getItem(TOKEN_KEY);
  });
  const [user, setUser] = useState<SiteUser | null>(null);
  const [organization, setOrganization] = useState<OrganizationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applyAuthState = useCallback((nextToken: string | null, nextUser: SiteUser | null, nextOrg: OrganizationSummary | null) => {
    setToken(nextToken);
    setUser(nextUser);
    setOrganization(nextOrg);

    if (nextToken) {
      localStorage.setItem(TOKEN_KEY, nextToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, []);

  const refresh = useCallback(async () => {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    if (!currentToken) {
      applyAuthState(null, null, null);
      setIsLoading(false);
      return;
    }

    try {
      const me = await api.getMe(currentToken);
      applyAuthState(currentToken, me.user, me.organization);
    } catch {
      applyAuthState(null, null, null);
    } finally {
      setIsLoading(false);
    }
  }, [applyAuthState]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const nextToken = await api.login(identifier, password);
      const me = await api.getMe(nextToken);
      applyAuthState(nextToken, me.user, me.organization);
    },
    [applyAuthState],
  );

  const register = useCallback(
    async (payload: {
      username: string;
      email: string;
      password: string;
      organization_name: string;
    }) => {
      const result = await api.register(payload);
      applyAuthState(result.token, result.user, result.organization);
    },
    [applyAuthState],
  );

  const logout = useCallback(async () => {
    if (token) {
      await api.logout(token).catch(() => undefined);
    }
    applyAuthState(null, null, null);
  }, [applyAuthState, token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      organization,
      isAuthenticated: Boolean(token),
      isLoading,
      login,
      register,
      logout,
      refresh,
    }),
    [isLoading, login, logout, organization, refresh, register, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}
