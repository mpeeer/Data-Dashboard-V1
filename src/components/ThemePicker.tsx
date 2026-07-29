// Color-theme picker. Lives in the topbar.
// Trigger: small button with current accent dot + "theme" label.
// Popover: 4 preset theme tiles + a custom-accent color input.

import { useEffect, useRef, useState } from 'react';
import {
  PRESET_THEMES,
  type PresetId,
} from '../utils/themes';
import { useTheme } from '../utils/useTheme';

const DEFAULT_ACCENT = '#60a5fa';

export function ThemePicker() {
  const { theme, setPreset, setCustom } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  const activePreset = PRESET_THEMES.find((t) => t.id === theme.themeId);
  const dotColor =
    theme.themeId === 'custom' && theme.accent
      ? theme.accent
      : activePreset?.swatch[0] ?? DEFAULT_ACCENT;
  const dotStyle = { ['--dot-color' as string]: dotColor };

  return (
    <div className="theme-picker" ref={rootRef}>
      <button
        type="button"
        className="btn theme-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="theme-dot" style={dotStyle} />
        <span className="theme-trigger-label">
          {activePreset?.label ?? 'Custom'}
        </span>
      </button>
      {open && (
        <div className="theme-pop" role="dialog" aria-label="Color theme">
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
