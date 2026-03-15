import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile } from "../api/pentaProfileApi";
import { getUserPillars } from "../api/pentaPillarsApi";
import { getTasksForDate } from "../api/pentaTasksApi";
import { createTimeBlockWithPoints } from "../api/pentaTimeBlocksApi";
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
import useSubPillars from "../hooks/useSubPillars";

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
  const [summary, setSummary] = useState("");
  const [taskId, setTaskId] = useState("");
  const [primaryPillarId, setPrimaryPillarId] = useState("");
  const [secondPillarId, setSecondPillarId] = useState("");
  const [useSecondPillar, setUseSecondPillar] = useState(false);
  const [primaryPoints, setPrimaryPoints] = useState(0);
  const [secondPoints, setSecondPoints] = useState(0);
  const [subPillarKey, setSubPillarKey] = useState("");

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

        // Set default time block
        const inc = prof?.increment_minutes || 15;
        const { start, end } = getDefaultBlock(inc);
        setStartTime(formatTime(start));
        setEndTime(formatTime(end));

        // Default to first pillar
        if (active.length > 0) {
          setPrimaryPillarId(active[0].id);
        }

        // Default points
        const dur = getDurationMinutes(start, end);
        setPrimaryPoints(dur);
      } catch (err) {
        if (!ignore) setLoadError(err.message || "Failed to load");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => { ignore = true; };
  }, []);

  // Recompute points when times or pillar split changes
  const duration = (() => {
    if (!startTime || !endTime) return 0;
    const s = parseTimeToday(startTime);
    const e = parseTimeToday(endTime);
    return getDurationMinutes(s, e);
  })();

  const totalPoints = Math.max(0, duration);

  // Keep points in sync with total and split mode
  useEffect(() => {
    if (!useSecondPillar) {
      setPrimaryPoints(totalPoints);
      setSecondPoints(0);
    } else {
      const half = Math.ceil(totalPoints / 2);
      setPrimaryPoints(half);
      setSecondPoints(totalPoints - half);
    }
  }, [totalPoints, useSecondPillar]);

  // Validation
  function getValidationError() {
    if (!summary.trim()) return "Summary is required";
    if (duration <= 0) return "End time must be after start time";
    if (!primaryPillarId) return "Select a pillar";
    if (useSecondPillar && !secondPillarId) return "Select a second pillar";
    if (useSecondPillar && secondPillarId === primaryPillarId)
      return "Second pillar must be different";
    if (primaryPoints + secondPoints !== totalPoints)
      return "Points must equal total (" + totalPoints + ")";
    if (primaryPoints < 0 || secondPoints < 0)
      return "Points cannot be negative";
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

      const allocations = [
        { pillarId: primaryPillarId, points: primaryPoints },
      ];
      if (useSecondPillar && secondPillarId) {
        allocations.push({ pillarId: secondPillarId, points: secondPoints });
      }

      // Use selected sub-pillar, or fall back to linked task's work_tag
      const linkedTask = taskId ? tasks.find((t) => t.id === taskId) : null;
      const workTag = subPillarKey || linkedTask?.work_tag || null;

      await createTimeBlockWithPoints({
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
        localDate: today,
        summary: summary.trim(),
        taskId: taskId || null,
        totalPoints,
        pillarAllocations: allocations,
        workTag,
      });

      navigate("/", { state: { logged: true } });
    } catch (err) {
      setSaveError(err.message || "Failed to save time block");
    } finally {
      setSaving(false);
    }
  }

  function handlePrimaryPointsChange(val) {
    const num = Math.max(0, Math.min(totalPoints, Number(val) || 0));
    setPrimaryPoints(num);
    setSecondPoints(totalPoints - num);
  }

  function handleSecondPointsChange(val) {
    const num = Math.max(0, Math.min(totalPoints, Number(val) || 0));
    setSecondPoints(num);
    setPrimaryPoints(totalPoints - num);
  }

  // Loading state
  if (loading) {
    return (
      <div className="page penta-page">
        <div className="penta-loading">
          <div className="spinner" />
          <span>Loading...</span>
        </div>
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
  const allowDual = profile?.allow_dual_pillar_logging !== false;
  const selectedPrimary = pillars.find((p) => p.id === primaryPillarId);
  const selectedSecond = pillars.find((p) => p.id === secondPillarId);

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
              onChange={(e) => setStartTime(e.target.value)}
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
              onChange={(e) => setEndTime(e.target.value)}
              step={increment * 60}
            />
          </div>
          <div className="penta-log-duration">
            {duration > 0 ? formatDuration(duration) : "--"}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="card penta-log-section">
        <label className="penta-log-label">What did you do?</label>
        <input
          type="text"
          className="penta-log-summary-input"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="e.g. Deep work on project proposal"
          autoFocus
        />
      </div>

      {/* Primary pillar */}
      <div className="card penta-log-section">
        <label className="penta-log-label">Pillar</label>
        <div className="penta-log-pillar-grid">
          {pillars.map((p) => (
            <button
              key={p.id}
              className={`penta-log-pillar-btn ${
                primaryPillarId === p.id ? "selected" : ""
              }`}
              onClick={() => {
                setPrimaryPillarId(p.id);
                setSubPillarKey("");
                if (secondPillarId === p.id) setSecondPillarId("");
              }}
            >
              <span
                className="penta-log-pillar-dot"
                style={{ backgroundColor: p.colour }}
              />
              <span className="penta-log-pillar-label">{p.name}</span>
            </button>
          ))}
        </div>

        {/* Sub-pillar picker */}
        {(() => {
          const selPillar = pillars.find((p) => p.id === primaryPillarId);
          const subs = selPillar
            ? (subPillarsByPillar[selPillar.key] || []).filter((sp) => sp.is_active)
            : [];
          if (subs.length === 0) return null;
          return (
            <div className="penta-log-sub-section">
              <label className="penta-log-label" style={{ marginTop: "0.75rem" }}>Category</label>
              <div className="penta-log-sub-grid">
                <button
                  className={`penta-log-sub-btn ${subPillarKey === "" ? "selected" : ""}`}
                  onClick={() => setSubPillarKey("")}
                >
                  None
                </button>
                {subs.map((sp) => (
                  <button
                    key={sp.key}
                    className={`penta-log-sub-btn ${subPillarKey === sp.key ? "selected" : ""}`}
                    style={{
                      borderColor: sp.colour || "#999",
                      color: subPillarKey === sp.key ? "#fff" : (sp.colour || "#999"),
                      backgroundColor: subPillarKey === sp.key ? (sp.colour || "#999") : "transparent",
                    }}
                    onClick={() => setSubPillarKey(sp.key)}
                  >
                    {sp.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Second pillar toggle */}
        {allowDual && (
          <div className="penta-log-split-section">
            <button
              className={`penta-log-split-toggle ${
                useSecondPillar ? "active" : ""
              }`}
              onClick={() => {
                setUseSecondPillar(!useSecondPillar);
                if (useSecondPillar) {
                  setSecondPillarId("");
                }
              }}
            >
              {useSecondPillar ? "Single pillar" : "Split across two"}
            </button>

            {useSecondPillar && (
              <>
                <label className="penta-log-label" style={{ marginTop: "0.75rem" }}>
                  Second pillar
                </label>
                <div className="penta-log-pillar-grid">
                  {pillars
                    .filter((p) => p.id !== primaryPillarId)
                    .map((p) => (
                      <button
                        key={p.id}
                        className={`penta-log-pillar-btn ${
                          secondPillarId === p.id ? "selected" : ""
                        }`}
                        onClick={() => setSecondPillarId(p.id)}
                      >
                        <span
                          className="penta-log-pillar-dot"
                          style={{ backgroundColor: p.colour }}
                        />
                        <span className="penta-log-pillar-label">{p.name}</span>
                      </button>
                    ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Point allocation (only show when split) */}
      {useSecondPillar && secondPillarId && (
        <div className="card penta-log-section">
          <label className="penta-log-label">
            Point split ({totalPoints} total)
          </label>
          <div className="penta-log-points-row">
            <div className="penta-log-points-field">
              <span
                className="penta-log-pillar-dot"
                style={{ backgroundColor: selectedPrimary?.colour }}
              />
              <span className="penta-log-points-name">
                {selectedPrimary?.name}
              </span>
              <input
                type="number"
                className="penta-log-points-input"
                value={primaryPoints}
                onChange={(e) => handlePrimaryPointsChange(e.target.value)}
                min={0}
                max={totalPoints}
              />
            </div>
            <div className="penta-log-points-field">
              <span
                className="penta-log-pillar-dot"
                style={{ backgroundColor: selectedSecond?.colour }}
              />
              <span className="penta-log-points-name">
                {selectedSecond?.name}
              </span>
              <input
                type="number"
                className="penta-log-points-input"
                value={secondPoints}
                onChange={(e) => handleSecondPointsChange(e.target.value)}
                min={0}
                max={totalPoints}
              />
            </div>
          </div>
        </div>
      )}

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
        disabled={saving || !summary.trim() || duration <= 0}
      >
        {saving ? "Saving..." : `Log ${duration > 0 ? formatDuration(duration) : "Block"}`}
      </button>

      <PentaNavBar />
    </div>
  );
}
