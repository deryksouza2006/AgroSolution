import { createContext, useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createTheme, type AppTheme, type ThemePreference } from '../theme/tokens';

const THEME_KEY = 'citizentech_theme_preference';
interface ThemeContextValue {
  theme: AppTheme;
  preference: ThemePreference;
  isReady: boolean;
  storageError: string | null;
  setPreference: (preference: ThemePreference) => Promise<void>;
}
export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: PropsWithChildren) {
  const system = useColorScheme();
  const [preference, updatePreference] = useState<ThemePreference>('system');
  const [isReady, setReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const mounted = useRef(false);
  const writes = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => {
    mounted.current = true;
    let active = true;
    void SecureStore.getItemAsync(THEME_KEY).then(value => {
      if (active && (value === 'light' || value === 'dark' || value === 'system')) updatePreference(value);
    }).catch(() => {
      if (active) setStorageError('Não foi possível recuperar sua preferência de tema.');
    }).finally(() => { if (active) setReady(true); });
    return () => { active = false; mounted.current = false; };
  }, []);

  const setPreference = useCallback(async (value: ThemePreference) => {
    updatePreference(value);
    setStorageError(null);
    const write = writes.current.then(() => SecureStore.setItemAsync(THEME_KEY, value));
    writes.current = write.catch(() => undefined);
    try { await write; } catch {
      if (mounted.current) setStorageError('O tema foi aplicado, mas não foi possível salvar a preferência neste dispositivo.');
    }
  }, []);
  const isDark = preference === 'system' ? system === 'dark' : preference === 'dark';
  const value = useMemo(() => ({ theme: createTheme(isDark), preference, isReady, storageError, setPreference }), [isDark, preference, isReady, storageError, setPreference]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
