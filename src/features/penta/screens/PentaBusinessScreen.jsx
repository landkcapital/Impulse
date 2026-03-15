import { useState } from "react";
import useBusiness from "../hooks/useBusiness";
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

function TaskRow({ task, onToggle, onDelete }) {
  return (
    <div className={`penta-biz-task ${task.is_done ? "done" : ""}`}>
      <button
        className="penta-biz-task-check"
        onClick={() => onToggle(task.id, !task.is_done)}
      >
        <span className={`penta-todo-check ${task.is_done ? "checked" : ""}`} />
      </button>
      <span className="penta-biz-task-title">{task.title}</span>
      {task.due_date && (
        <span className="penta-biz-task-due">{task.due_date}</span>
      )}
      <button
        className="penta-biz-task-delete"
        onClick={() => onDelete(task.id)}
      >
        &times;
      </button>
    </div>
  );
}

function AddTaskInline({ roleId, onAdd }) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const title = value.trim();
    if (!title || saving) return;
    setSaving(true);
    try {
      await onAdd({ roleId, title });
      setValue("");
    } catch {
      // stay
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="penta-biz-task-add" onSubmit={handleSubmit}>
      <input
        type="text"
        className="penta-biz-task-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add a task..."
        disabled={saving}
      />
    </form>
  );
}

function RoleCard({ role, tasks, onToggleTask, onDeleteTask, onAddTask, onDeleteRole }) {
  const [expanded, setExpanded] = useState(true);
  const pending = tasks.filter((t) => !t.is_done);
  const completed = tasks.filter((t) => t.is_done);

  return (
    <div className="penta-biz-role card">
      <div className="penta-biz-role-header" onClick={() => setExpanded(!expanded)}>
        <span className="penta-biz-role-dot" style={{ backgroundColor: role.colour }} />
        <div className="penta-biz-role-info">
          <span className="penta-biz-role-name">{role.name}</span>
          {role.description && (
            <span className="penta-biz-role-desc">{role.description}</span>
          )}
        </div>
        <div className="penta-biz-role-meta">
          <span className="penta-biz-role-count">
            {pending.length} task{pending.length !== 1 ? "s" : ""}
          </span>
          <span className={`penta-biz-role-chevron ${expanded ? "open" : ""}`}>
            &#9662;
          </span>
        </div>
      </div>

      {expanded && (
        <div className="penta-biz-role-body">
          {pending.length > 0 && (
            <div className="penta-biz-task-list">
              {pending.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  onToggle={onToggleTask}
                  onDelete={onDeleteTask}
                />
              ))}
            </div>
          )}

          <AddTaskInline roleId={role.id} onAdd={onAddTask} />

          {completed.length > 0 && (
            <details className="penta-biz-completed">
              <summary className="penta-biz-completed-summary">
                {completed.length} completed
              </summary>
              <div className="penta-biz-task-list">
                {completed.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    onToggle={onToggleTask}
                    onDelete={onDeleteTask}
                  />
                ))}
              </div>
            </details>
          )}

          <button
            className="penta-biz-role-remove"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`Remove "${role.name}" role and all its tasks?`)) {
                onDeleteRole(role.id);
              }
            }}
          >
            Remove role
          </button>
        </div>
      )}
    </div>
  );
}

function AddRoleForm({ onAdd, existingNames }) {
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
      setName("");
      setDescription("");
      setColour("#6366f1");
      setOpen(false);
    } catch {
      // stay open
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button className="penta-biz-add-role-btn" onClick={() => setOpen(true)}>
        + Add Role
      </button>
    );
  }

  return (
    <form className="penta-biz-add-role card" onSubmit={handleSubmit}>
      <input
        type="text"
        className="penta-biz-add-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Role name..."
        autoFocus
      />
      <input
        type="text"
        className="penta-biz-add-input"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
      />
      <div className="penta-biz-colour-row">
        {ROLE_COLOURS.map((c) => (
          <button
            key={c}
            type="button"
            className={`penta-biz-colour-dot ${colour === c ? "selected" : ""}`}
            style={{ backgroundColor: c }}
            onClick={() => setColour(c)}
          />
        ))}
      </div>
      <div className="penta-biz-add-actions">
        <button type="button" className="btn small" onClick={() => setOpen(false)}>
          Cancel
        </button>
        <button type="submit" className="btn small primary" disabled={saving || !name.trim()}>
          {saving ? "Adding..." : "Add Role"}
        </button>
      </div>
    </form>
  );
}

function SetupScreen({ onSetup, loading: setupLoading }) {
  return (
    <div className="penta-biz-setup card">
      <div className="penta-biz-setup-title">Set up your business roles</div>
      <div className="penta-biz-setup-desc">
        We'll create 10 essential roles for running EasyNav. You can add, remove,
        or rename them anytime.
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
      <button
        className="btn primary"
        onClick={onSetup}
        disabled={setupLoading}
        style={{ marginTop: "1rem" }}
      >
        {setupLoading ? "Setting up..." : "Create All Roles"}
      </button>
    </div>
  );
}

export default function PentaBusinessScreen() {
  const {
    roles,
    tasksByRole,
    loading,
    error,
    addRole,
    removeRole,
    addTask,
    toggleTask,
    removeTask,
    refresh,
  } = useBusiness();

  const [settingUp, setSettingUp] = useState(false);

  async function handleSetup() {
    setSettingUp(true);
    try {
      for (const role of DEFAULT_ROLES) {
        await addRole(role);
      }
    } catch {
      // partial is fine
    } finally {
      setSettingUp(false);
    }
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

  // Summary stats
  const totalPending = Object.values(tasksByRole).flat().filter((t) => !t.is_done).length;
  const totalDone = Object.values(tasksByRole).flat().filter((t) => t.is_done).length;

  return (
    <div className="page penta-page penta-page-with-nav">
      <PentaHeader title="Business" subtitle="EasyNav roles & tasks" />

      {roles.length === 0 ? (
        <SetupScreen onSetup={handleSetup} loading={settingUp} />
      ) : (
        <>
          {/* Overview */}
          <div className="penta-biz-overview">
            <div className="penta-biz-stat">
              <span className="penta-biz-stat-value">{roles.length}</span>
              <span className="penta-biz-stat-label">Roles</span>
            </div>
            <div className="penta-biz-stat">
              <span className="penta-biz-stat-value">{totalPending}</span>
              <span className="penta-biz-stat-label">Pending</span>
            </div>
            <div className="penta-biz-stat">
              <span className="penta-biz-stat-value">{totalDone}</span>
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
                onToggleTask={toggleTask}
                onDeleteTask={removeTask}
                onAddTask={addTask}
                onDeleteRole={removeRole}
              />
            ))}
          </div>

          <AddRoleForm onAdd={addRole} existingNames={roles.map((r) => r.name)} />
        </>
      )}

      <PentaNavBar />
    </div>
  );
}
