// Theme definitions for the dashboard.
// Each preset theme = a complete CSS variable override (glass.css [data-theme="..."])
// plus a 6-color palette for chart.js. The "custom" theme is just an accent hue
// the user dialed in; its palette is derived at runtime via paletteFromAccent.

export type ThemeId = 'lumen' | 'graphite' | 'paper' | 'ember' | 'custom';
export type PresetId = Exclude<ThemeId, 'custom'>;

export interface ThemeState {
  themeId: ThemeId;
  /** Set when themeId === 'custom'. The hue the user dialed in. */
  accent?: string;
}

export interface PresetTheme {
  id: PresetId;
  label: string;
  /** Three colors shown as a tiny preview grid in the picker. */
  swatch: string[];
  /** Six-color palette used by chart.js datasets. */
  palette: string[];
}

/** Default palette if a preset can't be resolved. */
const FALLBACK_PALETTE = [
  '#60a5fa',
  '#34d399',
  '#fbbf24',
  '#f87171',
  '#a78bfa',
  '#2dd4bf',
];

export const PRESET_THEMES: PresetTheme[] = [
  {
    id: 'lumen',
    label: 'lumen',
    swatch: ['#60a5fa', '#34d399', '#fbbf24'],
    palette: ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#2dd4bf'],
  },
  {
    id: 'graphite',
    label: 'graphite',
    swatch: ['#9ca3af', '#a3a3a3', '#737373'],
    palette: ['#9ca3af', '#b8c0cc', '#7a8290', '#d1d5db', '#8b92a0', '#a3aab6'],
  },
  {
    id: 'paper',
    label: 'paper',
    swatch: ['#2563eb', '#16a34a', '#d97706'],
    palette: ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0d9488'],
  },
  {
    id: 'ember',
    label: 'ember',
    swatch: ['#fb923c', '#fbbf24', '#ef4444'],
    palette: ['#fb923c', '#fbbf24', '#ef4444', '#f43f5e', '#facc15', '#fb7185'],
  },
];

// ---------- HSL <-> HEX for palette derivation from a single accent ----------

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const m = hex.replace('#', '').match(/^([0-9a-f]{6})$/i);
  if (!m) return { h: 220, s: 70, l: 65 };
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 0xff) / 255;
  const g = ((n >> 8) & 0xff) / 255;
  const b = (n & 0xff) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = clamp(s, 0, 100) / 100;
  l = clamp(l, 0, 100) / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))))
      .toString(16)
      .padStart(2, '0');
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function paletteFromAccent(accent: string): string[] {
  const { h, s } = hexToHsl(accent);
  const l = clamp(60, 35, 75);
  const sat = clamp(s, 50, 80);
  return [
    accent,
    hslToHex(h + 60, sat, l),
    hslToHex(h + 120, sat, l),
    hslToHex(h + 180, sat, l),
    hslToHex(h + 240, sat, l),
    hslToHex(h + 300, sat, l),
  ];
}

export function getActivePalette(theme: ThemeState): string[] {
  if (theme.themeId === 'custom' && theme.accent) {
    return paletteFromAccent(theme.accent);
  }
  const preset = PRESET_THEMES.find((t) => t.id === theme.themeId);
  return preset?.palette ?? FALLBACK_PALETTE;
}

// ---------- Surface colors (chart axes, tooltips) ----------

/** Tint family for chart internals — drives tick / grid / tooltip colors. */
export interface SurfaceColors {
  /** Axis tick + legend + tooltip text color. */
  textMute: string;
  /** Grid line color on x/y scales. */
  grid: string;
  /** Whether the surface is light or dark (drives tooltip bg inversion). */
  isLight: boolean;
}

/** Currently only `paper` is light. Custom accent stays on the lumen dark
 * surface, so we don't flip for `custom`. */
export function isLightTheme(themeId: ThemeId): boolean {
  return themeId === 'paper';
}

export function getSurfaceColors(theme: ThemeState): SurfaceColors {
  return isLightTheme(theme.themeId)
    ? { textMute: 'rgba(60,60,60,0.85)', grid: 'rgba(0,0,0,0.07)', isLight: true }
    : { textMute: 'rgba(160,160,160,0.85)', grid: 'rgba(255,255,255,0.04)', isLight: false };
}

/** Convert a hex color to an rgba string at a given alpha. Used for the
 * MetricLineChart gradient so the fill follows the active palette. */
export function hexToRgba(hex: string, alpha: number): string {
  const m = hex.replace('#', '').match(/^([0-9a-f]{6})$/i);
  if (!m) return `rgba(96, 165, 250, ${alpha})`;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Combined theme context for chart components: palette + surface. */
export interface ThemeContext {
  palette: string[];
  surface: SurfaceColors;
}

export function getThemeContext(theme: ThemeState): ThemeContext {
  return {
    palette: getActivePalette(theme),
    surface: getSurfaceColors(theme),
  };
}
