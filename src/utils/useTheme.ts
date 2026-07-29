// React hook for the active theme. Persists choice in localStorage and
// applies [data-theme] (preset) or inline `--accent` (custom) on <html> so
// every CSS rule in glass.css picks up the change for free. Multi-tab
// sessions stay in sync via the storage event. Initial application is
// synchronous at module load so the first paint already shows the right
// theme — no lumen-then-swap flash if localStorage holds a different theme.
//
// Type definitions (ThemeId, ThemeState) live in ./themes (not here) so the
// type imports into themes.ts are non-circular.

import { useCallback, useEffect, useState } from 'react';
import { PRESET_THEMES, type PresetId } from './themes';

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
    if (validPresets) return { themeId: parsed.themeId as PresetId };
    return DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

function applyToDocument(state: ThemeState): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (state.themeId === 'custom') {
    root.setAttribute('data-theme', 'custom');
    if (state.accent) root.style.setProperty('--accent', state.accent);
    else root.style.removeProperty('--accent');
  } else {
    root.setAttribute('data-theme', state.themeId);
    root.style.removeProperty('--accent');
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

export function useTheme(): {
  theme: ThemeState;
  setPreset: (id: PresetId) => void;
  setCustom: (accent: string) => void;
} {
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

  return { theme, setPreset, setCustom };
}
