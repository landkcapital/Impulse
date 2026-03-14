import { useState, useEffect, useMemo } from "react";

/**
 * Short labels for pentagon vertices, mapped from pillar keys.
 */
const SHORT_LABELS = {
  work: "Work",
  health: "Health",
  relationships: "Friends",
  growth: "Hobbies",
  admin: "Admin",
};

/**
 * Compute the (x, y) coordinates for a regular pentagon vertex.
 * Vertex 0 is at the top (12 o'clock), going clockwise.
 */
function pentagonPoint(index, radius, cx, cy) {
  const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

/**
 * Build an SVG polygon points string from an array of {x, y}.
 */
function toPointsString(points) {
  return points.map((p) => `${p.x},${p.y}`).join(" ");
}

/**
 * The Balance Pentagon — Penta's signature visual.
 *
 * Props:
 * - pillars: array of { id, key, name, colour } in sort_order
 * - pillarTotals: { [pillar_id]: minutes }
 * - size: optional SVG width/height (default 280)
 */
export default function PentaBalancePentagon({
  pillars = [],
  pillarTotals = {},
  size = 280,
}) {
  const [animProgress, setAnimProgress] = useState(0);

  // Animation: expand from centre over 400ms
  useEffect(() => {
    const start = performance.now();
    const duration = 400;
    let raf;

    function tick(now) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimProgress(eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pillars, pillarTotals]);

  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size * 0.34;
  const labelRadius = size * 0.46;

  // Only render for exactly 5 active pillars
  const activePillars = pillars.filter((p) => p.is_active);
  const hasData = activePillars.length === 5;

  // Compute normalised radii
  const { dataPoints, gridRings, labels, hasAnyTime } = useMemo(() => {
    if (!hasData) {
      return { dataPoints: [], gridRings: [], labels: [], hasAnyTime: false };
    }

    const values = activePillars.map((p) => pillarTotals[p.id] || 0);
    const maxVal = Math.max(...values, 1); // avoid division by zero
    const anyTime = values.some((v) => v > 0);

    // Data polygon vertices (normalised, animated)
    const dp = activePillars.map((p, i) => {
      const val = pillarTotals[p.id] || 0;
      const norm = val / maxVal;
      const r = Math.max(norm, 0.04) * maxRadius; // min 4% so shape is visible
      return pentagonPoint(i, r, cx, cy);
    });

    // Background grid rings at 33%, 66%, 100%
    const gr = [0.33, 0.66, 1].map((frac) =>
      activePillars.map((_, i) => pentagonPoint(i, maxRadius * frac, cx, cy))
    );

    // Labels positioned outside the pentagon
    const lb = activePillars.map((p, i) => {
      const pos = pentagonPoint(i, labelRadius, cx, cy);
      return {
        ...pos,
        text: SHORT_LABELS[p.key] || p.name,
        colour: p.colour,
        key: p.key,
      };
    });

    return { dataPoints: dp, gridRings: gr, labels: lb, hasAnyTime: anyTime };
  }, [hasData, activePillars, pillarTotals, cx, cy, maxRadius, labelRadius]);

  if (!hasData) return null;

  // Interpolate data points from centre based on animation progress
  const animatedPoints = dataPoints.map((p) => ({
    x: cx + (p.x - cx) * animProgress,
    y: cy + (p.y - cy) * animProgress,
  }));

  // Grid spoke lines from centre to each vertex
  const outerVertices = activePillars.map((_, i) =>
    pentagonPoint(i, maxRadius, cx, cy)
  );

  return (
    <div className="penta-pentagon-wrap">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="penta-pentagon-svg"
      >
        {/* Grid spokes */}
        {outerVertices.map((v, i) => (
          <line
            key={`spoke-${i}`}
            x1={cx}
            y1={cy}
            x2={v.x}
            y2={v.y}
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.1"
          />
        ))}

        {/* Grid rings */}
        {gridRings.map((ring, ri) => (
          <polygon
            key={`ring-${ri}`}
            points={toPointsString(ring)}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.75"
            opacity={0.08 + ri * 0.04}
          />
        ))}

        {/* Data polygon fill */}
        {hasAnyTime && (
          <polygon
            points={toPointsString(animatedPoints)}
            fill="url(#pentaGradient)"
            fillOpacity="0.15"
            stroke="url(#pentaGradient)"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeOpacity="0.5"
          />
        )}

        {/* Vertex dots */}
        {hasAnyTime &&
          animatedPoints.map((p, i) => (
            <circle
              key={`dot-${i}`}
              cx={p.x}
              cy={p.y}
              r="3"
              fill={activePillars[i].colour}
              opacity={animProgress}
            />
          ))}

        {/* Centre dot */}
        <circle
          cx={cx}
          cy={cy}
          r="2"
          fill="currentColor"
          opacity="0.12"
        />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="pentaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>

      {/* Labels positioned outside the SVG using CSS */}
      {labels.map((label) => {
        // Determine text-anchor based on position relative to centre
        let textAnchor = "middle";
        let xOffset = 0;
        if (label.x < cx - 10) {
          textAnchor = "end";
          xOffset = -4;
        } else if (label.x > cx + 10) {
          textAnchor = "start";
          xOffset = 4;
        }

        // Adjust vertical position
        let yOffset = 0;
        if (label.y < cy - 10) yOffset = -6;
        if (label.y > cy + 10) yOffset = 8;

        return (
          <div
            key={label.key}
            className="penta-pentagon-label"
            style={{
              left: `${((label.x + xOffset) / size) * 100}%`,
              top: `${((label.y + yOffset) / size) * 100}%`,
              textAlign:
                textAnchor === "end"
                  ? "right"
                  : textAnchor === "start"
                  ? "left"
                  : "center",
              transform:
                textAnchor === "end"
                  ? "translateX(-100%)"
                  : textAnchor === "start"
                  ? "translateX(0)"
                  : "translateX(-50%)",
              color: label.colour,
            }}
          >
            {label.text}
          </div>
        );
      })}
    </div>
  );
}
