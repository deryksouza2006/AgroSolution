import { createContext, useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { tokenStorage } from '../services/tokenStorage';
import type { AuthResponse, AuthUser, Session, SignInInput, SignUpInput } from '../types/auth';
import { AppError, isUnauthorized } from '../utils/errors';

interface AuthContextValue {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasSessionRestoreError: boolean;
  signIn: (input: SignInInput) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  retrySessionRestore: () => Promise<void>;
}
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const ME_KEY = ['auth', 'me'] as const;

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [hasSessionRestoreError, setRestoreError] = useState(false);
  const mounted = useRef(false);
  const busy = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);

  const validateSession = useCallback(async (token: string, expiresAt: string | null, operation: number) => {
    queryClient.removeQueries({ queryKey: ME_KEY });
    const user = await queryClient.fetchQuery({
      queryKey: ME_KEY,
      queryFn: ({ signal }) => authService.me(signal),
      staleTime: 0,
      networkMode: 'always',
    });
    if (mounted.current && operation === generation.current) setSession({ token, tokenType: 'Bearer', expiresAt, user });
  }, [queryClient]);

  const handleValidationFailure = useCallback(async (error: unknown, operation: number) => {
    if (!mounted.current || operation !== generation.current) return;
    setSession(null);
    queryClient.clear();
    if (isUnauthorized(error)) {
      try { await tokenStorage.remove(); } catch {
        if (mounted.current && operation === generation.current) setRestoreError(true);
        return;
      }
      if (mounted.current && operation === generation.current) setRestoreError(false);
    } else {
      setRestoreError(true);
    }
  }, [queryClient]);

  const retrySessionRestore = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    const operation = ++generation.current;
    setLoading(true);
    setRestoreError(false);
    try {
      const token = await tokenStorage.get();
      if (!mounted.current || operation !== generation.current) return;
      if (token) await validateSession(token, null, operation);
      else setSession(null);
    } catch (error: unknown) {
      await handleValidationFailure(error, operation);
    } finally {
      if (operation === generation.current) {
        busy.current = false;
        if (mounted.current) setLoading(false);
      }
    }
  }, [handleValidationFailure, validateSession]);

  useEffect(() => {
    mounted.current = true;
    void retrySessionRestore();
    return () => {
      mounted.current = false;
      ++generation.current;
      busy.current = false;
      controller.current?.abort();
      void queryClient.cancelQueries({ queryKey: ME_KEY });
    };
  }, [queryClient, retrySessionRestore]);

  const authenticate = useCallback(async (request: (signal: AbortSignal) => Promise<AuthResponse>) => {
    if (busy.current) throw new AppError('Aguarde a operação em andamento.');
    busy.current = true;
    const operation = ++generation.current;
    const abort = new AbortController();
    controller.current = abort;
    let saved = false;
    try {
      const response = await request(abort.signal);
      if (!mounted.current || operation !== generation.current) return;
      await tokenStorage.set(response.token);
      saved = true;
      if (!mounted.current || operation !== generation.current) return;
      await validateSession(response.token, response.expiresAt, operation);
    } catch (error: unknown) {
      if (saved) await handleValidationFailure(error, operation);
      throw error;
    } finally {
      if (operation === generation.current) busy.current = false;
    }
  }, [handleValidationFailure, validateSession]);

  const signIn = useCallback((input: SignInInput) => authenticate(signal => authService.signIn(input, signal)), [authenticate]);
  const signUp = useCallback((input: SignUpInput) => authenticate(signal => authService.signUp(input, signal)), [authenticate]);
  const signOut = useCallback(async () => {
    if (busy.current) throw new AppError('Aguarde a operação em andamento.');
    busy.current = true;
    const operation = ++generation.current;
    controller.current?.abort();
    setLoading(true);
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
      await tokenStorage.remove();
      if (mounted.current && operation === generation.current) {
        setSession(null);
        setRestoreError(false);
      }
    } catch {
      if (mounted.current && operation === generation.current) {
        setSession(null);
        setRestoreError(true);
      }
      throw new AppError('Não foi possível remover a sessão do dispositivo. Tente sair novamente.');
    } finally {
      if (operation === generation.current) {
        busy.current = false;
        if (mounted.current) setLoading(false);
      }
    }
  }, [queryClient]);

  const value = useMemo(() => ({
    user: session?.user ?? null, session, isLoading, isAuthenticated: session !== null && !hasSessionRestoreError,
    hasSessionRestoreError, signIn, signUp, signOut, retrySessionRestore,
  }), [session, isLoading, hasSessionRestoreError, signIn, signUp, signOut, retrySessionRestore]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
