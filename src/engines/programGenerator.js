/**
 * CLAWW — WORKOUT PROGRAM GENERATOR (ORCHESTRATOR)
 *
 * Core Flow:
 * USER INPUT -> TRAINING DAYS -> SPLIT LIBRARY / CUSTOM SPLIT -> TRAINING GOAL ->
 * EXPERIENCE -> EQUIPMENT -> SESSION DURATION -> MUSCLE PRIORITIES -> CONSTRAINTS ->
 * WORKOUT COMPOSITION ENGINE -> FINAL WORKOUT
 *
 * Conforms to:
 *  - Section 1: Split library
 *  - Section 2: Custom split builder
 *  - Section 7-10: Composition, ordering, volume & muscle priorities
 *  - Section 14: Duration budgeting
 *  - Section 17: Workout data display
 *  - Section 18: Quality validation & retry
 *  - Section 20: Decoupled workout plan generation (ready for future logging/adaptation)
 */

import { getGoalProfile } from "./goalEngine.js";
import { getExperienceProfile } from "./experienceEngine.js";
import { buildSplit } from "./splitEngine.js";
import {
  computeWeeklyMuscleTargets,
  distributeVolumeAcrossWeek,
  computeSessionVolume,
  computeWeeklyVolumeSummary,
} from "./volumeEngine.js";
import { generateSession } from "./sessionGenerator.js";
import { planWeeklyCardio } from "./cardioEngine.js";
import { validateSession, validateWeeklyVolume, validateProgramRecovery } from "./validationEngine.js";
import { getExerciseById, resolveEquipmentPreset } from "../data/exercises.js";

/**
 * Generates a high-level personalized workout program without forcing a split.
 */
export function generateProgram(profile) {
  const goalProfile = getGoalProfile(profile.goal || "general_fitness");
  const experienceProfile = getExperienceProfile(profile.experience || "beginner");

  const equipment = profile.equipment_preset
    ? profile.equipment_preset
    : (profile.equipment || "full_gym");
  const priorityMuscles = profile.priority_muscles || [];
  const sessionDurationMinutes = profile.session_duration_min || 60;

  // 1. Build Split (user selected template or custom split)
  const split = buildSplit({
    daysPerWeek: profile.days_per_week || 3,
    splitId: profile.split_id || null,
    customSplit: profile.custom_split || null,
    experienceLevel: profile.experience,
    goal: goalProfile.goal,
  });

  // 2. Volume targets & distribution
  const weeklyTargets = computeWeeklyMuscleTargets({
    experienceProfile,
    goalProfile,
    priorityMuscles,
  });
  const allocation = distributeVolumeAcrossWeek({ splitDays: split.days, weeklyTargets });
  const volumeValidation = validateWeeklyVolume({ weeklyTargets, allocation });

  // 3. User Preferences & Constraints
  const userPrefs = {
    preferred: profile.preferences?.preferred_exercises || [],
    disliked: profile.preferences?.disliked_exercises || [],
    flagged_pain: profile.constraints?.exercise_restrictions || profile.constraints?.injuries || [],
  };

  // 4. Cardio Planning
  const cardioPlan = planWeeklyCardio({
    goal: goalProfile.goal,
    availableEquipment: resolveEquipmentPreset(equipment),
    cardioPreference: profile.preferences?.cardio_preference || null,
    lowerBodyTrainingLoad: split.daysPerWeek >= 5 ? "high" : "moderate",
    availableExtraMinutes: sessionDurationMinutes >= 45 ? 15 : 0,
  });

  // 5. Generate Sessions across the 7-day schedule
  const stableSelections = {};

  const sessions = split.days.map((day) => {
    if (day.session_type === "rest") {
      return {
        day_index: day.day_index,
        session_type: "rest",
        session_name: day.name || "Rest Day",
        is_rest_day: true,
        exercises: [],
      };
    }

    stableSelections[day.session_type] ??= {};

    let session = generateSession({
      dayIndex: day.day_index,
      sessionType: day.session_type,
      emphasisMuscles: day.emphasis_muscles || [],
      availableEquipment: equipment,
      experienceProfile,
      goalProfile,
      goal: goalProfile.goal,
      priorityMuscles,
      userPrefs,
      stableSelections: stableSelections[day.session_type],
      sessionDurationMinutes,
      cardioPlan: ["cutting", "fat_loss", "endurance", "recomposition", "general_fitness"].includes(goalProfile.goal)
        ? cardioPlan
        : null,
    });

    stableSelections[day.session_type] = session.locked_selections;

    // Validate generated session
    const validation = validateSession({
      session,
      experienceProfile,
      availableEquipment: equipment,
      sessionDurationMinutes,
    });

    // If validation failed, regenerate once without locked selections
    if (!validation.valid) {
      session = generateSession({
        dayIndex: day.day_index,
        sessionType: day.session_type,
        emphasisMuscles: day.emphasis_muscles || [],
        availableEquipment: equipment,
        experienceProfile,
        goalProfile,
        goal: goalProfile.goal,
        priorityMuscles,
        userPrefs,
        stableSelections: {},
        sessionDurationMinutes,
        cardioPlan: null,
      });
      stableSelections[day.session_type] = session.locked_selections;
    }

    const sessionTitle = day.name || sessionLabel(day, split);
    const sessionVolume = computeSessionVolume(session.exercises || []);

    return {
      ...session,
      day: day.day_index,
      title: sessionTitle,
      session_name: sessionTitle,
      targetMuscles: day.emphasis_muscles || [],
      target_muscles: day.emphasis_muscles || [],
      emphasis_muscles: day.emphasis_muscles || [],
      effectiveVolume: sessionVolume.effective,
      session_volume: sessionVolume,
    };
  });

  // 6. Compute weekly volume summary
  const weeklyVolumeSummary = computeWeeklyVolumeSummary(sessions);

  const program = {
    program_id: `prog_${profile.user_id || "trainee"}_${split.split_id}_${profile.experience || "beginner"}_${sessionDurationMinutes}m`,
    user_id: profile.user_id || "anonymous_trainee",
    goal: goalProfile.goal,
    raw_goal: profile.goal || goalProfile.goal,
    experience: profile.experience || "beginner",
    frequency: split.daysPerWeek,
    days_per_week: split.daysPerWeek,
    split: split.name || "Custom Split",
    split_id: split.split_id || "standard",
    split_name: split.name || "Custom Split",
    split_rationale: split.rationale,
    is_custom_split: Boolean(split.is_custom),
    equipment,
    duration: sessionDurationMinutes,
    session_duration_min: sessionDurationMinutes,
    priorityMuscles,
    priority_muscles: priorityMuscles,
    weeklySchedule: sessions,
    days: sessions,
    weekly_muscle_targets: weeklyTargets,
    weekly_volume_allocation: allocation,
    weekly_volume_validation: volumeValidation,
    weeklyVolume: weeklyVolumeSummary,
    weekly_volume_summary: weeklyVolumeSummary,
    progressionModel: experienceProfile.progression_name || "Double Progression",
    cardio_plan: cardioPlan,
    generationMetadata: {
      generated_at: new Date().toISOString(),
      engine_version: "2.5.0",
      deterministic: true,
    },
    week: 1,
  };

  program.recovery_validation = validateProgramRecovery(program);

  return program;
}


function sessionLabel(day, split) {
  const sameTypeDays = split.days.filter((d) => d.session_type === day.session_type && d.session_type !== "rest");
  if (sameTypeDays.length <= 1) return capitalize(day.session_type.replace(/_/g, " "));
  const occurrence = sameTypeDays.findIndex((d) => d.day_index === day.day_index);
  const letter = String.fromCharCode(65 + occurrence);
  return `${capitalize(day.session_type.replace(/_/g, " "))} ${letter}`;
}

function capitalize(s) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function measureSessionVolume(session) {
  if (session.is_rest_day) return {};
  const withExercises = (session.exercises || []).map((e) => ({
    sets: e.sets,
    exercise: getExerciseById(e.exercise_id),
  }));
  return computeSessionVolume(withExercises);
}
