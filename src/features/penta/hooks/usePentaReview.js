import { useState, useEffect, useCallback } from "react";
import { getUserPillars, getDailyPillarPoints } from "../api/pentaPillarsApi";
import {
  getReviewBlocks,
  getDailyReview,
  upsertDailyReview,
} from "../api/pentaReviewApi";
import { getTodayDateString } from "../lib/time";

export default function usePentaReview() {
  const [pillars, setPillars] = useState([]);
  const [pillarTotals, setPillarTotals] = useState({});
  const [blocks, setBlocks] = useState([]);
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const today = getTodayDateString();
      const [userPillars, totals, dayBlocks, dayReview] = await Promise.all([
        getUserPillars(),
        getDailyPillarPoints(today),
        getReviewBlocks(today),
        getDailyReview(today),
      ]);

      setPillars(userPillars);
      setPillarTotals(totals);
      setBlocks(dayBlocks);
      setReview(dayReview);
    } catch (err) {
      console.error("Penta review load error:", err);
      setError(err.message || "Failed to load review");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveReview = useCallback(
    async ({ reflectionText, tomorrowIntentText }) => {
      const today = getTodayDateString();
      await upsertDailyReview({
        localDate: today,
        reflectionText,
        tomorrowIntentText,
      });
      // Update local state
      setReview((prev) => ({
        ...prev,
        local_date: today,
        reflection_text: reflectionText || null,
        tomorrow_intent_text: tomorrowIntentText || null,
      }));
    },
    []
  );

  return {
    pillars,
    pillarTotals,
    blocks,
    review,
    loading,
    error,
    saveReview,
    refresh: load,
  };
}
