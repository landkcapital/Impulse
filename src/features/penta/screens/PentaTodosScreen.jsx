import { useState } from "react";
import usePentaTasks from "../hooks/usePentaTasks";
import useSubPillars from "../hooks/useSubPillars";
import usePentaDashboard from "../hooks/usePentaDashboard";
import PentaHeader from "../components/PentaHeader";
import PentaNavBar from "../components/PentaNavBar";
import PentaLoader from "../components/PentaLoader";

function TodoRow({ task, pillarMap, allSubPillars, onToggle, onDelete }) {
  const pillar = task.default_pillar_key
    ? pillarMap[task.default_pillar_key]
    : null;
  const subPillar = task.work_tag
    ? allSubPillars.find((sp) => sp.key === task.work_tag)
    : null;

  return (
    <div className={`penta-todo-row ${task.is_done ? "done" : ""}`}>
      <button
        className="penta-todo-checkbox"
        onClick={() => onToggle(task.id, !task.is_done)}
        aria-label={task.is_done ? "Mark incomplete" : "Mark complete"}
      >
        <span className={`penta-todo-check ${task.is_done ? "checked" : ""}`} />
      </button>
      <div className="penta-todo-content">
        <span className="penta-todo-title">{task.title}</span>
        <div className="penta-todo-tags">
          {pillar && (
            <span
              className="penta-todo-pillar-tag"
              style={{
                backgroundColor: pillar.colour + "14",
                color: pillar.colour,
                borderColor: pillar.colour + "30",
              }}
            >
              {pillar.name}
            </span>
          )}
          {subPillar && (
            <span
              className="penta-todo-sub-tag"
              style={{
                backgroundColor: (subPillar.colour || "#999") + "18",
                color: subPillar.colour || "#999",
              }}
            >
              {subPillar.label}
            </span>
          )}
          {task.is_non_negotiable && (
            <span className="penta-todo-nn-badge">Daily</span>
          )}
        </div>
      </div>
      {!task.is_non_negotiable && (
        <button
          className="penta-todo-delete"
          onClick={() => onDelete(task.id)}
          aria-label="Delete"
        >
          &times;
        </button>
      )}
    </div>
  );
}

function AddTodoForm({ pillars, subPillarsByPillar, onAdd }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [pillarKey, setPillarKey] = useState("");
  const [subPillarKey, setSubPillarKey] = useState("");
  const [saving, setSaving] = useState(false);

  const activeSubs = pillarKey
    ? (subPillarsByPillar[pillarKey] || []).filter((sp) => sp.is_active)
    : [];

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || saving) return;

    setSaving(true);
    try {
      await onAdd({
        title: trimmed,
        isNonNegotiable: false,
        pillarKey: pillarKey || null,
        workTag: subPillarKey || null,
      });
      setTitle("");
      setPillarKey("");
      setSubPillarKey("");
      setOpen(false);
    } catch {
      // stay open on error
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button className="penta-todo-fab" onClick={() => setOpen(true)} aria-label="Add todo">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    );
  }

  return (
    <div className="penta-todo-add-overlay" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <form className="penta-todo-add-form card" onSubmit={handleSubmit}>
        <div className="penta-todo-add-header">
          <span className="penta-todo-add-title">New To Do</span>
          <button type="button" className="penta-todo-add-close" onClick={() => setOpen(false)}>&times;</button>
        </div>

        <input
          type="text"
          className="penta-todo-add-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What do you need to do?"
          autoFocus
          disabled={saving}
        />

        <label className="penta-todo-add-label">Pillar</label>
        <div className="penta-todo-pillar-grid">
          <button
            type="button"
            className={`penta-todo-pillar-btn ${pillarKey === "" ? "selected" : ""}`}
            onClick={() => { setPillarKey(""); setSubPillarKey(""); }}
          >
            None
          </button>
          {pillars.map((p) => (
            <button
              key={p.key}
              type="button"
              className={`penta-todo-pillar-btn ${pillarKey === p.key ? "selected" : ""}`}
              onClick={() => { setPillarKey(p.key); setSubPillarKey(""); }}
            >
              <span className="penta-todo-pillar-dot" style={{ backgroundColor: p.colour }} />
              {p.name}
            </button>
          ))}
        </div>

        {activeSubs.length > 0 && (
          <>
            <label className="penta-todo-add-label">Category</label>
            <div className="penta-todo-sub-grid">
              <button
                type="button"
                className={`penta-todo-sub-btn ${subPillarKey === "" ? "selected" : ""}`}
                onClick={() => setSubPillarKey("")}
              >
                None
              </button>
              {activeSubs.map((sp) => (
                <button
                  key={sp.key}
                  type="button"
                  className={`penta-todo-sub-btn ${subPillarKey === sp.key ? "selected" : ""}`}
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
          </>
        )}

        <button
          type="submit"
          className="btn primary"
          disabled={saving || !title.trim()}
          style={{ marginTop: "0.75rem" }}
        >
          {saving ? "Adding..." : "Add To Do"}
        </button>
      </form>
    </div>
  );
}

export default function PentaTodosScreen() {
  const { pillars, loading: dashLoading } = usePentaDashboard();
  const { subPillars, byPillar: subPillarsByPillar } = useSubPillars();
  const {
    tasks,
    loading,
    createTask,
    toggleTaskComplete,
    deleteTask,
  } = usePentaTasks();

  if (loading || dashLoading) {
    return (
      <div className="page penta-page penta-page-with-nav">
        <PentaLoader label="Loading todos..." />
        <PentaNavBar />
      </div>
    );
  }

  const activePillars = pillars.filter((p) => p.is_active);
  const pillarByKey = {};
  for (const p of pillars) pillarByKey[p.key] = p;

  const pending = tasks.filter((t) => !t.is_done);
  const completed = tasks.filter((t) => t.is_done);

  return (
    <div className="page penta-page penta-page-with-nav">
      <PentaHeader title="To Do" subtitle="Today's tasks" />

      {tasks.length === 0 ? (
        <div className="card penta-todo-empty">
          <div className="penta-todo-empty-text">
            No tasks yet. Tap + to add your first to do.
          </div>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="penta-todo-list">
              {pending.map((task) => (
                <TodoRow
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

          {completed.length > 0 && (
            <>
              <div className="penta-todo-section-label">
                Completed ({completed.length})
              </div>
              <div className="penta-todo-list">
                {completed.map((task) => (
                  <TodoRow
                    key={task.id}
                    task={task}
                    pillarMap={pillarByKey}
                    allSubPillars={subPillars}
                    onToggle={toggleTaskComplete}
                    onDelete={deleteTask}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      <AddTodoForm
        pillars={activePillars}
        subPillarsByPillar={subPillarsByPillar}
        onAdd={createTask}
      />

      <PentaNavBar />
    </div>
  );
}
