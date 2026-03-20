import { useState, useEffect, useCallback } from "react";
import {
  getTasksForDate,
  createTask as apiCreateTask,
  toggleTaskComplete as apiToggleComplete,
  deleteTask as apiDeleteTask,
  copyTemplatesToDate,
} from "../api/pentaTasksApi";
import { getTodayDateString } from "../lib/time";

export default function usePentaTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const today = getTodayDateString();

      // Stamp any templates that haven't been copied yet (idempotent).
      // Failure here is non-fatal — don't let it prevent tasks from loading.
      try {
        await copyTemplatesToDate(today);
      } catch (templateErr) {
        console.warn("Template copy failed (non-fatal):", templateErr);
      }

      const data = await getTasksForDate(today);
      setTasks(data);
    } catch (err) {
      console.error("Penta tasks load error:", err);
      setError(err.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createTask = useCallback(
    async ({ title, isNonNegotiable, pillarKey, workTag }) => {
      const today = getTodayDateString();
      const newTask = await apiCreateTask({
        localDate: today,
        title,
        isNonNegotiable: isNonNegotiable || false,
        defaultPillarKey: pillarKey || null,
        workTag: workTag || null,
      });
      setTasks((prev) => {
        // Insert non-negotiables at the end of the NN group, today tasks at the end
        if (newTask.is_non_negotiable) {
          const lastNNIndex = prev.findLastIndex((t) => t.is_non_negotiable);
          const insertAt = lastNNIndex + 1;
          return [...prev.slice(0, insertAt), newTask, ...prev.slice(insertAt)];
        }
        return [...prev, newTask];
      });
      return newTask;
    },
    []
  );

  const toggleTaskComplete = useCallback(async (taskId, completed) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              is_done: completed,
              done_at: completed ? new Date().toISOString() : null,
            }
          : t
      )
    );
    try {
      await apiToggleComplete(taskId, completed);
    } catch (err) {
      // Revert on failure
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, is_done: !completed, done_at: null }
            : t
        )
      );
      throw err;
    }
  }, []);

  const deleteTask = useCallback(async (taskId) => {
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await apiDeleteTask(taskId);
    } catch (err) {
      setTasks(previous);
      throw err;
    }
  }, [tasks]);

  return {
    tasks,
    loading,
    error,
    createTask,
    toggleTaskComplete,
    deleteTask,
    refresh: load,
  };
}
