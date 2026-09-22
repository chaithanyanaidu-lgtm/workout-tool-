/**
 * ORCHESTRATOR — WorkoutProgramGenerator
 *
 * USER PROFILE -> GOAL ENGINE -> TRAINING LEVEL -> AVAILABILITY ->
 * EQUIPMENT -> CONSTRAINTS -> SPLIT ENGINE -> VOLUME/MOVEMENT ENGINE ->
 * SELECTION -> PRESCRIPTION -> SESSION GENERATOR -> VALIDATION
 *
 * This module decides WHAT the user trains. It never decides HOW they
 * progress (progressionEngine) or WHETHER the plan should change
 * (adaptationEngine) — those are separate engines, per spec section 2.
 */

import { getGoalProfile } from "./goalEngine.js";
import { getExperienceProfile } from "./experienceEngine.js";
import { buildSplit } from "./splitEngine.js";
import { computeWeeklyMuscleTargets, distributeVolumeAcrossWeek, computeSessionVolume } from "./volumeEngine.js";
import { generateSession } from "./sessionGenerator.js";
import { planWeeklyCardio } from "./cardioEngine.js";
import { validateSession, validateWeeklyVolume } from "./validationEngine.js";
import { getExerciseById } from "../data/exercises.js";

/**
 * profile: { goal, experience, days_per_week, session_duration_min,
 *            equipment: [...], preferences: {...}, constraints: {...} }
 */
export function generateProgram(profile) {
  const goalProfile = getGoalProfile(profile.goal);
  const experienceProfile = getExperienceProfile(profile.experience);
  const split = buildSplit({
    daysPerWeek: profile.days_per_week,
    experienceLevel: profile.experience,
    goal: profile.goal,
  });

  const weeklyTargets = computeWeeklyMuscleTargets({ experienceProfile, goalProfile });
  const allocation = distributeVolumeAcrossWeek({ splitDays: split.days, weeklyTargets });
  const volumeValidation = validateWeeklyVolume({ weeklyTargets, allocation });

  const userPrefs = {
    preferred: profile.preferences?.preferred_exercises || [],
    disliked: profile.preferences?.disliked_exercises || [],
    flagged_pain: profile.constraints?.exercise_restrictions || [],
  };

  const cardioPlan = planWeeklyCardio({
    goal: profile.goal,
    availableEquipment: profile.equipment,
    cardioPreference: profile.preferences?.cardio_preference || null,
    lowerBodyTrainingLoad: profile.days_per_week >= 5 ? "high" : "moderate",
    availableExtraMinutes: profile.session_duration_min >= 45 ? 15 : 0,
  });

  const trainingDays = split.days.filter((d) => d.session_type !== "rest");
  const stableSelections = {}; // pattern -> exercise_id, shared per day-slot across the week for exercise consistency

  const sessions = split.days.map((day) => {
    if (day.session_type === "rest") {
      return { day_index: day.day_index, session_type: "rest", is_rest_day: true, exercises: [] };
    }

    // Keep a stable per-session-type selection map so e.g. every "Push" day in the block uses the same primary lift.
    stableSelections[day.session_type] ??= {};

    let session = generateSession({
      dayIndex: day.day_index,
      sessionType: day.session_type,
      availableEquipment: profile.equipment,
      experienceProfile,
      goalProfile,
      goal: profile.goal,
      userPrefs,
      stableSelections: stableSelections[day.session_type],
      sessionDurationMinutes: profile.session_duration_min,
      cardioPlan: ["cutting", "endurance", "recomposition", "general_fitness"].includes(profile.goal) ? cardioPlan : null,
    });

    // Lock in this session's exercise choices so future weeks/sessions of the same type reuse them.
    stableSelections[day.session_type] = session.locked_selections;

    const validation = validateSession({
      session, experienceProfile, availableEquipment: profile.equipment, sessionDurationMinutes: profile.session_duration_min,
    });

    if (!validation.valid) {
      // PHASE 30: regenerate the affected portion once (retry without stable-lock, in case a locked
      // selection became invalid) rather than shipping an invalid session.
      session = generateSession({
        dayIndex: day.day_index, sessionType: day.session_type, availableEquipment: profile.equipment,
        experienceProfile, goalProfile, goal: profile.goal, userPrefs, stableSelections: {},
        sessionDurationMinutes: profile.session_duration_min, cardioPlan: null,
      });
      stableSelections[day.session_type] = session.locked_selections;
    }

    return { ...session, session_name: sessionLabel(day, split) };
  });

  return {
    program_id: `prog_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    user_id: profile.user_id,
    goal: profile.goal,
    experience: profile.experience,
    split_rationale: split.rationale,
    weekly_muscle_targets: weeklyTargets,
    weekly_volume_allocation: allocation,
    weekly_volume_validation: volumeValidation,
    cardio_plan: cardioPlan,
    week: 1,
    days: sessions,
  };
}

function sessionLabel(day, split) {
  const sameTypeDays = split.days.filter((d) => d.session_type === day.session_type && d.session_type !== "rest");
  if (sameTypeDays.length <= 1) return capitalize(day.session_type.replace("_", " "));
  const occurrence = sameTypeDays.findIndex((d) => d.day_index === day.day_index);
  const letter = String.fromCharCode(65 + occurrence);
  return `${capitalize(day.session_type.replace("_", " "))} ${letter}`;
}

function capitalize(s) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Recompute measured session-level volume for spot-checking against targets (spec section 7). */
export function measureSessionVolume(session) {
  if (session.is_rest_day) return {};
  const withExercises = session.exercises.map((e) => ({ sets: e.sets, exercise: getExerciseById(e.exercise_id) }));
  return computeSessionVolume(withExercises);
}
