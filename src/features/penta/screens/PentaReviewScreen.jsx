import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import usePentaReview from "../hooks/usePentaReview";
import { generateBalanceSummary } from "../lib/reviewSummary";
import { formatTime, formatDuration } from "../lib/time";
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

function TimelineBlock({ block, pillarMap }) {
  const startDate = new Date(block.start_at);
  const endDate = new Date(block.end_at);
  const dur = Math.round((endDate - startDate) / 60000);

  const allocations = (block.block_pillar_points || []).map((bp) => ({
    pillar: pillarMap[bp.pillar_id],
    points: bp.points,
  }));

  return (
    <div className="penta-rv-block card">
      <div className="penta-rv-block-time">
        {formatTime(startDate)} – {formatTime(endDate)}
      </div>
      <div className="penta-rv-block-summary">{block.summary}</div>
      <div className="penta-rv-block-meta">
        <span className="penta-rv-block-dur">{formatDuration(dur)}</span>
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

  return (
    <div className="page penta-page penta-page-with-nav">
      <PentaHeader
        title="Review"
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
      <div className="penta-rv-section-label">Timeline</div>
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
      ) : (
        <div className="penta-rv-timeline">
          {blocks.map((block) => (
            <TimelineBlock key={block.id} block={block} pillarMap={pillarMap} />
          ))}
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
