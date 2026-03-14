import { useState, useEffect, useCallback } from "react";
import { initializePentaUser, getProfile } from "../api/pentaProfileApi";
import {
  getUserPillars,
  getDailyPillarPoints,
  getDailyWorkTagTotals,
} from "../api/pentaPillarsApi";
import { getTodayDateString } from "../lib/time";

export default function usePentaDashboard() {
  const [profile, setProfile] = useState(null);
  const [pillars, setPillars] = useState([]);
  const [scores, setScores] = useState({});
  const [workTagTotals, setWorkTagTotals] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Ensure profile + default pillars exist (idempotent)
      await initializePentaUser();

      // Load profile, pillars, today's scores, and work tag totals in parallel
      const today = getTodayDateString();
      const [prof, userPillars, dailyScores, tagTotals] = await Promise.all([
        getProfile(),
        getUserPillars(),
        getDailyPillarPoints(today),
        getDailyWorkTagTotals(today),
      ]);

      setProfile(prof);
      setPillars(userPillars);
      setScores(dailyScores);
      setWorkTagTotals(tagTotals);
    } catch (err) {
      console.error("Penta dashboard load error:", err);
      setError(err.message || "Failed to load Penta dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    profile,
    pillars,
    scores,
    workTagTotals,
    loading,
    error,
    refresh: load,
  };
}
