import { useState, useEffect, useCallback } from "react";
import {
  fetchGoals,
  fetchTodayImpulses,
  logImpulse,
  updateImpulse,
  deleteImpulse,
  computeScores,
} from "../lib/impulses";
import Loading from "../components/Loading";

function LogImpulseModal({ goals, onClose, onLogged }) {
  const [step, setStep] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [description, setDescription] = useState("");
  const [impulseType, setImpulseType] = useState(null);
  const [actedOn, setActedOn] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const steps = ["goal", "describe", "type", "acted", "notes"];

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    try {
      await logImpulse({
        goalId: selectedGoal,
        description: description.trim(),
        impulseType,
        actedOn,
        notes: notes.trim(),
      });
      onLogged();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to log impulse");
      setSaving(false);
    }
  }

  function canAdvance() {
    if (step === 0) return selectedGoal != null;
    if (step === 1) return description.trim().length > 0;
    if (step === 2) return impulseType != null;
    return true;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Log Impulse</h2>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="step-dots">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`step-dot ${i === step ? "active" : ""} ${
                i < step ? "completed" : ""
              }`}
            />
          ))}
        </div>

        {error && <p className="form-error">{error}</p>}

        {step === 0 && (
          <div className="modal-step">
            <p className="step-title">Which goal was this impulse about?</p>
            <div className="goal-select-list">
              {goals.map((g) => (
                <div
                  key={g.id}
                  className={`goal-select-item ${
                    selectedGoal === g.id ? "selected" : ""
                  }`}
                  onClick={() => setSelectedGoal(g.id)}
                >
                  {g.image_url ? (
                    <img
                      src={g.image_url}
                      alt={g.title}
                      className="goal-select-image"
                    />
                  ) : (
                    <div className="goal-select-placeholder">&#9733;</div>
                  )}
                  <span className="goal-select-title">{g.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="modal-step">
            <p className="step-title">Describe your impulse</p>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What were you tempted to do?"
                autoFocus
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="modal-step">
            <p className="step-title">Was this impulse positive or negative?</p>
            <div className="type-btn-group">
              <button
                className={`type-btn positive ${
                  impulseType === "positive" ? "selected" : ""
                }`}
                onClick={() => setImpulseType("positive")}
              >
                <span className="type-btn-icon">&#9650;</span>
                <span className="type-btn-label">Positive</span>
                <span className="type-btn-desc">
                  Would help your goal
                </span>
              </button>
              <button
                className={`type-btn negative ${
                  impulseType === "negative" ? "selected" : ""
                }`}
                onClick={() => setImpulseType("negative")}
              >
                <span className="type-btn-icon">&#9660;</span>
                <span className="type-btn-label">Negative</span>
                <span className="type-btn-desc">
                  Would hurt your goal
                </span>
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="modal-step">
            <p className="step-title">Did you act on this impulse?</p>
            <div className="acted-toggle">
              <div className="toggle-switch-wrapper">
                <span className={`toggle-label ${!actedOn ? "active" : ""}`}>
                  No
                </span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={actedOn}
                    onChange={(e) => setActedOn(e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
                <span className={`toggle-label ${actedOn ? "active" : ""}`}>
                  Yes
                </span>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="modal-step">
            <p className="step-title">Add a reflection note (optional)</p>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How did you feel? What triggered this? What would you do differently?"
                autoFocus
                rows={4}
              />
            </div>
          </div>
        )}

        <div className="step-nav">
          {step > 0 && (
            <button
              className="btn secondary"
              onClick={() => setStep(step - 1)}
            >
              Back
            </button>
          )}
          {step < 4 ? (
            <button
              className="btn primary"
              disabled={!canAdvance()}
              onClick={() => setStep(step + 1)}
            >
              Next
            </button>
          ) : (
            <button
              className="btn primary"
              disabled={saving}
              onClick={handleSubmit}
            >
              {saving ? "Saving..." : "Log Impulse"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function isGood(impulse) {
  const positive = impulse.impulse_type === "positive";
  return (positive && impulse.acted_on) || (!positive && !impulse.acted_on);
}

export default function Home() {
  const [goals, setGoals] = useState([]);
  const [impulses, setImpulses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editDesc, setEditDesc] = useState("");
  const [editType, setEditType] = useState("");
  const [editActed, setEditActed] = useState(false);
  const [editNotes, setEditNotes] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [goalsData, impulsesData] = await Promise.all([
        fetchGoals(),
        fetchTodayImpulses(),
      ]);
      setGoals(goalsData);
      setImpulses(impulsesData);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="page home-page">
        <div className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
          <p className="form-error">{error}</p>
          <button
            className="btn primary"
            onClick={loadData}
            style={{ marginTop: "1rem" }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const hasGoals = goals.length > 0;
  const { good, bad } = computeScores(impulses);

  return (
    <div className="page home-page">
      <button
        className={`impulse-btn${!hasGoals ? " disabled" : ""}`}
        onClick={() => hasGoals && setShowModal(true)}
        disabled={!hasGoals}
      >
        <span className="impulse-btn-icon-ring">
          <span className="impulse-btn-icon">+</span>
        </span>
        <span className="impulse-btn-text">Log Impulse</span>
      </button>

      <div className="score-display">
        <div className="score-item">
          <span className="score-arrow green">&#9650;</span>
          <span className="score-count green">{good}</span>
        </div>
        <div className="score-item">
          <span className="score-arrow red">&#9660;</span>
          <span className="score-count red">{bad}</span>
        </div>
      </div>

      {!hasGoals && (
        <div className="empty-state card">
          <p>No goals yet. Head to the Goals tab to create one, then start tracking your impulses.</p>
        </div>
      )}

      {impulses.length > 0 && (
        <div className="today-impulses">
          <h3 className="section-title">
            <span>Today</span>
            <span className="today-count">{impulses.length} impulse{impulses.length !== 1 ? "s" : ""}</span>
          </h3>
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
                  <div className={`impulse-type-indicator ${good ? "good" : "bad"}`} />
                  <div className="impulse-item-content">
                    <div className="impulse-item-desc">{imp.description}</div>
                    {imp.notes && (
                      <div className="impulse-item-notes">{imp.notes}</div>
                    )}
                    <div className="impulse-item-meta">
                      <span>{goalTitle}</span>
                      <span>&middot;</span>
                      <span>{imp.impulse_type === "positive" ? "Positive" : "Negative"}</span>
                      <span className={`impulse-item-tag ${imp.acted_on ? "acted" : "resisted"}`}>
                        {imp.acted_on ? "Acted" : "Resisted"}
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
        </div>
      )}

      {showModal && (
        <LogImpulseModal
          goals={goals}
          onClose={() => setShowModal(false)}
          onLogged={loadData}
        />
      )}
    </div>
  );
}
