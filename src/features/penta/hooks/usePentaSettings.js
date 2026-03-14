import { useState, useEffect, useCallback } from "react";
import {
  getProfile,
  updateProfile as apiUpdateProfile,
  getTaskTemplates,
  createTaskTemplate as apiCreateTemplate,
  updateTaskTemplate as apiUpdateTemplate,
  deleteTaskTemplate as apiDeleteTemplate,
} from "../api/pentaSettingsApi";

export default function usePentaSettings() {
  const [profile, setProfile] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [prof, tmpl] = await Promise.all([
        getProfile(),
        getTaskTemplates(),
      ]);

      setProfile(prof);
      setTemplates(tmpl);
    } catch (err) {
      console.error("Penta settings load error:", err);
      setError(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateProfile = useCallback(
    async (updates) => {
      // Optimistic update
      setProfile((prev) => ({ ...prev, ...updates }));
      try {
        await apiUpdateProfile(updates);
      } catch (err) {
        // Revert on failure
        await load();
        throw err;
      }
    },
    [load]
  );

  const createTemplate = useCallback(
    async ({ title, defaultPillarKey, workTag }) => {
      const newTemplate = await apiCreateTemplate({
        title,
        defaultPillarKey,
        workTag,
      });
      setTemplates((prev) => [...prev, newTemplate]);
      return newTemplate;
    },
    []
  );

  const updateTemplate = useCallback(
    async (templateId, updates) => {
      // Optimistic update
      setTemplates((prev) =>
        prev.map((t) => (t.id === templateId ? { ...t, ...updates } : t))
      );
      try {
        const updated = await apiUpdateTemplate(templateId, updates);
        setTemplates((prev) =>
          prev.map((t) => (t.id === templateId ? updated : t))
        );
        return updated;
      } catch (err) {
        await load();
        throw err;
      }
    },
    [load]
  );

  const deleteTemplate = useCallback(async (templateId) => {
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    try {
      await apiDeleteTemplate(templateId);
    } catch (err) {
      await load();
      throw err;
    }
  }, [load]);

  return {
    profile,
    templates,
    loading,
    error,
    updateProfile,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refresh: load,
  };
}
