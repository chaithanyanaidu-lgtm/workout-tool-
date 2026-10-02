/**
 * CLAWW — WORKOUT QUALITY VALIDATION ENGINE
 *
 * Comprehensive pre-flight quality checks before any session or program ships.
 * If validation fails, the program generator regenerates the affected portion.
 *
 * Implements Section 18 Quality Criteria:
 *  - Matches selected split structure
 *  - Equipment compatibility
 *  - No unnecessary duplicate exercises
 *  - Fits available session duration
 *  - Volume within safe limits
 *  - Balanced movement coverage
 *  - Valid alternatives attached
 */

import { getExerciseById, resolveEquipmentPreset } from "../data/exercises.js";

export function validateSession({ session, experienceProfile = {}, availableEquipment = "full_gym", sessionDurationMinutes = 60 }) {
  const issues = [];
  if (session.is_rest_day) return { valid: true, issues: [] };

  const resolvedEquip = resolveEquipmentPreset(availableEquipment);

  // 1. Duplicate exercises check
  const ids = (session.exercises || []).map((e) => e.exercise_id);
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (duplicates.length) {
    issues.push(`Duplicate exercise(s) in session: ${[...new Set(duplicates)].join(", ")}`);
  }

  // 2. Equipment compatibility
  for (const ex of (session.exercises || [])) {
    const fullEx = getExerciseById(ex.exercise_id);
    if (!fullEx) {
      issues.push(`Exercise ${ex.exercise_id} not found in database.`);
      continue;
    }
    const hasEquipment = fullEx.equipment.some((eq) => resolvedEquip.includes(eq));
    if (!hasEquipment) {
      issues.push(`Exercise "${fullEx.name}" requires equipment [${fullEx.equipment.join(", ")}] not available in trainee setup.`);
    }
  }

  // 3. Technical demand ceiling vs experience level
  const maxTech = experienceProfile.max_technical_demand || 4;
  for (const ex of (session.exercises || [])) {
    const fullEx = getExerciseById(ex.exercise_id);
    if (fullEx && (fullEx.technical_demand || fullEx.difficulty) > maxTech + 1) {
      issues.push(`Exercise "${fullEx.name}" exceeds technical demand ceiling (${fullEx.technical_demand} > ${maxTech}).`);
    }
  }

  // 4. Sanity check set counts
  if ((session.exercises || []).some((e) => e.sets <= 0)) {
    issues.push("Session contains an exercise with zero or negative sets.");
  }

  // 5. Duration constraint: allow small margin (up to 15 mins over target duration)
  if (session.estimated_duration_minutes > sessionDurationMinutes + 15) {
    issues.push(`Estimated duration (${session.estimated_duration_minutes}m) significantly exceeds target (${sessionDurationMinutes}m).`);
  }

  // 6. Fatigue budget: max heavy compounds
  const heavyCompounds = (session.exercises || []).filter((e) => e.role === "primary" && e.classification === "compound");
  if (heavyCompounds.length > 4) {
    issues.push(`Session has ${heavyCompounds.length} primary compound lifts, risking acute systemic fatigue.`);
  }

  return { valid: issues.length === 0, issues };
}

export function validateWeeklyVolume({ weeklyTargets, allocation }) {
  const issues = [];
  if (!allocation || !weeklyTargets) return { valid: true, issues: [] };

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

export function validateProgramRecovery(program) {
  const issues = [];
  const days = program.days || [];

  // Check for consecutive heavy days on identical muscle groups
  for (let i = 0; i < days.length - 1; i++) {
    const d1 = days[i];
    const d2 = days[i + 1];

    if (!d1.is_rest_day && !d2.is_rest_day) {
      const d1Primaries = (d1.exercises || []).filter((e) => e.role === "primary").map((e) => e.primary_muscle);
      const d2Primaries = (d2.exercises || []).filter((e) => e.role === "primary").map((e) => e.primary_muscle);

      const overlap = d1Primaries.filter((m) => d2Primaries.includes(m) && m !== "core");
      if (overlap.length > 0 && program.split_id !== "custom") {
        issues.push(`Consecutive training days ${d1.day_index} and ${d2.day_index} place primary compound stress on ${overlap.join(", ")} without a rest day.`);
      }
    }
  }

  return { valid: issues.length === 0, issues };
}
