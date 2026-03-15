import { useState, useEffect } from "react";
import usePentaSettings from "../hooks/usePentaSettings";
import useSubPillars from "../hooks/useSubPillars";
import { getUserPillars } from "../api/pentaPillarsApi";
import PentaHeader from "../components/PentaHeader";
import PentaNavBar from "../components/PentaNavBar";
import PentaLoader from "../components/PentaLoader";

const INCREMENT_OPTIONS = [
  { value: 5, label: "5 min" },
  { value: 10, label: "10 min" },
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 60, label: "60 min" },
];

const TIMEZONE_OPTIONS = [
  { value: "Australia/Brisbane", label: "Australia/Brisbane" },
  { value: "UTC", label: "UTC" },
];

function TemplateRow({ template, pillarMap, pillars, allSubPillars, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(template.title);
  const [saving, setSaving] = useState(false);

  const pillar = template.default_pillar_key
    ? pillarMap[template.default_pillar_key]
    : null;
  const subPillar = template.work_tag
    ? allSubPillars.find((sp) => sp.key === template.work_tag)
    : null;

  async function handleSave() {
    const trimmed = editTitle.trim();
    if (!trimmed || saving) return;
    if (trimmed === template.title) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onUpdate(template.id, { title: trimmed });
      setEditing(false);
    } catch {
      // stay in edit mode on failure
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="penta-set-template-row">
        <input
          type="text"
          className="penta-set-template-edit-input"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") {
              setEditTitle(template.title);
              setEditing(false);
            }
          }}
          onBlur={handleSave}
          autoFocus
          disabled={saving}
        />
      </div>
    );
  }

  return (
    <div className="penta-set-template-row">
      <div
        className="penta-set-template-info"
        onClick={() => {
          setEditTitle(template.title);
          setEditing(true);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setEditTitle(template.title);
            setEditing(true);
          }
        }}
      >
        {pillar && (
          <span
            className="penta-set-template-dot"
            style={{ backgroundColor: pillar.colour }}
          />
        )}
        <span className="penta-set-template-title">{template.title}</span>
        {subPillar && (
          <span
            className="penta-set-template-tag"
            style={{
              backgroundColor: (subPillar.colour || "#999") + "18",
              color: subPillar.colour || "#999",
            }}
          >
            {subPillar.label}
          </span>
        )}
      </div>
      <button
        className="penta-set-template-delete"
        onClick={() => onDelete(template.id)}
        aria-label="Delete template"
      >
        &times;
      </button>
    </div>
  );
}

function CreateTemplateForm({ pillars, subPillarsByPillar, onSave }) {
  const [title, setTitle] = useState("");
  const [pillarKey, setPillarKey] = useState("");
  const [workTag, setWorkTag] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || saving) return;

    setSaving(true);
    try {
      await onSave({
        title: trimmed,
        defaultPillarKey: pillarKey || null,
        workTag: workTag || null,
      });
      setTitle("");
      setPillarKey("");
      setWorkTag("");
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  const activeSubs = pillarKey
    ? (subPillarsByPillar[pillarKey] || []).filter((sp) => sp.is_active)
    : [];

  return (
    <form className="penta-set-template-form" onSubmit={handleSubmit}>
      <input
        type="text"
        className="penta-set-input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New non-negotiable..."
        disabled={saving}
      />
      <div className="penta-set-template-selects">
        <select
          className="penta-set-select"
          value={pillarKey}
          onChange={(e) => {
            setPillarKey(e.target.value);
            if (e.target.value !== "work") setWorkTag("");
          }}
        >
          <option value="">No pillar</option>
          {pillars.map((p) => (
            <option key={p.key} value={p.key}>
              {p.name}
            </option>
          ))}
        </select>
        {activeSubs.length > 0 && (
          <select
            className="penta-set-select"
            value={workTag}
            onChange={(e) => setWorkTag(e.target.value)}
          >
            <option value="">No category</option>
            {activeSubs.map((sp) => (
              <option key={sp.key} value={sp.key}>
                {sp.label}
              </option>
            ))}
          </select>
        )}
      </div>
      <button
        className="btn small primary"
        type="submit"
        disabled={saving || !title.trim()}
      >
        {saving ? "Adding..." : "Add"}
      </button>
    </form>
  );
}

export default function PentaSettingsScreen() {
  const {
    profile,
    templates,
    loading,
    error,
    updateProfile,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refresh,
  } = usePentaSettings();

  const {
    subPillars: allSubPillars,
    byPillar: subPillarsByPillar,
    createSub,
    deleteSub,
  } = useSubPillars();

  const [pillars, setPillars] = useState([]);
  const [saveStatus, setSaveStatus] = useState(null);
  const [newSubLabel, setNewSubLabel] = useState("");
  const [newSubPillar, setNewSubPillar] = useState("");
  const [addingSub, setAddingSub] = useState(false);

  // Load pillars for the template form
  useEffect(() => {
    getUserPillars()
      .then((data) => setPillars(data.filter((p) => p.is_active)))
      .catch(() => {});
  }, []);

  async function handleProfileChange(field, value) {
    setSaveStatus(null);
    try {
      await updateProfile({ [field]: value });
      setSaveStatus("Saved");
      setTimeout(() => setSaveStatus(null), 2000);
    } catch {
      setSaveStatus("Failed to save");
    }
  }

  if (loading) {
    return (
      <div className="page penta-page">
        <PentaLoader label="Loading settings..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page penta-page">
        <h1 className="page-title">Settings</h1>
        <div className="card penta-error">
          <div className="penta-error-title">Something went wrong</div>
          <div className="penta-error-message">{error}</div>
          <button className="btn small" onClick={refresh}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Build pillar map by key for template display
  const pillarByKey = {};
  for (const p of pillars) {
    pillarByKey[p.key] = p;
  }

  return (
    <div className="page penta-page penta-page-with-nav">
      <PentaHeader title="Settings" />

      {saveStatus && (
        <div className="penta-success-toast">{saveStatus}</div>
      )}

      {/* Logging section */}
      <div className="penta-set-section-label">Logging</div>
      <div className="card penta-set-card">
        <div className="penta-set-row">
          <label className="penta-set-label">Logging interval</label>
          <select
            className="penta-set-select"
            value={profile?.increment_minutes || 15}
            onChange={(e) =>
              handleProfileChange("increment_minutes", Number(e.target.value))
            }
          >
            {INCREMENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active hours section */}
      <div className="penta-set-section-label">Active Hours</div>
      <div className="card penta-set-card">
        <div className="penta-set-row">
          <label className="penta-set-label">Start time</label>
          <input
            type="time"
            className="penta-set-time-input"
            value={profile?.active_hours_start || "07:00"}
            onChange={(e) =>
              handleProfileChange("active_hours_start", e.target.value)
            }
          />
        </div>
        <div className="penta-set-row">
          <label className="penta-set-label">End time</label>
          <input
            type="time"
            className="penta-set-time-input"
            value={profile?.active_hours_end || "22:00"}
            onChange={(e) =>
              handleProfileChange("active_hours_end", e.target.value)
            }
          />
        </div>
      </div>

      {/* Timezone section */}
      <div className="penta-set-section-label">Timezone</div>
      <div className="card penta-set-card">
        <div className="penta-set-row">
          <label className="penta-set-label">Timezone</label>
          <select
            className="penta-set-select"
            value={profile?.timezone || "Australia/Brisbane"}
            onChange={(e) =>
              handleProfileChange("timezone", e.target.value)
            }
          >
            {TIMEZONE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Non-negotiable templates section */}
      <div className="penta-set-section-label">Daily Non-Negotiables</div>
      <div className="card penta-set-card">
        {templates.length === 0 ? (
          <div className="penta-set-template-empty">
            No templates yet. Add one below.
          </div>
        ) : (
          <div className="penta-set-template-list">
            {templates.map((tmpl) => (
              <TemplateRow
                key={tmpl.id}
                template={tmpl}
                pillarMap={pillarByKey}
                pillars={pillars}
                allSubPillars={allSubPillars}
                onUpdate={updateTemplate}
                onDelete={deleteTemplate}
              />
            ))}
          </div>
        )}
        <CreateTemplateForm pillars={pillars} subPillarsByPillar={subPillarsByPillar} onSave={createTemplate} />
      </div>

      {/* Sub-pillars / Categories section */}
      <div className="penta-set-section-label">Categories</div>
      <div className="card penta-set-card">
        <div className="penta-set-sub-desc">
          Add categories to any pillar to track how you spend time within it.
        </div>
        {pillars.map((pillar) => {
          const subs = subPillarsByPillar[pillar.key] || [];
          return (
            <div key={pillar.key} className="penta-set-sub-group">
              <div className="penta-set-sub-header">
                <span
                  className="penta-set-template-dot"
                  style={{ backgroundColor: pillar.colour }}
                />
                <span className="penta-set-sub-pillar-name">{pillar.name}</span>
              </div>
              {subs.length > 0 && (
                <div className="penta-set-sub-list">
                  {subs.map((sp) => (
                    <div key={sp.id} className="penta-set-sub-row">
                      <span
                        className="penta-set-sub-dot"
                        style={{ backgroundColor: sp.colour || pillar.colour }}
                      />
                      <span className="penta-set-sub-label">{sp.label}</span>
                      <button
                        className="penta-set-template-delete"
                        onClick={() => deleteSub(sp.id)}
                        aria-label={`Delete ${sp.label}`}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <form
                className="penta-set-sub-add"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (newSubPillar !== pillar.key) return;
                  const label = newSubLabel.trim();
                  if (!label || addingSub) return;
                  setAddingSub(true);
                  try {
                    const key = label.toLowerCase().replace(/[^a-z0-9]+/g, "_");
                    // Auto-generate colour as a variation of pillar colour
                    const hueShift = (subs.length * 30) % 360;
                    await createSub({
                      pillarKey: pillar.key,
                      key,
                      label,
                      colour: pillar.colour,
                    });
                    setNewSubLabel("");
                    setNewSubPillar("");
                  } catch {
                    // silent
                  } finally {
                    setAddingSub(false);
                  }
                }}
              >
                <input
                  type="text"
                  className="penta-set-sub-input"
                  value={newSubPillar === pillar.key ? newSubLabel : ""}
                  onChange={(e) => {
                    setNewSubPillar(pillar.key);
                    setNewSubLabel(e.target.value);
                  }}
                  onFocus={() => setNewSubPillar(pillar.key)}
                  placeholder={`Add ${pillar.name.toLowerCase()} category...`}
                  disabled={addingSub}
                />
              </form>
            </div>
          );
        })}
      </div>

      <PentaNavBar />
    </div>
  );
}
