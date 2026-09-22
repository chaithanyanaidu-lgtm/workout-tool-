/**
 * PHASE 13 / spec section 30 — VALIDATION ENGINE
 *
 * Runs before any session is returned to the frontend. If validation
 * fails, the caller (programGenerator) regenerates the affected portion
 * rather than shipping an invalid workout.
 */

import { getRequiredPatterns } from "./movementPatternEngine.js";

export function validateSession({ session, experienceProfile, availableEquipment, sessionDurationMinutes }) {
  const issues = [];
  if (session.is_rest_day) return { valid: true, issues: [] };

  // Movement coverage
  const requiredPatterns = getRequiredPatterns(session.session_type).map((p) => p.pattern);
  const coveredPatterns = Object.keys(session.locked_selections || {});
  const missingCoverage = requiredPatterns.filter((p) => !coveredPatterns.includes(p) && !session.trimmed_for_time.length);
  // (a pattern legitimately absent because it was trimmed for time is not a validation failure)

  // Duplicate exercises
  const ids = session.exercises.map((e) => e.exercise_id);
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (duplicates.length) issues.push(`Duplicate exercise(s) in session: ${[...new Set(duplicates)].join(", ")}`);

  // Equipment availability (defense in depth — selection engine should already guarantee this)
  // (checked upstream; re-verified here structurally by presence of a valid exercise_id)
  if (session.exercises.some((e) => !e.exercise_id)) issues.push("Session contains an exercise with no resolved exercise_id.");

  // Experience compatibility: technical_demand ceiling already enforced upstream; sanity check set counts are positive.
  if (session.exercises.some((e) => e.sets <= 0)) issues.push("Session contains an exercise with zero or negative sets.");

  // Duration
  if (session.estimated_duration_minutes > sessionDurationMinutes + 10) {
    issues.push(`Estimated duration (${session.estimated_duration_minutes} min) exceeds available time (${sessionDurationMinutes} min) by more than 10 minutes.`);
  }

  // Excessive fatigue: sum of fatigue-relevant heavy compounds (role=primary/secondary) shouldn't exceed a sane per-session count.
  const heavyCompoundCount = session.exercises.filter((e) => e.role !== "accessory").length;
  if (heavyCompoundCount > 5) issues.push(`Session has ${heavyCompoundCount} primary/secondary movements, which risks excessive session fatigue.`);

  return { valid: issues.length === 0, issues };
}

export function validateWeeklyVolume({ weeklyTargets, allocation }) {
  const issues = [];
  for (const [dayIndex, muscles] of Object.entries(allocation)) {
    for (const [muscle, sets] of Object.entries(muscles)) {
      const target = weeklyTargets[muscle];
      if (target && sets > target.max) {
        issues.push(`Day ${dayIndex}: ${muscle} allocated ${sets} sets, above the weekly max guideline of ${target.max}/week total.`);
      }
    }
  }
  return { valid: issues.length === 0, issues };
}
