/**
 * CLAWW — EXERCISE SELECTION ENGINE
 *
 * Selects recognizable, high-value gym exercises based on:
 *  - Functional movement pattern
 *  - Exercise role (primary compound, secondary compound, isolation, accessory)
 *  - Equipment constraints (presets or custom)
 *  - Experience technical-demand ceiling
 *  - Training Goal (strength favors high loading potential; hypertrophy favors high stimulus; etc.)
 *  - Trainee Muscle Priorities (promotes priority muscles earlier and scores them higher)
 *  - User preferences (preferred, disliked, flagged-pain)
 *  - Program Stability (consistency across the training block)
 */

import { EXERCISES, resolveEquipmentPreset } from "../data/exercises.js";

// Pattern alias mapper for flexibility between standardized names
const PATTERN_ALIASES = {
  hinge: ["hinge", "hip_hinge"],
  hip_hinge: ["hinge", "hip_hinge"],
  shoulder_abduction: ["shoulder_abduction", "lateral_raise"],
  lateral_raise: ["shoulder_abduction", "lateral_raise"],
  calf_plantar_flexion: ["calf_plantar_flexion", "calves"],
  calves: ["calf_plantar_flexion", "calves"],
  anti_extension_core: ["anti_extension_core", "core"],
  spinal_flexion: ["spinal_flexion", "core"],
  core: ["anti_extension_core", "spinal_flexion", "core"],
};

function matchesPattern(exercisePattern, requestedPattern) {
  if (exercisePattern === requestedPattern) return true;
  const aliases = PATTERN_ALIASES[requestedPattern];
  return aliases ? aliases.includes(exercisePattern) : false;
}

function equipmentAvailable(exercise, availableEquipment) {
  const resolved = resolveEquipmentPreset(availableEquipment);
  return exercise.equipment.some((eq) => resolved.includes(eq));
}

function scoreExercise(e, { role, sub_role, disliked, userPrefs, goal, priorityMuscles = [], experienceLevel = "intermediate" }) {
  let score = 0;

  // 1. Role alignment
  if (role === "primary") {
    score += e.classification === "compound" ? 8 : 0;
    if (e.loading_potential === "high") score += 3;
  } else if (role === "secondary") {
    score += e.classification === "compound" ? 4 : 2;
  } else if (role === "isolation" || role === "accessory") {
    score += e.classification === "isolation" || e.classification === "accessory" ? 4 : 0;
    // Lower fatigue cost is preferred for accessory work
    score -= (e.fatigue_cost || 2) * 0.4;
  }

  // 2. Sub-role alignment (prevents redundant exercises like 4 flat presses)
  if (sub_role) {
    const id = e.exercise_id;
    if (sub_role === "incline" && id.includes("incline")) score += 12;
    else if (sub_role === "flat" && (id === "bb_bench_press" || id === "db_bench_press" || id === "machine_chest_press")) score += 8;
    else if (sub_role === "fly" && (id === "cable_fly" || id === "pec_deck")) score += 12;
    else if (sub_role === "pushdown" && (id.includes("pushdown") || id.includes("rope"))) score += 10;
    else if (sub_role === "overhead_ext" && id.includes("overhead")) score += 12;
    else if (sub_role === "pulldown" && (id === "lat_pulldown" || id === "pullup")) score += 10;
    else if (sub_role === "row" && (id === "bb_bent_over_row" || id === "db_row" || id === "chest_supported_db_row")) score += 10;
    else if (sub_role === "cable_row" && id === "seated_cable_row") score += 12;
    else if (sub_role === "face_pull" && id === "face_pull") score += 12;
    else if (sub_role === "curl" && (id === "bb_bicep_curl" || id === "db_bicep_curl" || id === "cable_bicep_curl")) score += 8;
    else if (sub_role === "incline_curl" && id === "incline_db_curl") score += 12;
    else if (sub_role === "hammer_curl" && id === "hammer_curl") score += 12;
    else if (sub_role === "squat" && (id === "bb_back_squat" || id === "leg_press" || id === "goblet_squat")) score += 10;
    else if (sub_role === "split_squat" && (id === "bulgarian_split_squat" || id === "walking_lunge")) score += 12;
    else if (sub_role === "leg_ext" && id === "leg_extension") score += 12;
    else if (sub_role === "leg_curl" && (id === "lying_leg_curl" || id === "seated_leg_curl")) score += 12;
    else if (sub_role === "rdl" && (id === "romanian_deadlift" || id === "db_romanian_deadlift")) score += 12;
    else if (sub_role === "hip_thrust" && (id === "barbell_hip_thrust" || id === "glute_bridge")) score += 12;
    else if (sub_role === "lateral_raise" && (id === "db_lateral_raise" || id === "cable_lateral_raise")) score += 10;
    else if (sub_role === "cable_raise" && id === "cable_lateral_raise") score += 14;
    else if (sub_role === "straight_arm" && id === "straight_arm_lat_pulldown") score += 14;
  }

  // 3. Experience differentiation
  if (experienceLevel === "beginner") {
    // Beginners favor stability, fixed path machines, and simple dumbbell exercises
    if (e.equipment.includes("machine") || e.equipment.includes("cable") || e.stability === "high") {
      score += 4;
    }
    if (e.difficulty >= 3 || e.technical_demand >= 3) {
      score -= 5;
    }
  } else if (experienceLevel === "intermediate") {
    // Intermediates favor classic foundational free-weight compounds
    if (e.loading_potential === "high" && e.classification === "compound") {
      score += 3;
    }
  } else if (experienceLevel === "advanced") {
    // Advanced trainees favor high stimulus-to-fatigue ratio, lengthened-position bias, and regional targeting
    const advancedFavored = [
      "incline_db_press", "romanian_deadlift", "bulgarian_split_squat",
      "overhead_cable_tricep_ext", "incline_db_curl", "cable_lateral_raise",
      "chest_supported_db_row", "leg_extension", "lying_leg_curl"
    ];
    if (advancedFavored.includes(e.exercise_id)) {
      score += 6;
    }
    if (e.unilateral) {
      score += 2;
    }
    if (e.difficulty >= 4) {
      score += 2;
    }
  }

  // 4. Goal alignment
  const goals = e.training_goals || e.goal_tags || [];
  if (goals.includes(goal)) score += 4;
  if (goal === "strength" && e.loading_potential === "high") score += 4;
  if (goal === "hypertrophy" && (e.classification === "compound" || e.classification === "isolation")) score += 2;
  if (goal === "beginner_fitness" && e.difficulty <= 2) score += 4;

  // 5. Muscle Priority alignment (Section 27.7)
  const hitsPriority = priorityMuscles.some((m) =>
    (e.primary_muscles || []).includes(m) || (e.secondary_muscles || []).includes(m)
  );
  if (hitsPriority) {
    score += 8;
  }

  // 6. User Preferences
  if ((userPrefs.preferred || []).includes(e.exercise_id)) score += 5;
  if (disliked.has(e.exercise_id)) score -= 100;

  return score;
}

function candidatesForPattern({
  pattern,
  targetMuscle = null,
  role,
  sub_role = null,
  availableEquipment,
  experienceProfile,
  userPrefs,
  alreadyUsedIds,
  goal,
  priorityMuscles = [],
}) {
  const flaggedPain = new Set(userPrefs.flagged_pain || []);
  const disliked = new Set(userPrefs.disliked || []);
  const maxTech = experienceProfile.max_technical_demand || 4;
  const experienceLevel = experienceProfile.level || "intermediate";

  let pool = EXERCISES.filter((e) =>
    matchesPattern(e.movement_pattern, pattern) &&
    equipmentAvailable(e, availableEquipment) &&
    e.difficulty <= maxTech &&
    (e.technical_demand || e.difficulty) <= maxTech &&
    !flaggedPain.has(e.exercise_id) &&
    !alreadyUsedIds.has(e.exercise_id)
  );

  // If a target muscle is specified, prioritize exercises targeting it
  if (targetMuscle) {
    const matchingMuscle = pool.filter((e) => (e.primary_muscles || []).includes(targetMuscle));
    if (matchingMuscle.length > 0) pool = matchingMuscle;
  }

  return pool.map((e) => ({
    exercise: e,
    score: scoreExercise(e, { role, sub_role, disliked, userPrefs, goal, priorityMuscles, experienceLevel }),
  })).sort((a, b) => b.score - a.score);
}

/**
 * Select exercises for a training session respecting roles, priority muscles,
 * equipment, and program stability.
 */
export function selectExercisesForSession({
  requiredPatterns,
  availableEquipment,
  experienceProfile,
  userPrefs,
  goal,
  priorityMuscles = [],
  stableSelections = {},
}) {
  const selections = [];
  const used = new Set();

  for (const item of requiredPatterns) {
    const pattern = item.pattern;
    const role = item.role || "secondary";
    const sub_role = item.sub_role || null;
    const targetMuscle = item.target_muscle || null;
    const classification = item.classification || (role === "primary" ? "compound" : "isolation");
    const programming_role = item.programming_role || (
      role === "primary" ? "primary_compound" :
      role === "secondary" && classification === "compound" ? "secondary_compound" :
      role === "isolation" ? "isolation" : "accessory"
    );

    // Check for a stable selection from this training block
    const lockedId = stableSelections[pattern];
    if (lockedId) {
      const locked = EXERCISES.find((e) => e.exercise_id === lockedId);
      const stillValid = locked &&
        equipmentAvailable(locked, availableEquipment) &&
        !(userPrefs.flagged_pain || []).includes(locked.exercise_id) &&
        !used.has(locked.exercise_id);

      if (stillValid) {
        selections.push({
          pattern,
          role,
          sub_role,
          classification: locked.classification || classification,
          programming_role,
          exercise: locked,
          reason: `Kept from your current block — consistency is needed to measure progression on your ${locked.name}.`,
        });
        used.add(locked.exercise_id);
        continue;
      }
    }

    const ranked = candidatesForPattern({
      pattern,
      targetMuscle,
      role,
      sub_role,
      availableEquipment,
      experienceProfile,
      userPrefs,
      alreadyUsedIds: used,
      goal,
      priorityMuscles,
    });

    const choice = ranked[0];
    if (!choice) {
      selections.push({
        pattern,
        role,
        sub_role,
        classification,
        programming_role,
        exercise: null,
        reason: `No available exercise covers ${pattern.replace("_", " ")} with your current equipment.`,
      });
      continue;
    }

    selections.push({
      pattern,
      role,
      sub_role,
      classification: choice.exercise.classification || classification,
      programming_role,
      exercise: choice.exercise,
      reason: `Selected as your ${programming_role.replace("_", " ")} (${choice.exercise.name}) based on equipment, ${experienceProfile.level} experience, and ${goal.replace("_", " ")} goal.`,
    });
    used.add(choice.exercise.exercise_id);
  }

  return selections;
}

