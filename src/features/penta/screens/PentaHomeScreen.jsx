import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import usePentaDashboard from "../hooks/usePentaDashboard";
import usePentaTasks from "../hooks/usePentaTasks";
import { formatDuration } from "../lib/time";
import {
  WORK_TAGS,
  WORK_TAG_COLOURS,
  generateSubPillarInsight,
} from "../lib/founderInsight";
import useSubPillars from "../hooks/useSubPillars";
import PentaBalancePentagon from "../components/PentaBalancePentagon";
import PentaHeader from "../components/PentaHeader";
import PentaNavBar from "../components/PentaNavBar";
import PentaLoader from "../components/PentaLoader";
import useLoggingNudge from "../hooks/useLoggingNudge";

function formatToday() {
  const d = new Date();
  return d.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function PillarCard({ pillar, points }) {
  const hasPoints = points > 0;

  return (
    <div className="card penta-pillar-card">
      <div
        className="penta-pillar-accent"
        style={{ backgroundColor: pillar.colour }}
      />
      <div className="penta-pillar-info">
        <div className="penta-pillar-name">{pillar.name}</div>
        <div className="penta-pillar-sub">{pillar.key}</div>
      </div>
      <div className={`penta-pillar-score ${hasPoints ? "has-points" : ""}`}>
        {hasPoints ? formatDuration(points) : "0"}
      </div>
    </div>
  );
}

function SubPillarFocusCard({ pillarName, subPillars, totals }) {
  const insightText = generateSubPillarInsight(subPillars, totals, pillarName);

  return (
    <div className="card penta-founder-card">
      <div className="penta-founder-title">{pillarName} Focus Today</div>
      <div className="penta-founder-rows">
        {subPillars.map((sp) => {
          const minutes = totals[sp.key] || 0;
          return (
            <div key={sp.key} className="penta-founder-row">
              <span
                className="penta-founder-dot"
                style={{ backgroundColor: sp.colour || "#999" }}
              />
              <span className="penta-founder-label">{sp.label}</span>
              <span className="penta-founder-value">
                {minutes > 0 ? formatDuration(minutes) : "0m"}
              </span>
            </div>
          );
        })}
      </div>
      {insightText && (
        <div className="penta-founder-insight">{insightText}</div>
      )}
    </div>
  );
}

function SubPillarBadge({ subPillarKey, allSubPillars }) {
  const sp = allSubPillars.find((s) => s.key === subPillarKey);
  if (!sp) {
    // Fallback to hardcoded work tags
    const tag = WORK_TAGS.find((t) => t.key === subPillarKey);
    if (!tag) return null;
    const colour = WORK_TAG_COLOURS[subPillarKey] || "#999";
    return (
      <span
        className="penta-task-work-tag"
        style={{
          backgroundColor: colour + "18",
          color: colour,
          borderColor: colour + "30",
        }}
      >
        {tag.label}
      </span>
    );
  }

  const colour = sp.colour || "#999";
  return (
    <span
      className="penta-task-work-tag"
      style={{
        backgroundColor: colour + "18",
        color: colour,
        borderColor: colour + "30",
      }}
    >
      {sp.label}
    </span>
  );
}

function TaskRow({ task, pillarMap, allSubPillars, onToggle, onDelete }) {
  const pillar = task.default_pillar_key
    ? pillarMap[task.default_pillar_key]
    : null;

  return (
    <div className={`penta-task-row ${task.is_done ? "done" : ""}`}>
      <button
        className="penta-task-checkbox"
        onClick={() => onToggle(task.id, !task.is_done)}
        aria-label={task.is_done ? "Mark incomplete" : "Mark complete"}
      >
        <span className={`penta-task-check ${task.is_done ? "checked" : ""}`} />
      </button>
      <span className="penta-task-title">{task.title}</span>
      {task.work_tag && <SubPillarBadge subPillarKey={task.work_tag} allSubPillars={allSubPillars} />}
      {pillar && !task.work_tag && (
        <span
          className="penta-task-pillar-dot"
          style={{ backgroundColor: pillar.colour }}
          title={pillar.name}
        />
      )}
      {task.is_non_negotiable && (
        <span className="penta-task-daily-badge">Daily</span>
      )}
      {!task.is_non_negotiable && (
        <button
          className="penta-task-delete"
          onClick={() => onDelete(task.id)}
          aria-label="Delete task"
        >
          &times;
        </button>
      )}
    </div>
  );
}

function QuickAddTask({ onAdd, pillars, subPillarsByPillar }) {
  const [value, setValue] = useState("");
  const [selectedPillar, setSelectedPillar] = useState(null);
  const [selectedSubPillar, setSelectedSubPillar] = useState(null);
  const [adding, setAdding] = useState(false);

  const activeSubs = selectedPillar
    ? (subPillarsByPillar[selectedPillar] || []).filter((sp) => sp.is_active)
    : [];

  async function handleSubmit(e) {
    e.preventDefault();
    const title = value.trim();
    if (!title || adding) return;

    setAdding(true);
    try {
      await onAdd({
        title,
        isNonNegotiable: false,
        pillarKey: selectedPillar || null,
        workTag: selectedSubPillar || null,
      });
      setValue("");
      setSelectedPillar(null);
      setSelectedSubPillar(null);
    } catch {
      // silent — task stays in input for retry
    } finally {
      setAdding(false);
    }
  }

  return (
    <form className="penta-task-quick-add" onSubmit={handleSubmit}>
      <input
        type="text"
        className="penta-task-quick-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add a task for today..."
        disabled={adding}
      />
      {pillars && pillars.length > 0 && (
        <div className="penta-quick-pillar-row">
          {pillars.map((p) => (
            <button
              key={p.key}
              type="button"
              className={`penta-quick-pillar-dot ${selectedPillar === p.key ? "selected" : ""}`}
              style={{ backgroundColor: p.colour }}
              onClick={() => {
                if (selectedPillar === p.key) {
                  setSelectedPillar(null);
                  setSelectedSubPillar(null);
                } else {
                  setSelectedPillar(p.key);
                  setSelectedSubPillar(null);
                }
              }}
              title={p.name}
              aria-label={p.name}
            />
          ))}
        </div>
      )}
      {activeSubs.length > 0 && (
        <div className="penta-quick-sub-row">
          {activeSubs.map((sp) => (
            <button
              key={sp.key}
              type="button"
              className={`penta-quick-sub-btn ${selectedSubPillar === sp.key ? "selected" : ""}`}
              style={{
                borderColor: sp.colour || "#999",
                color: selectedSubPillar === sp.key ? "#fff" : (sp.colour || "#999"),
                backgroundColor: selectedSubPillar === sp.key ? (sp.colour || "#999") : "transparent",
              }}
              onClick={() => {
                setSelectedSubPillar(
                  selectedSubPillar === sp.key ? null : sp.key
                );
              }}
            >
              {sp.label}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}

export default function PentaHomeScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { pillars, scores, loading, error, refresh, profile, workTagTotals } =
    usePentaDashboard();
  const { subPillars, byPillar: subPillarsByPillar } = useSubPillars();
  const {
    tasks,
    loading: tasksLoading,
    createTask,
    toggleTaskComplete,
    deleteTask,
    refresh: refreshTasks,
  } = usePentaTasks();
  const [showSuccess, setShowSuccess] = useState(false);

  const increment = profile?.increment_minutes || 15;
  const {
    nudge,
    dismiss: dismissNudge,
    refresh: refreshNudge,
  } = useLoggingNudge(
    increment,
    profile?.active_hours_start,
    profile?.active_hours_end
  );

  // Show success toast if navigated back from log screen
  useEffect(() => {
    if (location.state?.logged) {
      setShowSuccess(true);
      refresh();
      refreshTasks();
      refreshNudge();
      // Clear navigation state so refresh doesn't re-trigger
      window.history.replaceState({}, "");
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [location.state, refresh, refreshTasks, refreshNudge]);

  if (loading) {
    return (
      <div className="page penta-page">
        <PentaLoader label="Loading Penta..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page penta-page">
        <h1 className="page-title">Today</h1>
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

  const activePillars = pillars.filter((p) => p.is_active);
  const totalPoints = activePillars.reduce(
    (sum, p) => sum + (scores[p.id] || 0),
    0
  );

  // Build pillar lookup by key for task dots
  const pillarByKey = {};
  for (const p of pillars) {
    pillarByKey[p.key] = p;
  }

  // Find the Work pillar to know if we should show the founder card
  const workPillar = activePillars.find((p) => p.key === "work");
  const workPoints = workPillar ? scores[workPillar.id] || 0 : 0;

  // Split tasks into non-negotiables and today tasks
  const nonNegotiables = tasks.filter((t) => t.is_non_negotiable);
  const todayTasks = tasks.filter((t) => !t.is_non_negotiable);

  return (
    <div className="page penta-page penta-page-with-nav">
      <PentaHeader title="Today" subtitle={formatToday()} />

      {showSuccess && (
        <div className="penta-success-toast">
          Block logged successfully
        </div>
      )}

      {/* Logging nudge */}
      {nudge && (
        <div className="penta-nudge card">
          <div className="penta-nudge-body">
            <div className="penta-nudge-text">{nudge.message}</div>
            <div className="penta-nudge-actions">
              <button
                className="btn small primary"
                onClick={() => navigate("/log")}
              >
                Log now
              </button>
              <button
                className="penta-nudge-dismiss"
                onClick={dismissNudge}
                aria-label="Dismiss"
              >
                &times;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="penta-cta">
        <button
          className="penta-cta-btn"
          onClick={() => navigate("/log")}
        >
          Log last {formatDuration(increment)}
        </button>
        <div className="penta-cta-sub">
          Retrospective &middot; what did you just do?
        </div>
      </div>

      {activePillars.length === 0 ? (
        <div className="card penta-empty">
          <div className="penta-empty-title">No pillars found</div>
          <div className="penta-empty-desc">
            Your life pillars will appear here once your account is set up.
          </div>
        </div>
      ) : (
        <>
          {/* Balance Pentagon */}
          <PentaBalancePentagon
            pillars={pillars}
            pillarTotals={scores}
          />

          <div className="penta-pillar-list">
            {activePillars.map((pillar) => (
              <PillarCard
                key={pillar.id}
                pillar={pillar}
                points={scores[pillar.id] || 0}
              />
            ))}
          </div>

          {/* Sub-pillar focus cards for pillars with sub-pillars and logged time */}
          {activePillars.map((pillar) => {
            const subs = (subPillarsByPillar[pillar.key] || []).filter((sp) => sp.is_active);
            const pillarPoints = scores[pillar.id] || 0;
            if (subs.length === 0 || pillarPoints === 0) return null;
            return (
              <SubPillarFocusCard
                key={pillar.key}
                pillarName={pillar.name}
                subPillars={subs}
                totals={workTagTotals}
              />
            );
          })}

          <div className="card penta-total-row">
            <span className="penta-total-label">Total today</span>
            <span className="penta-total-value">
              {totalPoints > 0 ? formatDuration(totalPoints) : "0"}
            </span>
          </div>

        </>
      )}

      {/* Task section */}
      <div className="penta-tasks-section">
        <div className="penta-tasks-header">Today</div>

        {tasksLoading ? (
          <div className="penta-tasks-loading">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="penta-tasks-empty">
            <div className="penta-tasks-empty-text">
              No tasks yet for today.
            </div>
            <QuickAddTask onAdd={createTask} pillars={activePillars} subPillarsByPillar={subPillarsByPillar} />
          </div>
        ) : (
          <>
            {/* Non-negotiables */}
            {nonNegotiables.length > 0 && (
              <div className="penta-tasks-group">
                <div className="penta-tasks-group-label">Non-Negotiables</div>
                {nonNegotiables.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    pillarMap={pillarByKey}
                    allSubPillars={subPillars}
                    onToggle={toggleTaskComplete}
                    onDelete={deleteTask}
                  />
                ))}
              </div>
            )}

            {/* Today tasks */}
            <div className="penta-tasks-group">
              {nonNegotiables.length > 0 && (
                <div className="penta-tasks-group-label">Today Tasks</div>
              )}
              {todayTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  pillarMap={pillarByKey}
                  onToggle={toggleTaskComplete}
                  onDelete={deleteTask}
                />
              ))}
            </div>

            <QuickAddTask onAdd={createTask} pillars={activePillars} subPillarsByPillar={subPillarsByPillar} />
          </>
        )}
      </div>

      <PentaNavBar />
    </div>
  );
}
