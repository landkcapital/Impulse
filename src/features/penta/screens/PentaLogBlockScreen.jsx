import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile } from "../api/pentaProfileApi";
import { getUserPillars } from "../api/pentaPillarsApi";
import { getTasksForDate } from "../api/pentaTasksApi";
import { createTimeBlockWithPoints } from "../api/pentaTimeBlocksApi";
import { uploadBlockPhoto } from "../api/pentaBlockPhotosApi";
import {
  getDefaultBlock,
  formatTime,
  parseTimeToday,
  getDurationMinutes,
  getTodayDateString,
  formatDuration,
} from "../lib/time";
import PentaHeader from "../components/PentaHeader";
import PentaNavBar from "../components/PentaNavBar";
import PentaLoader from "../components/PentaLoader";
import useSubPillars from "../hooks/useSubPillars";

function makeEntry(defaultPillarId) {
  return {
    id: crypto.randomUUID(),
    summary: "",
    pillarId: defaultPillarId || "",
    subPillarKey: "",
    photo: null,
  };
}

// ─── Per-entry pillar + photo picker ───
function EntryCard({
  entry,
  index,
  pillars,
  subPillarsByPillar,
  canRemove,
  onChange,
  onRemove,
}) {
  const fileRef = useRef(null);
  const selectedPillar = pillars.find((p) => p.id === entry.pillarId);
  const subs = selectedPillar
    ? (subPillarsByPillar[selectedPillar.key] || []).filter((sp) => sp.is_active)
    : [];

  function update(updates) {
    onChange(entry.id, { ...entry, ...updates });
  }

  return (
    <div className="card penta-log-entry-card">
      <div className="penta-log-entry-header">
        <span className="penta-log-entry-num">{index + 1}</span>
        {canRemove && (
          <button
            type="button"
            className="penta-log-entry-remove"
            onClick={() => onRemove(entry.id)}
            aria-label="Remove"
          >
            &times;
          </button>
        )}
      </div>

      {/* Summary */}
      <input
        type="text"
        className="penta-log-summary-input"
        value={entry.summary}
        onChange={(e) => update({ summary: e.target.value })}
        placeholder={index === 0 ? "What did you do?" : "Another thing you did..."}
        autoFocus={index === 0}
      />

      {/* Compact pillar picker */}
      <div className="penta-log-entry-pillars">
        {pillars.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`penta-log-entry-pillar ${entry.pillarId === p.id ? "selected" : ""}`}
            style={{
              borderColor: p.colour,
              backgroundColor: entry.pillarId === p.id ? p.colour : "transparent",
              color: entry.pillarId === p.id ? "#fff" : p.colour,
            }}
            onClick={() => {
              const updates = { pillarId: p.id };
              if (entry.pillarId !== p.id) updates.subPillarKey = "";
              update(updates);
            }}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Sub-pillar */}
      {subs.length > 0 && (
        <div className="penta-log-entry-subs">
          <button
            type="button"
            className={`penta-log-sub-btn ${entry.subPillarKey === "" ? "selected" : ""}`}
            onClick={() => update({ subPillarKey: "" })}
          >
            None
          </button>
          {subs.map((sp) => (
            <button
              key={sp.key}
              type="button"
              className={`penta-log-sub-btn ${entry.subPillarKey === sp.key ? "selected" : ""}`}
              style={{
                borderColor: sp.colour || "#999",
                color: entry.subPillarKey === sp.key ? "#fff" : (sp.colour || "#999"),
                backgroundColor: entry.subPillarKey === sp.key ? (sp.colour || "#999") : "transparent",
              }}
              onClick={() => update({ subPillarKey: sp.key })}
            >
              {sp.label}
            </button>
          ))}
        </div>
      )}

      {/* Photo */}
      <div className="penta-log-entry-photo-row">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="penta-log-file-input"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) update({ photo: file });
            e.target.value = "";
          }}
        />
        {entry.photo ? (
          <div className="penta-log-entry-photo-thumb">
            <img src={URL.createObjectURL(entry.photo)} alt="" />
            <button
              type="button"
              className="penta-log-photo-remove"
              onClick={() => update({ photo: null })}
              aria-label="Remove photo"
            >
              &times;
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="penta-log-entry-photo-btn"
            onClick={() => fileRef.current?.click()}
          >
            + Photo
          </button>
        )}
      </div>
    </div>
  );
}

export default function PentaLogBlockScreen() {
  const navigate = useNavigate();
  const { byPillar: subPillarsByPillar } = useSubPillars();

  // Data
  const [profile, setProfile] = useState(null);
  const [pillars, setPillars] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Form state
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [lockedIncrement, setLockedIncrement] = useState(null);
  const [entries, setEntries] = useState([]);
  const [taskId, setTaskId] = useState("");

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Load profile, pillars, tasks on mount
  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const today = getTodayDateString();
        const [prof, userPillars, todayTasks] = await Promise.all([
          getProfile(),
          getUserPillars(),
          getTasksForDate(today),
        ]);

        if (ignore) return;

        setProfile(prof);
        const active = userPillars.filter((p) => p.is_active);
        setPillars(active);
        setTasks(todayTasks);

        const inc = prof?.increment_minutes || 15;
        const { start, end } = getDefaultBlock(inc);
        setStartTime(formatTime(start));
        setEndTime(formatTime(end));
        setLockedIncrement(inc);

        // Create first entry with default pillar
        setEntries([makeEntry(active[0]?.id || "")]);
      } catch (err) {
        if (!ignore) setLoadError(err.message || "Failed to load");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => { ignore = true; };
  }, []);

  // Duration
  const duration = (() => {
    if (!startTime || !endTime) return 0;
    const s = parseTimeToday(startTime);
    const e = parseTimeToday(endTime);
    return getDurationMinutes(s, e);
  })();

  const totalPoints = Math.max(0, duration);

  // Validation
  function getValidationError() {
    const valid = entries.filter((e) => e.summary.trim());
    if (valid.length === 0) return "Add at least one item";
    if (duration <= 0) return "End time must be after start time";
    for (const e of valid) {
      if (!e.pillarId) return `Select a pillar for "${e.summary.trim()}"`;
    }
    return null;
  }

  async function handleSave() {
    const err = getValidationError();
    if (err) {
      setSaveError(err);
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const today = getTodayDateString();
      const startDate = parseTimeToday(startTime);
      const endDate = parseTimeToday(endTime);
      const validEntries = entries.filter((e) => e.summary.trim());

      const linkedTask = taskId ? tasks.find((t) => t.id === taskId) : null;

      for (const entry of validEntries) {
        const workTag = entry.subPillarKey || linkedTask?.work_tag || null;

        const block = await createTimeBlockWithPoints({
          startAt: startDate.toISOString(),
          endAt: endDate.toISOString(),
          localDate: today,
          summary: entry.summary.trim(),
          taskId: taskId || null,
          totalPoints,
          pillarAllocations: [{ pillarId: entry.pillarId, points: totalPoints }],
          workTag,
        });

        if (entry.photo) {
          try {
            await uploadBlockPhoto(block.id, entry.photo);
          } catch (photoErr) {
            console.error("Photo upload failed:", photoErr);
            // Block saved, photo failed — continue
          }
        }
      }

      navigate("/", { state: { logged: true } });
    } catch (err) {
      setSaveError(err.message || "Failed to save time block");
    } finally {
      setSaving(false);
    }
  }

  function updateEntry(id, updated) {
    setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
  }

  function removeEntry(id) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function addEntry() {
    const defaultPillar = pillars[0]?.id || "";
    setEntries((prev) => [...prev, makeEntry(defaultPillar)]);
  }

  // Loading state
  if (loading) {
    return (
      <div className="page penta-page">
        <PentaLoader />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="page penta-page">
        <h1 className="page-title">Log Block</h1>
        <div className="card penta-error">
          <div className="penta-error-title">Something went wrong</div>
          <div className="penta-error-message">{loadError}</div>
          <button className="btn small" onClick={() => navigate("/")}>
            Back
          </button>
        </div>
      </div>
    );
  }

  if (pillars.length === 0) {
    return (
      <div className="page penta-page">
        <h1 className="page-title">Log Block</h1>
        <div className="card penta-error">
          <div className="penta-error-title">No pillars found</div>
          <div className="penta-error-message">
            Your account needs to be set up before logging.
          </div>
          <button className="btn small" onClick={() => navigate("/")}>
            Back
          </button>
        </div>
      </div>
    );
  }

  const increment = profile?.increment_minutes || 15;
  const hasContent = entries.some((e) => e.summary.trim());

  return (
    <div className="page penta-page penta-page-with-nav">
      <PentaHeader title="Log Block" showBack />

      {/* Time range */}
      <div className="card penta-log-section">
        <div className="penta-log-time-row">
          <div className="penta-log-time-field">
            <label className="penta-log-label">Start</label>
            <input
              type="time"
              className="penta-log-time-input"
              value={startTime}
              onChange={(e) => {
                const newStart = e.target.value;
                setStartTime(newStart);
                const gap = lockedIncrement || increment;
                try {
                  const s = parseTimeToday(newStart);
                  const newEnd = new Date(s.getTime() + gap * 60000);
                  setEndTime(formatTime(newEnd));
                } catch {
                  // keep existing end
                }
              }}
              step={increment * 60}
            />
          </div>
          <div className="penta-log-time-divider">&rarr;</div>
          <div className="penta-log-time-field">
            <label className="penta-log-label">End</label>
            <input
              type="time"
              className="penta-log-time-input"
              value={endTime}
              onChange={(e) => {
                setEndTime(e.target.value);
                try {
                  const s = parseTimeToday(startTime);
                  const newE = parseTimeToday(e.target.value);
                  const newGap = getDurationMinutes(s, newE);
                  if (newGap > 0) setLockedIncrement(newGap);
                } catch {
                  // ignore
                }
              }}
              step={increment * 60}
            />
          </div>
          <div className="penta-log-duration">
            {duration > 0 ? formatDuration(duration) : "--"}
          </div>
        </div>
      </div>

      {/* Log entries */}
      {entries.map((entry, i) => (
        <EntryCard
          key={entry.id}
          entry={entry}
          index={i}
          pillars={pillars}
          subPillarsByPillar={subPillarsByPillar}
          canRemove={entries.length > 1}
          onChange={updateEntry}
          onRemove={removeEntry}
        />
      ))}

      <button type="button" className="penta-log-add-entry" onClick={addEntry}>
        + Add another item
      </button>

      {/* Task linking */}
      {tasks.length > 0 && (
        <div className="card penta-log-section">
          <label className="penta-log-label">Link to task (optional)</label>
          <div className="penta-log-task-list">
            <button
              className={`penta-log-task-btn ${taskId === "" ? "selected" : ""}`}
              onClick={() => setTaskId("")}
            >
              None
            </button>
            {tasks.map((t) => (
              <button
                key={t.id}
                className={`penta-log-task-btn ${
                  taskId === t.id ? "selected" : ""
                }`}
                onClick={() => setTaskId(t.id)}
              >
                <span className="penta-log-task-title">{t.title}</span>
                {t.work_tag && (
                  <span className="penta-log-task-tag">{t.work_tag}</span>
                )}
                {t.is_non_negotiable && (
                  <span className="penta-log-task-nn">NN</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {saveError && <div className="form-error">{saveError}</div>}

      {/* Save */}
      <button
        className="btn primary"
        onClick={handleSave}
        disabled={saving || !hasContent || duration <= 0}
      >
        {saving ? "Saving..." : `Log ${duration > 0 ? formatDuration(duration) : "Block"}`}
      </button>

      <PentaNavBar />
    </div>
  );
}
