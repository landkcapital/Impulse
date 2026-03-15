import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import usePentaDashboard from "../hooks/usePentaDashboard";
import usePentaReview from "../hooks/usePentaReview";
import usePentaTasks from "../hooks/usePentaTasks";
import { formatDuration, formatTime } from "../lib/time";
import {
  WORK_TAGS,
  WORK_TAG_COLOURS,
} from "../lib/founderInsight";
import useSubPillars from "../hooks/useSubPillars";
import { getPhotosForBlocks } from "../api/pentaBlockPhotosApi";
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

function formatTimeRange(increment) {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now.getTime() - increment * 60000);
  // Round to nearest increment
  const roundedEnd = new Date(Math.round(end.getTime() / (increment * 60000)) * increment * 60000);
  const roundedStart = new Date(roundedEnd.getTime() - increment * 60000);
  const fmt = (d) =>
    d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${fmt(roundedStart)} – ${fmt(roundedEnd)}`;
}

// ─── Pillar Bar Squares ───
function PillarBarSquare({ pillar, points, maxPoints }) {
  const fillPct = maxPoints > 0 ? Math.min((points / maxPoints) * 100, 100) : 0;

  return (
    <div className="penta-home-pillar-square">
      <div className="penta-home-pillar-bar-bg">
        <div
          className="penta-home-pillar-bar-fill"
          style={{
            height: `${fillPct}%`,
            backgroundColor: pillar.colour,
          }}
        />
      </div>
      <div className="penta-home-pillar-label">{pillar.name}</div>
    </div>
  );
}

// ─── Timeline (from History) ───
function BlockEntry({ block, pillarMap, photos }) {
  const [lightbox, setLightbox] = useState(null);

  const allocations = (block.block_pillar_points || []).map((bp) => ({
    pillar: pillarMap[bp.pillar_id],
    points: bp.points,
  }));

  const blockPhotos = photos.filter((p) => p.block_id === block.id);

  return (
    <div className="penta-rv-entry">
      <div className="penta-rv-entry-summary">{block.summary}</div>
      <div className="penta-rv-block-meta">
        <div className="penta-rv-block-pills">
          {allocations.map((a, i) =>
            a.pillar ? (
              <span
                key={i}
                className="penta-rv-pill"
                style={{
                  backgroundColor: a.pillar.colour + "14",
                  color: a.pillar.colour,
                  borderColor: a.pillar.colour + "30",
                }}
              >
                {a.pillar.name}
              </span>
            ) : null
          )}
        </div>
      </div>
      {blockPhotos.length > 0 && (
        <div className="penta-rv-photos">
          {blockPhotos.map((photo) => (
            <img
              key={photo.id}
              src={photo.url}
              alt=""
              className="penta-rv-photo-thumb"
              onClick={() => setLightbox(photo.url)}
            />
          ))}
        </div>
      )}
      {lightbox && (
        <div className="penta-lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" className="penta-lightbox-img" />
        </div>
      )}
    </div>
  );
}

function TimelineSlot({ timeLabel, duration, blocks, pillarMap, photos }) {
  return (
    <div className="penta-rv-block card">
      <div className="penta-rv-block-header">
        <div className="penta-rv-block-time">{timeLabel}</div>
        <span className="penta-rv-block-dur">{formatDuration(duration)}</span>
      </div>
      {blocks.map((block) => (
        <BlockEntry
          key={block.id}
          block={block}
          pillarMap={pillarMap}
          photos={photos}
        />
      ))}
    </div>
  );
}

// ─── Task Components ───
function SubPillarBadge({ subPillarKey, allSubPillars }) {
  const sp = allSubPillars.find((s) => s.key === subPillarKey);
  if (!sp) {
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
      // silent
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
  const { pillars, scores, loading, error, refresh, profile } =
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

  // Review data (for timeline)
  const {
    blocks,
    pillars: reviewPillars,
    pillarTotals,
    loading: reviewLoading,
    refresh: refreshReview,
  } = usePentaReview();

  const [photos, setPhotos] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [timelineSort, setTimelineSort] = useState("recent");

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

  // Load photos for timeline blocks
  useEffect(() => {
    if (blocks.length > 0) {
      const ids = blocks.map((b) => b.id);
      getPhotosForBlocks(ids).then(setPhotos).catch(() => {});
    }
  }, [blocks]);

  // Show success toast if navigated back from log screen
  useEffect(() => {
    if (location.state?.logged) {
      setShowSuccess(true);
      refresh();
      refreshTasks();
      refreshNudge();
      refreshReview();
      window.history.replaceState({}, "");
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [location.state, refresh, refreshTasks, refreshNudge, refreshReview]);

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
  const maxPoints = Math.max(1, ...activePillars.map((p) => scores[p.id] || 0));

  // Build pillar lookup by key for task dots
  const pillarByKey = {};
  for (const p of pillars) pillarByKey[p.key] = p;

  // Build pillar lookup by id for timeline
  const pillarById = {};
  for (const p of pillars) pillarById[p.id] = p;

  // Split tasks
  const nonNegotiables = tasks.filter((t) => t.is_non_negotiable);
  const todayTasks = tasks.filter((t) => !t.is_non_negotiable);

  // Group blocks by time slot
  const timeSlots = [];
  const slotMap = new Map();
  for (const block of blocks) {
    const key = `${block.start_at}|${block.end_at}`;
    if (!slotMap.has(key)) {
      const slot = { key, startAt: block.start_at, endAt: block.end_at, blocks: [] };
      slotMap.set(key, slot);
      timeSlots.push(slot);
    }
    slotMap.get(key).blocks.push(block);
  }

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

      {/* CTA with time range */}
      <div className="penta-cta">
        <button
          className="penta-cta-btn"
          onClick={() => navigate("/log")}
        >
          Log {formatTimeRange(increment)}
        </button>
        <div className="penta-cta-sub">
          Retrospective &middot; what did you just do?
        </div>
      </div>

      {activePillars.length > 0 && (
        <>
          {/* Pillar bar squares */}
          <div className="penta-home-pillar-grid">
            {activePillars.map((pillar) => (
              <PillarBarSquare
                key={pillar.id}
                pillar={pillar}
                points={scores[pillar.id] || 0}
                maxPoints={maxPoints}
              />
            ))}
          </div>

          {/* Timeline */}
          {blocks.length > 0 && (
            <>
              <div className="penta-timeline-header">
                <div className="penta-rv-section-label">Timeline</div>
                <div className="penta-timeline-sort-toggle">
                  <button
                    className={`penta-timeline-sort-btn ${timelineSort === "recent" ? "active" : ""}`}
                    onClick={() => setTimelineSort("recent")}
                  >
                    Recent
                  </button>
                  <button
                    className={`penta-timeline-sort-btn ${timelineSort === "earliest" ? "active" : ""}`}
                    onClick={() => setTimelineSort("earliest")}
                  >
                    Earliest
                  </button>
                  <button
                    className={`penta-timeline-sort-btn ${timelineSort === "pillar" ? "active" : ""}`}
                    onClick={() => setTimelineSort("pillar")}
                  >
                    By Pillar
                  </button>
                </div>
              </div>
              <div className="penta-rv-timeline">
                {(() => {
                  if (timelineSort === "pillar") {
                    // Group all blocks by pillar
                    const pillarGroups = new Map();
                    for (const slot of timeSlots) {
                      for (const block of slot.blocks) {
                        const allocs = block.block_pillar_points || [];
                        const pillarIds = allocs.length > 0
                          ? allocs.map((a) => a.pillar_id)
                          : ["uncategorised"];
                        for (const pid of pillarIds) {
                          if (!pillarGroups.has(pid)) {
                            pillarGroups.set(pid, { pillarId: pid, blocks: [] });
                          }
                          pillarGroups.get(pid).blocks.push({ block, slot });
                        }
                      }
                    }
                    return Array.from(pillarGroups.values()).map((group) => {
                      const pillar = pillarById[group.pillarId];
                      const label = pillar ? pillar.name : "Other";
                      const colour = pillar ? pillar.colour : "#999";
                      return (
                        <div key={group.pillarId} className="penta-timeline-pillar-group">
                          <div
                            className="penta-timeline-pillar-label"
                            style={{ color: colour }}
                          >
                            <span
                              className="penta-timeline-pillar-dot"
                              style={{ backgroundColor: colour }}
                            />
                            {label}
                          </div>
                          {group.blocks.map(({ block, slot }) => {
                            const s = new Date(slot.startAt);
                            const e = new Date(slot.endAt);
                            return (
                              <div key={block.id} className="penta-rv-block card">
                                <div className="penta-rv-block-header">
                                  <div className="penta-rv-block-time">
                                    {formatTime(s)} – {formatTime(e)}
                                  </div>
                                </div>
                                <BlockEntry
                                  block={block}
                                  pillarMap={pillarById}
                                  photos={photos}
                                />
                              </div>
                            );
                          })}
                        </div>
                      );
                    });
                  }

                  // Time-based sorting
                  const sorted = [...timeSlots].sort((a, b) => {
                    const ta = new Date(a.startAt).getTime();
                    const tb = new Date(b.startAt).getTime();
                    return timelineSort === "recent" ? tb - ta : ta - tb;
                  });

                  return sorted.map((slot) => {
                    const s = new Date(slot.startAt);
                    const e = new Date(slot.endAt);
                    const dur = Math.round((e - s) / 60000);
                    return (
                      <TimelineSlot
                        key={slot.key}
                        timeLabel={`${formatTime(s)} – ${formatTime(e)}`}
                        duration={dur}
                        blocks={slot.blocks}
                        pillarMap={pillarById}
                        photos={photos}
                      />
                    );
                  });
                })()}
              </div>
            </>
          )}
        </>
      )}

      {activePillars.length === 0 && (
        <div className="card penta-empty">
          <div className="penta-empty-title">No pillars found</div>
          <div className="penta-empty-desc">
            Your life pillars will appear here once your account is set up.
          </div>
        </div>
      )}

      {/* Task section */}
      <div className="penta-tasks-section">
        <div className="penta-tasks-header">Tasks</div>

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

            <div className="penta-tasks-group">
              {nonNegotiables.length > 0 && (
                <div className="penta-tasks-group-label">Today Tasks</div>
              )}
              {todayTasks.map((task) => (
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

            <QuickAddTask onAdd={createTask} pillars={activePillars} subPillarsByPillar={subPillarsByPillar} />
          </>
        )}
      </div>

      <PentaNavBar />
    </div>
  );
}
