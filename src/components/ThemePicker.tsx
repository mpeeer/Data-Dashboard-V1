// Color-theme picker. Lives in the topbar.
// Trigger: small button with current accent dot + theme label.
// Popover: preset theme tiles + Auto + a custom-accent color input.
// Focus is trapped inside the popover while open.
// Global shortcuts: Ctrl+1..4 = presets, Ctrl+0 = Auto.

import { useEffect, useRef, useState } from 'react';
import {
  PRESET_THEMES,
  type PresetId,
} from '../utils/themes';
import { useTheme } from '../utils/useTheme';

const DEFAULT_ACCENT = '#60a5fa';

const PRESET_ORDER: PresetId[] = ['lumen', 'graphite', 'paper', 'ember'];

export function ThemePicker() {
  const { theme, setPreset, setCustom, setAuto } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  // Close on outside click + Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Focus trap: Tab / Shift+Tab cycle inside the popover.
  useEffect(() => {
    if (!open) return;
    const pop = popRef.current;
    if (!pop) return;

    const focusable = () =>
      Array.from(
        pop.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const els = focusable();
      if (els.length === 0) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKey);
    // Focus the first tile on open.
    const first = focusable()[0];
    if (first) first.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Global keyboard shortcuts: Ctrl+1/2/3/4 → presets, Ctrl+0 → Auto.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      if (e.key === '1') setPreset(PRESET_ORDER[0]);
      else if (e.key === '2') setPreset(PRESET_ORDER[1]);
      else if (e.key === '3') setPreset(PRESET_ORDER[2]);
      else if (e.key === '4') setPreset(PRESET_ORDER[3]);
      else if (e.key === '0') setAuto();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [setPreset, setAuto]);

  const activePreset = PRESET_THEMES.find((t) => t.id === theme.themeId);
  const isAuto = theme.themeId === 'auto';
  const dotColor =
    theme.themeId === 'custom' && theme.accent
      ? theme.accent
      : activePreset?.swatch[0] ?? DEFAULT_ACCENT;
  const dotStyle = { ['--dot-color' as string]: dotColor };

  const triggerLabel = isAuto ? 'Auto' : (activePreset?.label ?? 'Custom');

  return (
    <div className="theme-picker" ref={rootRef}>
      <button
        type="button"
        className={`btn theme-trigger${open ? ' is-open' : ''}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="theme-dot" style={dotStyle} />
        <span className="theme-trigger-label">{triggerLabel}</span>
      </button>
      {open && (
        <div className="theme-pop" ref={popRef} role="dialog" aria-label="Color theme">
          <div className="theme-pop-head">Theme</div>
          <div className="theme-grid">
            {PRESET_THEMES.map((t) => {
              const isActive = theme.themeId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`theme-tile ${isActive ? 'is-active' : ''}`}
                  onClick={() => {
                    setPreset(t.id as PresetId);
                    setOpen(false);
                  }}
                >
                  <span className="tile-row">
                    {t.swatch.map((c, i) => (
                      <span
                        key={i}
                        className="tile-cell"
                        style={{ ['--cell-color' as string]: c }}
                      />
                    ))}
                  </span>
                  <span className="tile-name">{t.label}</span>
                </button>
              );
            })}
          </div>
          {/* Auto tile */}
          <button
            type="button"
            className={`theme-tile auto-tile ${isAuto ? 'is-active' : ''}`}
            onClick={() => {
              setAuto();
              setOpen(false);
            }}
          >
            <span className="tile-row auto-row">
              <span className="tile-cell" style={{ ['--cell-color' as string]: '#0a0a0a' }} />
              <span className="tile-cell" style={{ ['--cell-color' as string]: '#f7f7f5' }} />
              <span className="tile-cell" style={{ ['--cell-color' as string]: '#0a0a0a' }} />
            </span>
            <span className="tile-name">Auto</span>
          </button>
          <div className="theme-custom">
            <div className="theme-pop-head">Custom accent</div>
            <div className="theme-custom-row">
              <input
                type="color"
                value={theme.accent ?? DEFAULT_ACCENT}
                onChange={(e) => setCustom(e.target.value)}
                className="theme-custom-input"
                aria-label="Custom accent color"
              />
              <code className="theme-custom-hex">
                {(theme.themeId === 'custom' && theme.accent) || DEFAULT_ACCENT}
              </code>
            </div>
            <p className="theme-pop-foot">
              Saved per browser. Cleared if you reset site data.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
