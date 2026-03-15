import { useState, useRef } from "react";
import useBusiness from "../hooks/useBusiness";
import { uploadBlockPhoto } from "../api/pentaBlockPhotosApi";
import PentaHeader from "../components/PentaHeader";
import PentaNavBar from "../components/PentaNavBar";
import PentaLoader from "../components/PentaLoader";

const DEFAULT_ROLES = [
  { name: "CEO", colour: "#1e293b", description: "Strategy, fundraising, partnerships, overall direction" },
  { name: "Engineer", colour: "#6366f1", description: "Build and maintain the core product" },
  { name: "Designer", colour: "#ec4899", description: "UI/UX, user research, brand" },
  { name: "Sales", colour: "#f59e0b", description: "Outreach, demos, closing deals" },
  { name: "Marketing", colour: "#14b8a6", description: "Content, SEO, social, paid ads" },
  { name: "Customer Success", colour: "#10b981", description: "Onboarding, support, retention" },
  { name: "Operations", colour: "#8b5cf6", description: "Billing, compliance, vendors, reporting" },
  { name: "Data / Analytics", colour: "#3b82f6", description: "Data pipelines, analytics, insights" },
  { name: "Biz Dev", colour: "#f97316", description: "Strategic partnerships, new channels" },
  { name: "DevOps", colour: "#64748b", description: "Infrastructure, CI/CD, security, uptime" },
];

const ROLE_COLOURS = [
  "#1e293b", "#6366f1", "#ec4899", "#f59e0b", "#14b8a6",
  "#10b981", "#8b5cf6", "#3b82f6", "#f97316", "#64748b",
  "#dc2626", "#0ea5c2", "#84cc16",
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function isOverdue(dueDate) {
  if (!dueDate) return false;
  return dueDate < todayStr();
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

function formatDateTime(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  return d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Urgent Tasks Banner ───
function UrgentBanner({ tasks, roles }) {
  const roleMap = {};
  for (const r of roles) roleMap[r.id] = r;

  const overdue = tasks.filter((t) => !t.is_done && isOverdue(t.due_date));
  const dueSoon = tasks.filter(
    (t) => !t.is_done && t.due_date && !isOverdue(t.due_date) && t.due_date <= todayStr()
  );
  const urgent = [...overdue, ...dueSoon];

  if (urgent.length === 0) return null;

  return (
    <div className="penta-biz-urgent card">
      <div className="penta-biz-urgent-header">
        <span className="penta-biz-urgent-icon">!</span>
        <span className="penta-biz-urgent-title">
          {overdue.length} overdue{dueSoon.length > 0 ? `, ${dueSoon.length} due today` : ""}
        </span>
      </div>
      <div className="penta-biz-urgent-list">
        {urgent.slice(0, 5).map((t) => {
          const role = roleMap[t.role_id];
          return (
            <div key={t.id} className="penta-biz-urgent-item">
              <span className="penta-biz-role-dot" style={{ backgroundColor: role?.colour }} />
              <span className="penta-biz-urgent-task-title">{t.title}</span>
              <span className={`penta-biz-urgent-due ${isOverdue(t.due_date) ? "overdue" : ""}`}>
                {formatDate(t.due_date)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Add Task Modal ───
function AddTaskModal({ roles, onAdd, onClose, defaultRoleId }) {
  const [title, setTitle] = useState("");
  const [roleId, setRoleId] = useState(defaultRoleId || "");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || !roleId || saving) return;
    setSaving(true);
    try {
      await onAdd({ roleId, title: trimmed, dueDate: dueDate || null });
      onClose();
    } catch {
      // stay open
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="penta-biz-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="penta-biz-modal card" onSubmit={handleSubmit}>
        <div className="penta-biz-modal-header">
          <span className="penta-biz-modal-title">New Task</span>
          <button type="button" className="penta-biz-modal-close" onClick={onClose}>&times;</button>
        </div>
        <input
          type="text"
          className="penta-biz-add-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          autoFocus
        />
        <label className="penta-biz-field-label">Assign to role</label>
        <div className="penta-biz-role-select">
          {roles.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`penta-biz-role-option ${roleId === r.id ? "selected" : ""}`}
              onClick={() => setRoleId(r.id)}
            >
              <span className="penta-biz-role-dot" style={{ backgroundColor: r.colour }} />
              {r.name}
            </button>
          ))}
        </div>
        <label className="penta-biz-field-label">Deadline (optional)</label>
        <input
          type="date"
          className="penta-biz-add-input"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          min={todayStr()}
        />
        <button
          type="submit"
          className="btn primary"
          disabled={saving || !title.trim() || !roleId}
          style={{ marginTop: "0.5rem" }}
        >
          {saving ? "Adding..." : "Add Task"}
        </button>
      </form>
    </div>
  );
}

// ─── Task Row ───
function TaskRow({ task, onToggle, onDelete }) {
  const overdue = !task.is_done && isOverdue(task.due_date);

  return (
    <div className={`penta-biz-task ${task.is_done ? "done" : ""} ${overdue ? "overdue" : ""}`}>
      <button className="penta-biz-task-check" onClick={() => onToggle(task.id, !task.is_done)}>
        <span className={`penta-todo-check ${task.is_done ? "checked" : ""}`} />
      </button>
      <div className="penta-biz-task-content">
        <span className="penta-biz-task-title">{task.title}</span>
        {task.due_date && (
          <span className={`penta-biz-task-due ${overdue ? "overdue" : ""}`}>
            {overdue ? "Overdue: " : "Due: "}{formatDate(task.due_date)}
          </span>
        )}
        {task.is_done && task.done_at && (
          <span className="penta-biz-task-completed-at">
            Done {formatDateTime(task.done_at)}
          </span>
        )}
      </div>
      <button className="penta-biz-task-delete" onClick={() => onDelete(task.id)}>&times;</button>
    </div>
  );
}

// ─── Role Card ───
function RoleCard({ role, tasks, allTasks, maxCompleted, onToggleTask, onDeleteTask, onAddTask, onDeleteRole }) {
  const [expanded, setExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const pending = tasks.filter((t) => !t.is_done);
  const completed = tasks.filter((t) => t.is_done);
  const total = tasks.length;
  const doneCount = completed.length;
  const hasOverdue = pending.some((t) => isOverdue(t.due_date));

  // Progress relative to max
  const progressPct = maxCompleted > 0 ? Math.round((doneCount / maxCompleted) * 100) : 0;

  return (
    <div className={`penta-biz-role card ${hasOverdue ? "has-overdue" : ""}`}>
      <div className="penta-biz-role-header" onClick={() => setExpanded(!expanded)}>
        <span className="penta-biz-role-dot" style={{ backgroundColor: role.colour }} />
        <div className="penta-biz-role-info">
          <span className="penta-biz-role-name">{role.name}</span>
          <span className="penta-biz-role-desc">{role.description}</span>
        </div>
        <div className="penta-biz-role-stats">
          <span className="penta-biz-role-count">
            {pending.length} pending
          </span>
          <div className="penta-biz-role-progress">
            <div
              className="penta-biz-role-progress-fill"
              style={{
                width: `${progressPct}%`,
                backgroundColor: hasOverdue ? "var(--red)" : role.colour,
              }}
            />
          </div>
          <span className="penta-biz-role-done-count">{doneCount} done</span>
        </div>
        <span className={`penta-biz-role-chevron ${expanded ? "open" : ""}`}>&#9662;</span>
      </div>

      {expanded && (
        <div className="penta-biz-role-body">
          {/* Pending tasks */}
          {pending.length > 0 ? (
            <div className="penta-biz-task-list">
              {pending.map((t) => (
                <TaskRow key={t.id} task={t} onToggle={onToggleTask} onDelete={onDeleteTask} />
              ))}
            </div>
          ) : (
            <div className="penta-biz-no-tasks">No pending tasks</div>
          )}

          {/* Inline add */}
          <InlineAddTask roleId={role.id} onAdd={onAddTask} />

          {/* Completed history */}
          {completed.length > 0 && (
            <div className="penta-biz-history">
              <button
                className="penta-biz-history-toggle"
                onClick={(e) => { e.stopPropagation(); setShowHistory(!showHistory); }}
              >
                {showHistory ? "Hide" : "Show"} completed ({completed.length})
              </button>
              {showHistory && (
                <div className="penta-biz-task-list penta-biz-history-list">
                  {completed.map((t) => (
                    <TaskRow key={t.id} task={t} onToggle={onToggleTask} onDelete={onDeleteTask} />
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            className="penta-biz-role-remove"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`Remove "${role.name}" role and all its tasks?`)) onDeleteRole(role.id);
            }}
          >
            Remove role
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Inline Add ───
function InlineAddTask({ roleId, onAdd }) {
  const [value, setValue] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDate, setShowDate] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const title = value.trim();
    if (!title || saving) return;
    setSaving(true);
    try {
      await onAdd({ roleId, title, dueDate: dueDate || null });
      setValue("");
      setDueDate("");
      setShowDate(false);
    } catch {
      // stay
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="penta-biz-inline-add" onSubmit={handleSubmit}>
      <div className="penta-biz-inline-row">
        <input
          type="text"
          className="penta-biz-task-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Add a task..."
          disabled={saving}
        />
        <button
          type="button"
          className="penta-biz-date-toggle"
          onClick={() => setShowDate(!showDate)}
          title="Set deadline"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="3" width="12" height="11" rx="1.5" />
            <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" />
          </svg>
        </button>
      </div>
      {showDate && (
        <input
          type="date"
          className="penta-biz-inline-date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          min={todayStr()}
        />
      )}
    </form>
  );
}

// ─── Add Role Form ───
function AddRoleForm({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [colour, setColour] = useState("#6366f1");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      await onAdd({ name: trimmed, colour, description: description.trim() || null });
      setName(""); setDescription(""); setColour("#6366f1"); setOpen(false);
    } catch {} finally { setSaving(false); }
  }

  if (!open) {
    return (
      <button className="penta-biz-add-role-btn" onClick={() => setOpen(true)}>+ Add Role</button>
    );
  }

  return (
    <form className="penta-biz-add-role card" onSubmit={handleSubmit}>
      <input type="text" className="penta-biz-add-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Role name..." autoFocus />
      <input type="text" className="penta-biz-add-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" />
      <div className="penta-biz-colour-row">
        {ROLE_COLOURS.map((c) => (
          <button key={c} type="button" className={`penta-biz-colour-dot ${colour === c ? "selected" : ""}`} style={{ backgroundColor: c }} onClick={() => setColour(c)} />
        ))}
      </div>
      <div className="penta-biz-add-actions">
        <button type="button" className="btn small" onClick={() => setOpen(false)}>Cancel</button>
        <button type="submit" className="btn small primary" disabled={saving || !name.trim()}>{saving ? "Adding..." : "Add Role"}</button>
      </div>
    </form>
  );
}

// ─── Setup Screen ───
function SetupScreen({ onSetup, loading: setupLoading }) {
  return (
    <div className="penta-biz-setup card">
      <div className="penta-biz-setup-title">Set up your business roles</div>
      <div className="penta-biz-setup-desc">
        We'll create 10 essential roles for running EasyNav. You can add, remove, or rename them anytime.
      </div>
      <div className="penta-biz-setup-roles">
        {DEFAULT_ROLES.map((r) => (
          <div key={r.name} className="penta-biz-setup-role">
            <span className="penta-biz-role-dot" style={{ backgroundColor: r.colour }} />
            <div>
              <span className="penta-biz-setup-role-name">{r.name}</span>
              <span className="penta-biz-setup-role-desc">{r.description}</span>
            </div>
          </div>
        ))}
      </div>
      <button className="btn primary" onClick={onSetup} disabled={setupLoading} style={{ marginTop: "1rem" }}>
        {setupLoading ? "Setting up..." : "Create All Roles"}
      </button>
    </div>
  );
}

// ─── Main Screen ───
export default function PentaBusinessScreen() {
  const {
    roles, tasks, tasksByRole, loading, error,
    addRole, removeRole, addTask, toggleTask, removeTask, refresh,
  } = useBusiness();

  const [settingUp, setSettingUp] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  async function handleSetup() {
    setSettingUp(true);
    try {
      for (const role of DEFAULT_ROLES) await addRole(role);
    } catch {} finally { setSettingUp(false); }
  }

  if (loading) {
    return (
      <div className="page penta-page penta-page-with-nav">
        <PentaLoader label="Loading business..." />
        <PentaNavBar />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page penta-page penta-page-with-nav">
        <PentaHeader title="Business" />
        <div className="card penta-error">
          <div className="penta-error-title">Something went wrong</div>
          <div className="penta-error-message">{error}</div>
          <button className="btn small" onClick={refresh}>Retry</button>
        </div>
        <PentaNavBar />
      </div>
    );
  }

  // Stats
  const allPending = tasks.filter((t) => !t.is_done);
  const allDone = tasks.filter((t) => t.is_done);
  const allOverdue = allPending.filter((t) => isOverdue(t.due_date));

  // Max completed across roles (for relative progress bars)
  const maxCompleted = Math.max(1, ...roles.map((r) => (tasksByRole[r.id] || []).filter((t) => t.is_done).length));

  return (
    <div className="page penta-page penta-page-with-nav">
      <div className="penta-biz-top-bar">
        <PentaHeader title="Business" subtitle="EasyNav roles & tasks" />
        {roles.length > 0 && (
          <button className="penta-biz-add-top-btn" onClick={() => setShowAddModal(true)} aria-label="Add task">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M11 4v14M4 11h14" />
            </svg>
          </button>
        )}
      </div>

      {roles.length === 0 ? (
        <SetupScreen onSetup={handleSetup} loading={settingUp} />
      ) : (
        <>
          {/* Urgent/overdue banner */}
          <UrgentBanner tasks={tasks} roles={roles} />

          {/* Overview stats */}
          <div className="penta-biz-overview">
            <div className="penta-biz-stat">
              <span className="penta-biz-stat-value">{allPending.length}</span>
              <span className="penta-biz-stat-label">Pending</span>
            </div>
            <div className="penta-biz-stat">
              <span className="penta-biz-stat-value">{allOverdue.length}</span>
              <span className="penta-biz-stat-label penta-biz-stat-danger">Overdue</span>
            </div>
            <div className="penta-biz-stat">
              <span className="penta-biz-stat-value">{allDone.length}</span>
              <span className="penta-biz-stat-label">Done</span>
            </div>
          </div>

          {/* Role cards */}
          <div className="penta-biz-roles">
            {roles.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                tasks={tasksByRole[role.id] || []}
                allTasks={tasks}
                maxCompleted={maxCompleted}
                onToggleTask={toggleTask}
                onDeleteTask={removeTask}
                onAddTask={addTask}
                onDeleteRole={removeRole}
              />
            ))}
          </div>

          <AddRoleForm onAdd={addRole} />
        </>
      )}

      {/* Global add task modal */}
      {showAddModal && (
        <AddTaskModal
          roles={roles}
          onAdd={addTask}
          onClose={() => setShowAddModal(false)}
        />
      )}

      <PentaNavBar />
    </div>
  );
}
