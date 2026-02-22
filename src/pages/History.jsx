import { useState, useEffect, useCallback } from "react";
import {
  fetchImpulses,
  deleteImpulse,
  updateImpulse,
  computeScores,
} from "../lib/impulses";
import Loading from "../components/Loading";

function getWeekRange(refDate) {
  const d = new Date(refDate);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function formatWeekRange(start, end) {
  const opts = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
}

function getDaysInRange(start, end) {
  const days = [];
  const d = new Date(start);
  while (d <= end) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function isGood(impulse) {
  const positive = impulse.impulse_type === "positive";
  return (positive && impulse.acted_on) || (!positive && !impulse.acted_on);
}

export default function History() {
  const [refDate, setRefDate] = useState(new Date());
  const [impulses, setImpulses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editDesc, setEditDesc] = useState("");
  const [editType, setEditType] = useState("");
  const [editActed, setEditActed] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { start, end } = getWeekRange(refDate);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { start: s, end: e } = getWeekRange(refDate);
      const data = await fetchImpulses({
        from: s.toISOString(),
        to: e.toISOString(),
      });
      setImpulses(data);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [refDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handlePrev() {
    const d = new Date(refDate);
    d.setDate(d.getDate() - 7);
    setRefDate(d);
  }

  function handleNext() {
    const d = new Date(refDate);
    d.setDate(d.getDate() + 7);
    setRefDate(d);
  }

  function startEdit(imp) {
    setEditingId(imp.id);
    setEditDesc(imp.description);
    setEditType(imp.impulse_type);
    setEditActed(imp.acted_on);
    setEditNotes(imp.notes || "");
  }

  async function handleSaveEdit() {
    try {
      await updateImpulse(editingId, {
        description: editDesc.trim(),
        impulseType: editType,
        actedOn: editActed,
        notes: editNotes.trim(),
      });
      setEditingId(null);
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to update");
    }
  }

  async function handleDelete(id) {
    try {
      await deleteImpulse(id);
      setConfirmDelete(null);
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to delete");
    }
  }

  // Build daily graph data
  const days = getDaysInRange(start, end);
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const dailyData = days.map((day) => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    const dayImpulses = impulses.filter((imp) => {
      const t = new Date(imp.created_at).getTime();
      return t >= dayStart.getTime() && t <= dayEnd.getTime();
    });

    const { good, bad } = computeScores(dayImpulses);
    return { good, bad, total: good + bad };
  });

  const maxCount = Math.max(1, ...dailyData.map((d) => Math.max(d.good, d.bad)));

  const weekScores = computeScores(impulses);

  return (
    <div className="page history-page">
      <h2 className="page-title">History</h2>

      <div className="history-nav">
        <button className="btn small" onClick={handlePrev}>
          &larr;
        </button>
        <span className="history-range-label">
          {formatWeekRange(start, end)}
        </span>
        <button className="btn small" onClick={handleNext}>
          &rarr;
        </button>
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <div
          className="card"
          style={{ padding: "1.5rem", textAlign: "center" }}
        >
          <p className="form-error">{error}</p>
          <button
            className="btn primary"
            onClick={loadData}
            style={{ marginTop: "1rem" }}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Week summary */}
          <div className="score-display">
            <div className="score-item">
              <span className="score-arrow green">&#9650;</span>
              <span className="score-count green">{weekScores.good}</span>
            </div>
            <div className="score-item">
              <span className="score-arrow red">&#9660;</span>
              <span className="score-count red">{weekScores.bad}</span>
            </div>
          </div>

          {/* Graph */}
          <div className="card impulse-graph">
            <div className="graph-bars">
              {dailyData.map((d, i) => (
                <div key={i} className="graph-bar-col">
                  <div className="graph-bar-stack">
                    {d.good > 0 && (
                      <div
                        className="graph-bar green"
                        style={{
                          height: `${(d.good / maxCount) * 100}%`,
                        }}
                      />
                    )}
                    {d.bad > 0 && (
                      <div
                        className="graph-bar red"
                        style={{
                          height: `${(d.bad / maxCount) * 100}%`,
                        }}
                      />
                    )}
                  </div>
                  <span className="graph-day-label">{dayLabels[i]}</span>
                </div>
              ))}
            </div>
            <div className="graph-legend">
              <div className="graph-legend-item">
                <div className="legend-dot green" />
                <span>Good</span>
              </div>
              <div className="graph-legend-item">
                <div className="legend-dot red" />
                <span>Bad</span>
              </div>
            </div>
          </div>

          {/* Impulse list */}
          <h3 className="section-title">All Impulses</h3>
          {impulses.length === 0 ? (
            <div className="empty-state card">
              <p>No impulses logged this week.</p>
            </div>
          ) : (
            <div className="impulse-list">
              {impulses.map((imp) => {
                const good = isGood(imp);
                const goalTitle = imp.impulse_goals?.title || "Unknown";

                if (editingId === imp.id) {
                  return (
                    <div key={imp.id} className="card" style={{ padding: "1rem" }}>
                      <div className="edit-impulse-form">
                        <div className="form-group" style={{ marginBottom: "0.5rem" }}>
                          <label>Description</label>
                          <textarea
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            rows={2}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: "0.5rem" }}>
                          <label>Type</label>
                          <select
                            value={editType}
                            onChange={(e) => setEditType(e.target.value)}
                          >
                            <option value="positive">Positive</option>
                            <option value="negative">Negative</option>
                          </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: "0.5rem" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", textTransform: "none", letterSpacing: "normal" }}>
                            <input
                              type="checkbox"
                              checked={editActed}
                              onChange={(e) => setEditActed(e.target.checked)}
                              style={{ width: "auto" }}
                            />
                            Acted on it
                          </label>
                        </div>
                        <div className="form-group" style={{ marginBottom: "0.5rem" }}>
                          <label>Reflection Note</label>
                          <textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            rows={3}
                            placeholder="Add a reflection..."
                          />
                        </div>
                        <div className="form-actions">
                          <button className="btn primary" onClick={handleSaveEdit}>
                            Save
                          </button>
                          <button
                            className="btn secondary"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={imp.id} className="card impulse-item">
                    <div
                      className={`impulse-type-indicator ${good ? "good" : "bad"}`}
                    />
                    <div className="impulse-item-content">
                      <div className="impulse-item-desc">{imp.description}</div>
                      {imp.notes && (
                        <div className="impulse-item-notes">{imp.notes}</div>
                      )}
                      <div className="impulse-item-meta">
                        <span>{goalTitle}</span>
                        <span>&middot;</span>
                        <span>
                          {imp.impulse_type === "positive"
                            ? "Positive"
                            : "Negative"}
                        </span>
                        <span
                          className={`impulse-item-tag ${
                            imp.acted_on ? "acted" : "resisted"
                          }`}
                        >
                          {imp.acted_on ? "Acted" : "Resisted"}
                        </span>
                        <span>&middot;</span>
                        <span>
                          {new Date(imp.created_at).toLocaleString(undefined, {
                            weekday: "short",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="impulse-item-actions">
                      <button
                        className="btn small secondary"
                        onClick={() => startEdit(imp)}
                      >
                        Edit
                      </button>
                      {confirmDelete === imp.id ? (
                        <div className="goal-delete-confirm">
                          <button
                            className="btn small danger"
                            onClick={() => handleDelete(imp.id)}
                          >
                            Yes
                          </button>
                          <button
                            className="btn small"
                            onClick={() => setConfirmDelete(null)}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn small danger"
                          onClick={() => setConfirmDelete(imp.id)}
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
