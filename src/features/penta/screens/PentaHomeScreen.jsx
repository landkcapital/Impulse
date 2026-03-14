import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import usePentaDashboard from "../hooks/usePentaDashboard";
import usePentaTasks from "../hooks/usePentaTasks";
import { formatDuration } from "../lib/time";
import {
  WORK_TAGS,
  WORK_TAG_COLOURS,
  generateFounderInsight,
} from "../lib/founderInsight";
import PentaBalancePentagon from "../components/PentaBalancePentagon";
import PentaHeader from "../components/PentaHeader";
import PentaNavBar from "../components/PentaNavBar";
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

function WorkFocusCard({ workTagTotals }) {
  const insightText = generateFounderInsight(workTagTotals);

  return (
    <div className="card penta-founder-card">
      <div className="penta-founder-title">Work Focus Today</div>
      <div className="penta-founder-rows">
        {WORK_TAGS.map((tag) => {
          const minutes = workTagTotals[tag.key] || 0;
          return (
            <div key={tag.key} className="penta-founder-row">
              <span
                className="penta-founder-dot"
                style={{ backgroundColor: WORK_TAG_COLOURS[tag.key] }}
              />
              <span className="penta-founder-label">{tag.label}</span>
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

function WorkTagBadge({ workTag }) {
  const tag = WORK_TAGS.find((t) => t.key === workTag);
  if (!tag) return null;

  return (
    <span
      className="penta-task-work-tag"
      style={{
        backgroundColor: WORK_TAG_COLOURS[workTag] + "18",
        color: WORK_TAG_COLOURS[workTag],
        borderColor: WORK_TAG_COLOURS[workTag] + "30",
      }}
    >
      {tag.label}
    </span>
  );
}

function TaskRow({ task, pillarMap, onToggle, onDelete }) {
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
      {task.work_tag && <WorkTagBadge workTag={task.work_tag} />}
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

function QuickAddTask({ onAdd }) {
  const [value, setValue] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const title = value.trim();
    if (!title || adding) return;

    setAdding(true);
    try {
      await onAdd({ title, isNonNegotiable: false });
      setValue("");
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
    </form>
  );
}

export default function PentaHomeScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { pillars, scores, loading, error, refresh, profile, workTagTotals } =
    usePentaDashboard();
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
        <div className="penta-loading">
          <div className="spinner" />
          <span>Loading Penta...</span>
        </div>
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
                onClick={() => navigate("/penta/log")}
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
          onClick={() => navigate("/penta/log")}
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

          {/* Founder Mode: Work Focus card */}
          {workPillar && workPoints > 0 && (
            <WorkFocusCard workTagTotals={workTagTotals} />
          )}

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
            <QuickAddTask onAdd={createTask} />
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

            <QuickAddTask onAdd={createTask} />
          </>
        )}
      </div>

      <PentaNavBar />
    </div>
  );
}
