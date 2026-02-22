import { useState, useEffect, useCallback } from "react";
import {
  fetchGoals,
  createGoal,
  updateGoal,
  deleteGoal,
} from "../lib/impulses";
import Loading from "../components/Loading";

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [title, setTitle] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const loadGoals = useCallback(async () => {
    try {
      const data = await fetchGoals();
      setGoals(data);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load goals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  function resetForm() {
    setTitle("");
    setImageFile(null);
    setImagePreview(null);
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(goal) {
    setTitle(goal.title);
    setImagePreview(goal.image_url || null);
    setImageFile(null);
    setEditingId(goal.id);
    setShowForm(true);
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);

    try {
      if (editingId) {
        await updateGoal(editingId, { title: title.trim(), imageFile });
      } else {
        await createGoal({ title: title.trim(), imageFile });
      }
      resetForm();
      await loadGoals();
    } catch (err) {
      setError(err.message || "Failed to save goal");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setSaving(true);
    setError(null);
    try {
      await deleteGoal(id);
      setConfirmDelete(null);
      await loadGoals();
    } catch (err) {
      setError(err.message || "Failed to delete goal");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <div className="page goals-page">
      <h2 className="page-title">Goals</h2>

      {error && (
        <p className="form-error" style={{ margin: "0.75rem 0" }}>
          {error}
        </p>
      )}

      {showForm ? (
        <div className="card goal-form">
          <h3>{editingId ? "Edit Goal" : "New Goal"}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Save for a trip, Get fit, Quit smoking"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Photo</label>
              <div className="goal-image-upload">
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Goal preview"
                    className="goal-image-preview"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
            </div>

            <div className="goal-form-actions">
              <button
                type="submit"
                className="btn primary"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Goal"
                    : "Create Goal"}
              </button>
              <button
                type="button"
                className="btn secondary"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          className="btn primary"
          onClick={() => setShowForm(true)}
          style={{ marginBottom: "1rem", width: "100%" }}
        >
          + Add Goal
        </button>
      )}

      {goals.length === 0 && !showForm ? (
        <div className="empty-state card">
          <p>No goals yet. Add a goal to start tracking your impulses!</p>
        </div>
      ) : (
        <div className="goal-list">
          {goals.map((goal) => (
            <div key={goal.id} className="card goal-card">
              <div className="goal-card-top">
                {goal.image_url ? (
                  <img
                    src={goal.image_url}
                    alt={goal.title}
                    className="goal-card-image"
                  />
                ) : (
                  <div className="goal-card-placeholder">&#9733;</div>
                )}
                <div className="goal-card-info">
                  <h3 className="goal-card-name">{goal.title}</h3>
                  <div className="goal-card-date">
                    Added {new Date(goal.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="goal-card-actions">
                <button
                  className="btn small secondary"
                  onClick={() => startEdit(goal)}
                >
                  Edit
                </button>
                {confirmDelete === goal.id ? (
                  <div className="goal-delete-confirm">
                    <button
                      className="btn small danger"
                      onClick={() => handleDelete(goal.id)}
                      disabled={saving}
                    >
                      Confirm
                    </button>
                    <button
                      className="btn small secondary"
                      onClick={() => setConfirmDelete(null)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn small danger"
                    onClick={() => setConfirmDelete(goal.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
