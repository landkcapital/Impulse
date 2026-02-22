import { useState, useEffect, useCallback, useMemo } from "react";
import {
  fetchGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  fetchGoalImpulseCounts,
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
  const [lightboxGoal, setLightboxGoal] = useState(null);
  const [sortBy, setSortBy] = useState("sort_order");
  const [impulseCounts, setImpulseCounts] = useState({});

  const loadGoals = useCallback(async () => {
    try {
      const [data, counts] = await Promise.all([
        fetchGoals(),
        fetchGoalImpulseCounts(),
      ]);
      setGoals(data);
      setImpulseCounts(counts);
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

  const sortedGoals = useMemo(() => {
    const list = [...goals];
    switch (sortBy) {
      case "alpha":
        list.sort((a, b) =>
          a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
        );
        break;
      case "recent":
        list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case "most_impulses":
        list.sort(
          (a, b) => (impulseCounts[b.id] || 0) - (impulseCounts[a.id] || 0)
        );
        break;
      default:
        break;
    }
    return list;
  }, [goals, sortBy, impulseCounts]);

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

      {goals.length > 0 && !showForm && (
        <div className="sort-bar">
          <label className="sort-label" htmlFor="goal-sort">Sort by</label>
          <select
            id="goal-sort"
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="sort_order">Default</option>
            <option value="alpha">Alphabetical</option>
            <option value="recent">Recently Added</option>
            <option value="most_impulses">Most Impulses</option>
          </select>
        </div>
      )}

      {goals.length === 0 && !showForm ? (
        <div className="empty-state card">
          <p>No goals yet. Add a goal to start tracking your impulses!</p>
        </div>
      ) : (
        <div className="goal-list">
          {sortedGoals.map((goal) => (
            <div key={goal.id} className="card goal-card">
              <div className="goal-card-top">
                {goal.image_url ? (
                  <img
                    src={goal.image_url}
                    alt={goal.title}
                    className="goal-card-image clickable"
                    onClick={() => setLightboxGoal(goal)}
                  />
                ) : (
                  <div className="goal-card-placeholder">&#9733;</div>
                )}
                <div className="goal-card-info">
                  <h3 className="goal-card-name">
                    {goal.title}
                    {sortBy === "most_impulses" && (
                      <span className="goal-impulse-count">
                        {impulseCounts[goal.id] || 0} impulse{(impulseCounts[goal.id] || 0) !== 1 ? "s" : ""}
                      </span>
                    )}
                  </h3>
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

      {lightboxGoal && (
        <div className="lightbox-overlay" onClick={() => setLightboxGoal(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxGoal.image_url}
              alt={lightboxGoal.title}
              className="lightbox-image"
            />
            <h3 className="lightbox-title">{lightboxGoal.title}</h3>
            <button
              className="lightbox-close"
              onClick={() => setLightboxGoal(null)}
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
