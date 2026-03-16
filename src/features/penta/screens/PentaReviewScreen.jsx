import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import usePentaReview from "../hooks/usePentaReview";
import { generateBalanceSummary } from "../lib/reviewSummary";
import { formatTime, formatDuration } from "../lib/time";
import { getPhotosForBlocks } from "../api/pentaBlockPhotosApi";
import PentaBalancePentagon from "../components/PentaBalancePentagon";
import PentaHeader from "../components/PentaHeader";
import PentaNavBar from "../components/PentaNavBar";
import PentaLoader from "../components/PentaLoader";

function formatToday() {
  const d = new Date();
  return d.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function PillarTotalCard({ pillar, points }) {
  return (
    <div className="penta-rv-pillar">
      <div
        className="penta-rv-pillar-bar"
        style={{ backgroundColor: pillar.colour }}
      />
      <div className="penta-rv-pillar-name">{pillar.name}</div>
      <div className="penta-rv-pillar-time">
        {points > 0 ? formatDuration(points) : "--"}
      </div>
    </div>
  );
}

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

export default function PentaReviewScreen() {
  const navigate = useNavigate();
  const {
    pillars,
    pillarTotals,
    blocks,
    review,
    loading,
    error,
    saveReview,
    refresh,
  } = usePentaReview();

  // Photos
  const [photos, setPhotos] = useState([]);
  useEffect(() => {
    if (blocks.length > 0) {
      const ids = blocks.map((b) => b.id);
      getPhotosForBlocks(ids).then(setPhotos).catch(() => {});
    }
  }, [blocks]);

  // Timeline sort
  const [timelineSort, setTimelineSort] = useState("recent");

  // Reflection form state
  const [reflection, setReflection] = useState("");
  const [tomorrowIntent, setTomorrowIntent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Seed form from loaded review
  useEffect(() => {
    if (review) {
      setReflection(review.reflection_text || "");
      setTomorrowIntent(review.tomorrow_intent_text || "");
    }
  }, [review]);

  async function handleSaveReflection() {
    setSaving(true);
    setSaveError(null);
    try {
      await saveReview({
        reflectionText: reflection.trim(),
        tomorrowIntentText: tomorrowIntent.trim(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(err.message || "Failed to save reflection");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page penta-page">
        <PentaLoader label="Loading review..." />
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
  const pillarMap = {};
  for (const p of pillars) pillarMap[p.id] = p;

  const summaryText = generateBalanceSummary(pillars, pillarTotals);
  const totalMinutes = activePillars.reduce(
    (sum, p) => sum + (pillarTotals[p.id] || 0),
    0
  );

  // Group blocks by time slot (same start_at + end_at)
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

  // Sort timeline slots
  const sortedSlots = [...timeSlots];
  if (timelineSort === "recent") {
    sortedSlots.sort((a, b) => new Date(b.startAt) - new Date(a.startAt));
  } else if (timelineSort === "earliest") {
    sortedSlots.sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
  }
  // "pillar" handled separately below

  // Group by pillar for "By Pillar" view
  const pillarGroups = (() => {
    if (timelineSort !== "pillar") return null;
    const groups = {};
    for (const slot of timeSlots) {
      for (const block of slot.blocks) {
        const allocs = block.block_pillar_points || [];
        for (const bp of allocs) {
          const p = pillarMap[bp.pillar_id];
          if (!p) continue;
          if (!groups[p.id]) groups[p.id] = { pillar: p, slots: [] };
          // Add the whole slot (avoid duplicates)
          if (!groups[p.id].slots.find((s) => s.key === slot.key)) {
            groups[p.id].slots.push(slot);
          }
        }
        if (allocs.length === 0) {
          if (!groups["none"]) groups["none"] = { pillar: { name: "Unassigned", colour: "#999", id: "none" }, slots: [] };
          if (!groups["none"].slots.find((s) => s.key === slot.key)) {
            groups["none"].slots.push(slot);
          }
        }
      }
    }
    return Object.values(groups);
  })();

  return (
    <div className="page penta-page penta-page-with-nav">
      <PentaHeader
        title="History"
        subtitle={formatToday()}
      />

      {/* Balance Pentagon */}
      <PentaBalancePentagon
        pillars={pillars}
        pillarTotals={pillarTotals}
      />

      {/* Pillar totals */}
      <div className="penta-rv-pillars card">
        {activePillars.map((p) => (
          <PillarTotalCard
            key={p.id}
            pillar={p}
            points={pillarTotals[p.id] || 0}
          />
        ))}
        {totalMinutes > 0 && (
          <div className="penta-rv-total">
            <span>Total</span>
            <span>{formatDuration(totalMinutes)}</span>
          </div>
        )}
      </div>

      {/* Balance summary */}
      {summaryText && (
        <div className="card penta-rv-summary">
          <p>{summaryText}</p>
        </div>
      )}

      {/* Timeline */}
      <div className="penta-timeline-header">
        <div className="penta-rv-section-label" style={{ margin: 0 }}>Timeline</div>
        {blocks.length > 0 && (
          <div className="penta-timeline-sort-toggle">
            {["recent", "earliest", "pillar"].map((mode) => (
              <button
                key={mode}
                className={`penta-timeline-sort-btn ${timelineSort === mode ? "active" : ""}`}
                onClick={() => setTimelineSort(mode)}
              >
                {mode === "recent" ? "Recent" : mode === "earliest" ? "Earliest" : "By Pillar"}
              </button>
            ))}
          </div>
        )}
      </div>
      {blocks.length === 0 ? (
        <div className="card penta-rv-empty">
          <div className="penta-rv-empty-title">No time blocks logged today</div>
          <div className="penta-rv-empty-desc">
            Start logging to see your day take shape.
          </div>
          <button
            className="btn small"
            style={{ marginTop: "0.75rem" }}
            onClick={() => navigate("/log")}
          >
            Log a block
          </button>
        </div>
      ) : timelineSort === "pillar" && pillarGroups ? (
        <div className="penta-rv-timeline">
          {pillarGroups.map((group) => (
            <div key={group.pillar.id} className="penta-timeline-pillar-group">
              <div className="penta-timeline-pillar-label">
                <span className="penta-timeline-pillar-dot" style={{ backgroundColor: group.pillar.colour }} />
                {group.pillar.name}
              </div>
              {group.slots.map((slot) => {
                const s = new Date(slot.startAt);
                const e = new Date(slot.endAt);
                const dur = Math.round((e - s) / 60000);
                return (
                  <TimelineSlot
                    key={slot.key}
                    timeLabel={`${formatTime(s)} – ${formatTime(e)}`}
                    duration={dur}
                    blocks={slot.blocks}
                    pillarMap={pillarMap}
                    photos={photos}
                  />
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className="penta-rv-timeline">
          {sortedSlots.map((slot) => {
            const s = new Date(slot.startAt);
            const e = new Date(slot.endAt);
            const dur = Math.round((e - s) / 60000);
            return (
              <TimelineSlot
                key={slot.key}
                timeLabel={`${formatTime(s)} – ${formatTime(e)}`}
                duration={dur}
                blocks={slot.blocks}
                pillarMap={pillarMap}
                photos={photos}
              />
            );
          })}
        </div>
      )}

      {/* Daily reflection */}
      <div className="penta-rv-section-label">Reflection</div>
      <div className="card penta-rv-reflection">
        <div className="penta-rv-reflect-group">
          <label className="penta-rv-reflect-label">
            What went well today?
          </label>
          <textarea
            className="penta-rv-textarea"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Take a moment to notice what worked..."
            rows={3}
          />
        </div>
        <div className="penta-rv-reflect-group">
          <label className="penta-rv-reflect-label">
            What would you like to shift tomorrow?
          </label>
          <textarea
            className="penta-rv-textarea"
            value={tomorrowIntent}
            onChange={(e) => setTomorrowIntent(e.target.value)}
            placeholder="A gentle intention for tomorrow..."
            rows={3}
          />
        </div>
        {saveError && <div className="form-error">{saveError}</div>}
        {saved && (
          <div className="penta-success-toast">Reflection saved</div>
        )}
        <button
          className="btn primary"
          onClick={handleSaveReflection}
          disabled={saving}
          style={{ marginTop: "0.5rem" }}
        >
          {saving ? "Saving..." : "Save Reflection"}
        </button>
      </div>

      <PentaNavBar />
    </div>
  );
}
