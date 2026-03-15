import usePentaInsights, { RANGES } from "../hooks/usePentaInsights";
import { WORK_TAGS, WORK_TAG_COLOURS } from "../lib/founderInsight";
import { formatDuration } from "../lib/time";
import PentaBalancePentagon from "../components/PentaBalancePentagon";
import PentaHeader from "../components/PentaHeader";
import PentaNavBar from "../components/PentaNavBar";
import PentaLoader from "../components/PentaLoader";

function RangeSelector({ range, onSelect }) {
  return (
    <div className="penta-ins-range">
      {Object.entries(RANGES).map(([key, config]) => (
        <button
          key={key}
          className={`penta-ins-range-btn ${range === key ? "active" : ""}`}
          onClick={() => onSelect(key)}
        >
          {key === "1d" ? "Yesterday" : key.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function PillarTotalRow({ pillar, points }) {
  return (
    <div className="penta-ins-pillar-row">
      <span
        className="penta-ins-pillar-bar"
        style={{ backgroundColor: pillar.colour }}
      />
      <span className="penta-ins-pillar-name">{pillar.name}</span>
      <span className="penta-ins-pillar-value">
        {points > 0 ? formatDuration(points) : "--"}
      </span>
    </div>
  );
}

function WorkDistributionCard({ workTagTotals, founderInsight }) {
  const totalWork = Object.values(workTagTotals).reduce((s, v) => s + v, 0);

  return (
    <div className="card penta-ins-work-card">
      <div className="penta-ins-work-title">Work Distribution</div>
      <div className="penta-ins-work-rows">
        {WORK_TAGS.map((tag) => {
          const minutes = workTagTotals[tag.key] || 0;
          const pct = totalWork > 0 ? Math.round((minutes / totalWork) * 100) : 0;
          return (
            <div key={tag.key} className="penta-ins-work-row">
              <span
                className="penta-ins-work-dot"
                style={{ backgroundColor: WORK_TAG_COLOURS[tag.key] }}
              />
              <span className="penta-ins-work-label">{tag.label}</span>
              <span className="penta-ins-work-value">
                {minutes > 0 ? formatDuration(minutes) : "--"}
              </span>
              {totalWork > 0 && minutes > 0 && (
                <span className="penta-ins-work-pct">{pct}%</span>
              )}
            </div>
          );
        })}
      </div>
      {founderInsight && (
        <div className="penta-ins-work-insight">{founderInsight}</div>
      )}
    </div>
  );
}

export default function PentaInsightsScreen() {
  const {
    range,
    setRange,
    pillars,
    pillarTotals,
    workTagTotals,
    founderInsight,
    strategicInsight,
    loading,
    error,
    refresh,
  } = usePentaInsights();

  if (loading) {
    return (
      <div className="page penta-page penta-page-with-nav">
        <PentaHeader title="Insights" subtitle="Patterns over time" />
        <RangeSelector range={range} onSelect={setRange} />
        <PentaLoader label="Loading insights..." />
        <PentaNavBar />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page penta-page penta-page-with-nav">
        <PentaHeader title="Insights" subtitle="Patterns over time" />
        <RangeSelector range={range} onSelect={setRange} />
        <div className="card penta-error">
          <div className="penta-error-title">Something went wrong</div>
          <div className="penta-error-message">{error}</div>
          <button className="btn small" onClick={refresh}>
            Retry
          </button>
        </div>
        <PentaNavBar />
      </div>
    );
  }

  const activePillars = pillars.filter((p) => p.is_active);
  const totalMinutes = activePillars.reduce(
    (sum, p) => sum + (pillarTotals[p.id] || 0),
    0
  );

  // Check if the Work pillar has any logged time
  const workPillar = activePillars.find((p) => p.key === "work");
  const workMinutes = workPillar ? pillarTotals[workPillar.id] || 0 : 0;

  const isEmpty = totalMinutes === 0;

  return (
    <div className="page penta-page penta-page-with-nav">
      <PentaHeader title="Insights" subtitle="Patterns over time" />

      <RangeSelector range={range} onSelect={setRange} />

      {isEmpty ? (
        <div className="card penta-ins-empty">
          <div className="penta-ins-empty-text">
            No activity has been logged for this period yet.
          </div>
        </div>
      ) : (
        <>
          {/* Pentagon */}
          <PentaBalancePentagon
            pillars={pillars}
            pillarTotals={pillarTotals}
          />

          {/* Pillar totals */}
          <div className="card penta-ins-pillars">
            {activePillars.map((p) => (
              <PillarTotalRow
                key={p.id}
                pillar={p}
                points={pillarTotals[p.id] || 0}
              />
            ))}
            <div className="penta-ins-total">
              <span>Total</span>
              <span>{formatDuration(totalMinutes)}</span>
            </div>
          </div>

          {/* Strategic insight */}
          {strategicInsight.length > 0 && (
            <div className="card penta-ins-strategic">
              <div className="penta-ins-strategic-label">Strategic Insight</div>
              <div className="penta-ins-strategic-text">
                {strategicInsight.join(" ")}
              </div>
            </div>
          )}

          {/* Founder analytics — only when Work pillar has time */}
          {workPillar && workMinutes > 0 && (
            <WorkDistributionCard
              workTagTotals={workTagTotals}
              founderInsight={founderInsight}
            />
          )}
        </>
      )}

      <PentaNavBar />
    </div>
  );
}
