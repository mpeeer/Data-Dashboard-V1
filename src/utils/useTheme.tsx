// React hook + context for the active theme. Persists choice in localStorage
// and applies [data-theme] (preset) or inline `--accent` (custom) on <html> so
// every CSS rule in glass.css picks up the change for free. Multi-tab
// sessions stay in sync via the storage event. Initial application is
// synchronous at module load so the first paint already shows the right
// theme — no midnight-then-swap flash if localStorage holds a different theme.
//
// Uses React Context so every component that calls useTheme() shares the
// same state. When ThemePicker switches themes, chart components re-render
// with the new palette.
//
// Type definitions (ThemeId, ThemeState) live in ./themes (not here) so the
// type imports into themes.ts are non-circular.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  PRESET_THEMES,
  resolveTheme,
  deriveCustomSurface,
  CUSTOM_SURFACE_PROPS,
  type PresetId,
} from './themes';

export type { ThemeId, ThemeState } from './themes';
import type { ThemeState } from './themes';

const STORAGE_KEY = 'lumen-theme';

const DEFAULT_THEME: ThemeState = { themeId: 'lumen' };

function loadInitial(): ThemeState {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_THEME;
    const parsed = JSON.parse(raw) as Partial<ThemeState>;
    const validPresets = PRESET_THEMES.some((t) => t.id === parsed.themeId);
    if (parsed.themeId === 'custom' && typeof parsed.accent === 'string') {
      return { themeId: 'custom', accent: parsed.accent };
    }
    if (parsed.themeId === 'auto') return { themeId: 'auto' };
    if (validPresets) return { themeId: parsed.themeId as PresetId };
    return DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

function clearCustomSurface(root: HTMLElement): void {
  for (const prop of CUSTOM_SURFACE_PROPS) {
    root.style.removeProperty(prop);
  }
}

function applyToDocument(state: ThemeState): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (state.themeId === 'auto') {
    const resolved = resolveTheme(state);
    root.setAttribute('data-theme', resolved);
    clearCustomSurface(root);
  } else if (state.themeId === 'custom') {
    root.setAttribute('data-theme', 'custom');
    if (state.accent) {
      const vars = deriveCustomSurface(state.accent);
      for (const [key, value] of Object.entries(vars)) {
        root.style.setProperty(key, value);
      }
    } else {
      clearCustomSurface(root);
    }
  } else {
    root.setAttribute('data-theme', state.themeId);
    clearCustomSurface(root);
  }
}

// Synchronous first-paint application. Runs once at module import — before
// React mounts — so the document already has [data-theme=...] when the first
// paint happens, eliminating the default-theme flash.
if (typeof document !== 'undefined') {
  applyToDocument(loadInitial());
}

function persist(state: ThemeState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* private mode, quota, blocked storage — silently ignore */
  }
}

// ---------- React Context (shared state across all consumers) ----------

interface ThemeCtx {
  theme: ThemeState;
  setPreset: (id: PresetId) => void;
  setCustom: (accent: string) => void;
  setAuto: () => void;
}

const ThemeContext = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeState>(loadInitial);

  useEffect(() => {
    applyToDocument(theme);
  }, [theme]);

  // Cross-tab sync: if another tab updates the theme, this one follows.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      setThemeState(loadInitial());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // OS color-scheme listener: re-apply whenever the preference changes
  // while the "auto" theme is active. Uses a ref to avoid re-registering
  // the listener on every theme state change.
  const themeRef = useRef(theme);
  themeRef.current = theme;
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const current = themeRef.current;
      if (current.themeId === 'auto') {
        applyToDocument(current);
        setThemeState((prev) => ({ ...prev }));
      }
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const setPreset = useCallback((id: PresetId) => {
    const next: ThemeState = { themeId: id };
    setThemeState(next);
    persist(next);
  }, []);

  const setCustom = useCallback((accent: string) => {
    const next: ThemeState = { themeId: 'custom', accent };
    setThemeState(next);
    persist(next);
  }, []);

  const setAuto = useCallback(() => {
    const next: ThemeState = { themeId: 'auto' };
    setThemeState(next);
    persist(next);
  }, []);

  const value = useMemo<ThemeCtx>(
    () => ({ theme, setPreset, setCustom, setAuto }),
    [theme, setPreset, setCustom, setAuto],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme() must be used inside a <ThemeProvider>');
  }
  return ctx;
}
