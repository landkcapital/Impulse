import { useState, useEffect, useCallback } from "react";
import { getLastTimeBlock } from "../api/pentaTimeBlocksApi";
import { getTodayDateString } from "../lib/time";
import {
  getLoggingGap,
  isWithinActiveHours,
  getNudgeMessage,
} from "../lib/loggingGap";

/**
 * Hook that determines whether to show a logging nudge.
 *
 * Rules:
 * - Only show when missingMinutes >= incrementMinutes
 * - Only show when there are blocks logged today (no nudge on a fresh day)
 * - Only show during active hours (from profile settings)
 * - Dismissed state resets when refresh is called (e.g. after logging)
 *
 * @param {number} incrementMinutes - user's logging increment
 * @param {string} [activeHoursStart] - "HH:MM" from profile
 * @param {string} [activeHoursEnd] - "HH:MM" from profile
 */
export default function useLoggingNudge(
  incrementMinutes = 15,
  activeHoursStart,
  activeHoursEnd
) {
  const [nudge, setNudge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  const check = useCallback(async () => {
    try {
      setLoading(true);

      const now = new Date();

      // No nudge outside active hours
      if (!isWithinActiveHours(now, activeHoursStart, activeHoursEnd)) {
        setNudge(null);
        return;
      }

      const today = getTodayDateString();
      const lastBlock = await getLastTimeBlock(today);

      // No nudge if no blocks logged today
      if (!lastBlock) {
        setNudge(null);
        return;
      }

      const gap = getLoggingGap({
        lastBlockEnd: lastBlock.end_at,
        currentTime: now,
        incrementMinutes,
      });

      if (gap.missingMinutes >= incrementMinutes) {
        setNudge({
          message: getNudgeMessage(gap.missingMinutes),
          missingMinutes: gap.missingMinutes,
          missingBlocks: gap.missingBlocks,
        });
        setDismissed(false);
      } else {
        setNudge(null);
      }
    } catch {
      // Silent — nudge is non-critical
      setNudge(null);
    } finally {
      setLoading(false);
    }
  }, [incrementMinutes, activeHoursStart, activeHoursEnd]);

  useEffect(() => {
    check();
  }, [check]);

  return {
    nudge: dismissed ? null : nudge,
    loading,
    dismiss: () => setDismissed(true),
    refresh: check,
  };
}
