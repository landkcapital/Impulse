import { useState, useEffect } from "react";
import { fetchSettings, upsertSettings } from "../lib/impulses";

const ACCENT_COLORS = [
  { color: "#a855f7", dark: "#7c3aed", name: "Purple" },
  { color: "#3b82f6", dark: "#2563eb", name: "Blue" },
  { color: "#06b6d4", dark: "#0891b2", name: "Cyan" },
  { color: "#10b981", dark: "#059669", name: "Emerald" },
  { color: "#f59e0b", dark: "#d97706", name: "Amber" },
  { color: "#f97316", dark: "#ea580c", name: "Orange" },
  { color: "#ef4444", dark: "#dc2626", name: "Red" },
  { color: "#ec4899", dark: "#db2777", name: "Pink" },
  { color: "#8b5cf6", dark: "#7c3aed", name: "Violet" },
  { color: "#64748b", dark: "#475569", name: "Slate" },
];

export function applyAccentColor(color) {
  const match = ACCENT_COLORS.find((c) => c.color === color);
  const dark = match?.dark || color;
  document.documentElement.style.setProperty("--theme-accent", color);
  document.documentElement.style.setProperty("--theme-accent-dark", dark);
}

export default function Settings() {
  const [selectedColor, setSelectedColor] = useState("#a855f7");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchSettings().then((settings) => {
      if (settings?.accent_color) {
        setSelectedColor(settings.accent_color);
        applyAccentColor(settings.accent_color);
      }
    }).catch(() => {});
  }, []);

  async function handleColorSelect(color) {
    setSelectedColor(color);
    applyAccentColor(color);
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await upsertSettings(color);
      setSuccess("Theme updated!");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err.message || "Failed to save theme");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page settings-page">
      <h2 className="page-title" style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "1.25rem" }}>
        Settings
      </h2>

      {error && <p className="form-error">{error}</p>}
      {success && <p className="form-success">{success}</p>}

      <div className="card settings-section">
        <h3>Accent Color</h3>
        <div className="color-picker-grid">
          {ACCENT_COLORS.map((c) => (
            <button
              key={c.color}
              className={`color-swatch ${selectedColor === c.color ? "selected" : ""}`}
              style={{ background: `linear-gradient(135deg, ${c.dark}, ${c.color})` }}
              onClick={() => handleColorSelect(c.color)}
              disabled={saving}
              title={c.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
