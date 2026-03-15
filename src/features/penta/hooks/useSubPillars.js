import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getSubPillars,
  createSubPillar as apiCreate,
  updateSubPillar as apiUpdate,
  deleteSubPillar as apiDelete,
} from "../api/pentaSubPillarsApi";

export default function useSubPillars() {
  const [subPillars, setSubPillars] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSubPillars();
      setSubPillars(data);
    } catch (err) {
      console.error("Failed to load sub-pillars:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const byPillar = useMemo(() => {
    const map = {};
    for (const sp of subPillars) {
      if (!map[sp.pillar_key]) map[sp.pillar_key] = [];
      map[sp.pillar_key].push(sp);
    }
    return map;
  }, [subPillars]);

  const createSub = useCallback(async (args) => {
    const newSub = await apiCreate(args);
    setSubPillars((prev) => [...prev, newSub]);
    return newSub;
  }, []);

  const updateSub = useCallback(async (id, updates) => {
    const updated = await apiUpdate(id, updates);
    setSubPillars((prev) => prev.map((sp) => (sp.id === id ? updated : sp)));
    return updated;
  }, []);

  const deleteSub = useCallback(async (id) => {
    await apiDelete(id);
    setSubPillars((prev) => prev.filter((sp) => sp.id !== id));
  }, []);

  return {
    subPillars,
    byPillar,
    loading,
    createSub,
    updateSub,
    deleteSub,
    refresh: load,
  };
}
