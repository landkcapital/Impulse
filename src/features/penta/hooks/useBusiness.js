import { useState, useEffect, useCallback } from "react";
import {
  getBusinessRoles,
  createBusinessRole,
  updateBusinessRole,
  deleteBusinessRole,
  getAllBusinessTasks,
  createBusinessTask,
  toggleBusinessTask,
  deleteBusinessTask,
  getDeletedBusinessTasks,
  restoreBusinessTask,
  permanentlyDeleteBusinessTask,
} from "../api/pentaBusinessApi";

export default function useBusiness() {
  const [roles, setRoles] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [deletedTasks, setDeletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const [r, t, d] = await Promise.all([
        getBusinessRoles(),
        getAllBusinessTasks(),
        getDeletedBusinessTasks(),
      ]);
      setRoles(r);
      setTasks(t);
      setDeletedTasks(d);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addRole(data) {
    const role = await createBusinessRole(data);
    setRoles((prev) => [...prev, role]);
    return role;
  }

  async function editRole(roleId, updates) {
    await updateBusinessRole(roleId, updates);
    setRoles((prev) =>
      prev.map((r) => (r.id === roleId ? { ...r, ...updates } : r))
    );
  }

  async function removeRole(roleId) {
    await deleteBusinessRole(roleId);
    setRoles((prev) => prev.filter((r) => r.id !== roleId));
    setTasks((prev) => prev.filter((t) => t.role_id !== roleId));
  }

  async function addTask(data) {
    const task = await createBusinessTask(data);
    setTasks((prev) => [task, ...prev]);
    return task;
  }

  async function toggleTask(taskId, isDone) {
    await toggleBusinessTask(taskId, isDone);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, is_done: isDone, done_at: isDone ? new Date().toISOString() : null }
          : t
      )
    );
  }

  async function removeTask(taskId) {
    await deleteBusinessTask(taskId);
    const removed = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (removed) setDeletedTasks((prev) => [{ ...removed, deleted_at: new Date().toISOString() }, ...prev]);
  }

  async function restoreTask(taskId) {
    await restoreBusinessTask(taskId);
    const restored = deletedTasks.find((t) => t.id === taskId);
    setDeletedTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (restored) setTasks((prev) => [{ ...restored, deleted_at: null }, ...prev]);
  }

  async function permanentlyRemoveTask(taskId) {
    await permanentlyDeleteBusinessTask(taskId);
    setDeletedTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  // Tasks grouped by role
  const tasksByRole = {};
  for (const t of tasks) {
    if (!tasksByRole[t.role_id]) tasksByRole[t.role_id] = [];
    tasksByRole[t.role_id].push(t);
  }

  return {
    roles,
    tasks,
    deletedTasks,
    tasksByRole,
    loading,
    error,
    addRole,
    editRole,
    removeRole,
    addTask,
    toggleTask,
    removeTask,
    restoreTask,
    permanentlyRemoveTask,
    refresh: load,
  };
}
