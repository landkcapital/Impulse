import { useState, useEffect, useCallback, useMemo } from "react";
import { getUserPillars, getPillarTotalsForRange, getWorkTagTotalsForRange } from "../api/pentaPillarsApi";
import { generateFounderRangeInsight } from "../lib/founderRangeInsight";
import { generateStrategicInsights } from "../lib/strategicInsights";

const RANGES = {
  "1d": { label: "Yesterday", days: 1 },
  "7d": { label: "7 days", days: 7 },
  "14d": { label: "14 days", days: 14 },
  "30d": { label: "30 days", days: 30 },
};

function formatDate(date) {
  return (
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0")
  );
}

function getDateRange(rangeKey) {
  const config = RANGES[rangeKey];
  if (!config) return { startDate: "", endDate: "" };

  const now = new Date();

  if (rangeKey === "1d") {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const str = formatDate(yesterday);
    return { startDate: str, endDate: str };
  }

  const end = new Date(now);
  end.setDate(end.getDate() - 1); // up to yesterday
  const start = new Date(now);
  start.setDate(start.getDate() - config.days);

  return { startDate: formatDate(start), endDate: formatDate(end) };
}

function getRangeLabel(rangeKey) {
  switch (rangeKey) {
    case "1d":
      return "yesterday";
    case "7d":
      return "this week";
    case "14d":
      return "in the last 14 days";
    case "30d":
      return "in the last 30 days";
    default:
      return "";
  }
}

export { RANGES };

export default function usePentaInsights() {
  const [range, setRange] = useState("7d");
  const [pillars, setPillars] = useState([]);
  const [pillarTotals, setPillarTotals] = useState({});
  const [workTagTotals, setWorkTagTotals] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (rangeKey) => {
    try {
      setLoading(true);
      setError(null);

      const { startDate, endDate } = getDateRange(rangeKey);

      const [userPillars, pTotals, wTotals] = await Promise.all([
        getUserPillars(),
        getPillarTotalsForRange(startDate, endDate),
        getWorkTagTotalsForRange(startDate, endDate),
      ]);

      setPillars(userPillars);
      setPillarTotals(pTotals);
      setWorkTagTotals(wTotals);
    } catch (err) {
      console.error("Insights load error:", err);
      setError(err.message || "Failed to load insights");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(range);
  }, [range, load]);

  const rangeLabel = getRangeLabel(range);

  const founderInsight = useMemo(
    () => generateFounderRangeInsight(workTagTotals, rangeLabel),
    [workTagTotals, rangeLabel]
  );

  const strategicInsight = useMemo(
    () =>
      generateStrategicInsights({
        pillars,
        pillarTotals,
        workTagTotals,
        rangeLabel,
      }),
    [pillars, pillarTotals, workTagTotals, rangeLabel]
  );

  const handleSetRange = useCallback((newRange) => {
    setRange(newRange);
  }, []);

  return {
    range,
    setRange: handleSetRange,
    pillars,
    pillarTotals,
    workTagTotals,
    founderInsight,
    strategicInsight,
    loading,
    error,
    refresh: () => load(range),
  };
}
