/**
 * CLAWW — MOVEMENT PATTERN ENGINE
 *
 * Maps session types and muscle groups to functional movement patterns,
 * assigning structured roles (primary compound, secondary compound,
 * isolation, accessory, optional finisher).
 *
 * Conforms to Sections 4-7:
 * - 17 Standard Movement Patterns
 * - Exercise Roles
 * - Muscle-to-pattern mapping for split library & custom splits
 */

export const MOVEMENT_PATTERNS = [
  "horizontal_push",
  "vertical_push",
  "horizontal_pull",
  "vertical_pull",
  "squat",
  "hinge",
  "lunge",
  "knee_extension",
  "knee_flexion",
  "hip_extension",
  "shoulder_abduction",
  "elbow_flexion",
  "elbow_extension",
  "carry",
  "anti_extension_core",
  "anti_rotation_core",
  "spinal_flexion",
  "calf_plantar_flexion",
];

const MUSCLE_PRIMARY_PATTERNS = {
  chest: [
    { pattern: "horizontal_push", role: "primary", classification: "compound", programming_role: "primary_compound", sub_role: "flat" },
    { pattern: "horizontal_push", role: "secondary", classification: "compound", programming_role: "secondary_movement", sub_role: "incline" },
    { pattern: "horizontal_push", role: "isolation", classification: "isolation", programming_role: "isolation", sub_role: "fly" },
  ],
  back: [
    { pattern: "vertical_pull", role: "primary", classification: "compound", programming_role: "primary_compound", sub_role: "pulldown" },
    { pattern: "horizontal_pull", role: "secondary", classification: "compound", programming_role: "secondary_compound", sub_role: "row" },
    { pattern: "horizontal_pull", role: "secondary", classification: "compound", programming_role: "secondary_movement", sub_role: "cable_row" },
    { pattern: "rear_delt", role: "isolation", classification: "isolation", programming_role: "isolation", sub_role: "face_pull" },
  ],
  front_delts: [
    { pattern: "vertical_push", role: "secondary", classification: "compound", programming_role: "secondary_compound", sub_role: "overhead_press" },
  ],
  side_delts: [
    { pattern: "shoulder_abduction", role: "isolation", classification: "isolation", programming_role: "isolation", sub_role: "lateral_raise" },
    { pattern: "shoulder_abduction", role: "accessory", classification: "isolation", programming_role: "accessory", sub_role: "cable_raise" },
  ],
  rear_delts: [
    { pattern: "rear_delt", role: "isolation", classification: "isolation", programming_role: "isolation", sub_role: "rear_fly" },
  ],
  quads: [
    { pattern: "squat", role: "primary", classification: "compound", programming_role: "primary_compound", sub_role: "squat" },
    { pattern: "lunge", role: "secondary", classification: "compound", programming_role: "secondary_movement", sub_role: "split_squat" },
    { pattern: "knee_extension", role: "isolation", classification: "isolation", programming_role: "isolation", sub_role: "leg_ext" },
  ],
  hamstrings: [
    { pattern: "hinge", role: "primary", classification: "compound", programming_role: "primary_compound", sub_role: "rdl" },
    { pattern: "knee_flexion", role: "isolation", classification: "isolation", programming_role: "isolation", sub_role: "leg_curl" },
  ],
  glutes: [
    { pattern: "hip_extension", role: "secondary", classification: "compound", programming_role: "secondary_compound", sub_role: "hip_thrust" },
  ],
  calves: [
    { pattern: "calf_plantar_flexion", role: "accessory", classification: "isolation", programming_role: "accessory", sub_role: "calf_raise" },
  ],
  biceps: [
    { pattern: "elbow_flexion", role: "isolation", classification: "isolation", programming_role: "isolation", sub_role: "curl" },
    { pattern: "elbow_flexion", role: "accessory", classification: "isolation", programming_role: "accessory", sub_role: "incline_curl" },
  ],
  triceps: [
    { pattern: "elbow_extension", role: "isolation", classification: "isolation", programming_role: "isolation", sub_role: "pushdown" },
    { pattern: "elbow_extension", role: "accessory", classification: "isolation", programming_role: "accessory", sub_role: "overhead_ext" },
  ],
  core: [
    { pattern: "anti_extension_core", role: "accessory", classification: "accessory", programming_role: "accessory", sub_role: "core_hold" },
    { pattern: "spinal_flexion", role: "accessory", classification: "accessory", programming_role: "finisher", sub_role: "crunch" },
  ],
};

const SESSION_TYPE_PATTERNS = {
  full_body: [
    // Tier 1 (30m: 1-3)
    { pattern: "squat", role: "primary", classification: "compound", programming_role: "primary_compound", target_muscle: "quads" },
    { pattern: "horizontal_push", role: "secondary", classification: "compound", programming_role: "secondary_compound", target_muscle: "chest" },
    { pattern: "vertical_pull", role: "secondary", classification: "compound", programming_role: "secondary_compound", target_muscle: "back" },
    // Tier 2 (45-60m: 4-5)
    { pattern: "hinge", role: "secondary", classification: "compound", programming_role: "secondary_movement", target_muscle: "hamstrings" },
    { pattern: "shoulder_abduction", role: "isolation", classification: "isolation", programming_role: "isolation", target_muscle: "side_delts" },
    // Tier 3 (75m: 6)
    { pattern: "elbow_extension", role: "isolation", classification: "isolation", programming_role: "isolation", target_muscle: "triceps" },
    // Tier 4 (90m: 7-8)
    { pattern: "elbow_flexion", role: "isolation", classification: "isolation", programming_role: "accessory", target_muscle: "biceps" },
    { pattern: "anti_extension_core", role: "accessory", classification: "accessory", programming_role: "finisher", target_muscle: "core" },
  ],
  upper: [
    // Tier 1 (30m)
    { pattern: "horizontal_push", role: "primary", classification: "compound", programming_role: "primary_compound", target_muscle: "chest", sub_role: "flat" },
    { pattern: "horizontal_pull", role: "primary", classification: "compound", programming_role: "primary_compound", target_muscle: "back", sub_role: "row" },
    // Tier 2 (45-60m)
    { pattern: "vertical_push", role: "secondary", classification: "compound", programming_role: "secondary_compound", target_muscle: "front_delts", sub_role: "overhead" },
    { pattern: "vertical_pull", role: "secondary", classification: "compound", programming_role: "secondary_movement", target_muscle: "back", sub_role: "pulldown" },
    { pattern: "shoulder_abduction", role: "isolation", classification: "isolation", programming_role: "isolation", target_muscle: "side_delts", sub_role: "lateral_raise" },
    // Tier 3 (75m)
    { pattern: "elbow_flexion", role: "isolation", classification: "isolation", programming_role: "isolation", target_muscle: "biceps" },
    { pattern: "elbow_extension", role: "isolation", classification: "isolation", programming_role: "isolation", target_muscle: "triceps" },
    // Tier 4 (90m)
    { pattern: "rear_delt", role: "isolation", classification: "isolation", programming_role: "accessory", target_muscle: "rear_delts" },
  ],
  lower: [
    // Tier 1 (30m)
    { pattern: "squat", role: "primary", classification: "compound", programming_role: "primary_compound", target_muscle: "quads" },
    { pattern: "hinge", role: "primary", classification: "compound", programming_role: "primary_compound", target_muscle: "hamstrings" },
    // Tier 2 (45-60m)
    { pattern: "lunge", role: "secondary", classification: "compound", programming_role: "secondary_movement", target_muscle: "quads" },
    { pattern: "knee_flexion", role: "isolation", classification: "isolation", programming_role: "isolation", target_muscle: "hamstrings" },
    { pattern: "calf_plantar_flexion", role: "accessory", classification: "isolation", programming_role: "accessory", target_muscle: "calves" },
    // Tier 3 (75m)
    { pattern: "knee_extension", role: "isolation", classification: "isolation", programming_role: "isolation", target_muscle: "quads" },
    { pattern: "hip_extension", role: "secondary", classification: "compound", programming_role: "secondary_movement", target_muscle: "glutes" },
    // Tier 4 (90m)
    { pattern: "anti_extension_core", role: "accessory", classification: "accessory", programming_role: "finisher", target_muscle: "core" },
  ],
  push: [
    // Tier 1 (30m: 2-3)
    { pattern: "horizontal_push", role: "primary", classification: "compound", programming_role: "primary_compound", target_muscle: "chest", sub_role: "flat" },
    { pattern: "vertical_push", role: "secondary", classification: "compound", programming_role: "secondary_compound", target_muscle: "front_delts", sub_role: "overhead" },
    // Tier 2 (45-60m: 4-5)
    { pattern: "horizontal_push", role: "secondary", classification: "compound", programming_role: "secondary_movement", target_muscle: "chest", sub_role: "incline" },
    { pattern: "shoulder_abduction", role: "isolation", classification: "isolation", programming_role: "isolation", target_muscle: "side_delts", sub_role: "lateral_raise" },
    { pattern: "elbow_extension", role: "isolation", classification: "isolation", programming_role: "isolation", target_muscle: "triceps", sub_role: "pushdown" },
    // Tier 3 (75m: 6-7)
    { pattern: "horizontal_push", role: "isolation", classification: "isolation", programming_role: "isolation", target_muscle: "chest", sub_role: "fly" },
    { pattern: "elbow_extension", role: "isolation", classification: "isolation", programming_role: "accessory", target_muscle: "triceps", sub_role: "overhead_ext" },
    // Tier 4 (90m: 8)
    { pattern: "shoulder_abduction", role: "accessory", classification: "isolation", programming_role: "finisher", target_muscle: "side_delts", sub_role: "cable_raise" },
  ],
  pull: [
    // Tier 1 (30m)
    { pattern: "vertical_pull", role: "primary", classification: "compound", programming_role: "primary_compound", target_muscle: "back", sub_role: "pulldown" },
    { pattern: "horizontal_pull", role: "secondary", classification: "compound", programming_role: "secondary_compound", target_muscle: "back", sub_role: "row" },
    // Tier 2 (45-60m)
    { pattern: "horizontal_pull", role: "secondary", classification: "compound", programming_role: "secondary_movement", target_muscle: "back", sub_role: "cable_row" },
    { pattern: "rear_delt", role: "isolation", classification: "isolation", programming_role: "isolation", target_muscle: "rear_delts", sub_role: "face_pull" },
    { pattern: "elbow_flexion", role: "isolation", classification: "isolation", programming_role: "isolation", target_muscle: "biceps", sub_role: "curl" },
    // Tier 3 (75m)
    { pattern: "elbow_flexion", role: "isolation", classification: "isolation", programming_role: "accessory", target_muscle: "biceps", sub_role: "incline_curl" },
    { pattern: "vertical_pull", role: "isolation", classification: "isolation", programming_role: "isolation", target_muscle: "back", sub_role: "straight_arm" },
    // Tier 4 (90m)
    { pattern: "rear_delt", role: "accessory", classification: "isolation", programming_role: "finisher", target_muscle: "rear_delts" },
  ],
  legs: [
    // Tier 1 (30m)
    { pattern: "squat", role: "primary", classification: "compound", programming_role: "primary_compound", target_muscle: "quads" },
    { pattern: "hinge", role: "primary", classification: "compound", programming_role: "primary_compound", target_muscle: "hamstrings" },
    // Tier 2 (45-60m)
    { pattern: "lunge", role: "secondary", classification: "compound", programming_role: "secondary_movement", target_muscle: "quads" },
    { pattern: "knee_flexion", role: "isolation", classification: "isolation", programming_role: "isolation", target_muscle: "hamstrings" },
    { pattern: "calf_plantar_flexion", role: "accessory", classification: "isolation", programming_role: "accessory", target_muscle: "calves" },
    // Tier 3 (75m)
    { pattern: "knee_extension", role: "isolation", classification: "isolation", programming_role: "isolation", target_muscle: "quads" },
    { pattern: "hip_extension", role: "secondary", classification: "compound", programming_role: "secondary_movement", target_muscle: "glutes" },
    // Tier 4 (90m)
    { pattern: "anti_extension_core", role: "accessory", classification: "accessory", programming_role: "finisher", target_muscle: "core" },
  ],
  chest: [
    // Dedicated chest day (Section 27.4: no 4 identical flat presses!)
    { pattern: "horizontal_push", role: "primary", classification: "compound", programming_role: "primary_compound", target_muscle: "chest", sub_role: "flat" },
    { pattern: "horizontal_push", role: "secondary", classification: "compound", programming_role: "secondary_movement", target_muscle: "chest", sub_role: "incline" },
    { pattern: "horizontal_push", role: "isolation", classification: "isolation", programming_role: "isolation", target_muscle: "chest", sub_role: "fly" },
    { pattern: "elbow_extension", role: "isolation", classification: "isolation", programming_role: "isolation", target_muscle: "triceps", sub_role: "pushdown" },
    { pattern: "elbow_extension", role: "accessory", classification: "isolation", programming_role: "accessory", target_muscle: "triceps", sub_role: "overhead_ext" },
    { pattern: "shoulder_abduction", role: "accessory", classification: "isolation", programming_role: "accessory", target_muscle: "side_delts" },
  ],
  back: [
    { pattern: "vertical_pull", role: "primary", classification: "compound", programming_role: "primary_compound", target_muscle: "back", sub_role: "pulldown" },
    { pattern: "horizontal_pull", role: "secondary", classification: "compound", programming_role: "secondary_compound", target_muscle: "back", sub_role: "row" },
    { pattern: "horizontal_pull", role: "secondary", classification: "compound", programming_role: "secondary_movement", target_muscle: "back", sub_role: "cable_row" },
    { pattern: "rear_delt", role: "isolation", classification: "isolation", programming_role: "isolation", target_muscle: "rear_delts" },
    { pattern: "elbow_flexion", role: "isolation", classification: "isolation", programming_role: "isolation", target_muscle: "biceps", sub_role: "curl" },
    { pattern: "vertical_pull", role: "isolation", classification: "isolation", programming_role: "isolation", target_muscle: "back", sub_role: "straight_arm" },
  ],
  shoulders: [
    { pattern: "vertical_push", role: "primary", classification: "compound", programming_role: "primary_compound", target_muscle: "front_delts" },
    { pattern: "shoulder_abduction", role: "isolation", classification: "isolation", programming_role: "isolation", target_muscle: "side_delts", sub_role: "lateral_raise" },
    { pattern: "rear_delt", role: "isolation", classification: "isolation", programming_role: "isolation", target_muscle: "rear_delts" },
    { pattern: "shoulder_abduction", role: "isolation", classification: "isolation", programming_role: "accessory", target_muscle: "side_delts", sub_role: "cable_raise" },
    { pattern: "elbow_extension", role: "accessory", classification: "isolation", programming_role: "accessory", target_muscle: "triceps" },
  ],
  arms: [
    { pattern: "elbow_extension", role: "primary", classification: "compound", programming_role: "primary_compound", target_muscle: "triceps", sub_role: "close_grip" },
    { pattern: "elbow_flexion", role: "primary", classification: "isolation", programming_role: "primary_compound", target_muscle: "biceps", sub_role: "heavy_curl" },
    { pattern: "elbow_extension", role: "isolation", classification: "isolation", programming_role: "isolation", target_muscle: "triceps", sub_role: "pushdown" },
    { pattern: "elbow_flexion", role: "isolation", classification: "isolation", programming_role: "isolation", target_muscle: "biceps", sub_role: "incline_curl" },
    { pattern: "elbow_extension", role: "isolation", classification: "isolation", programming_role: "accessory", target_muscle: "triceps", sub_role: "overhead_ext" },
    { pattern: "elbow_flexion", role: "accessory", classification: "isolation", programming_role: "finisher", target_muscle: "biceps", sub_role: "hammer_curl" },
  ],
  chest_back: [
    { pattern: "horizontal_push", role: "primary", classification: "compound", programming_role: "primary_compound", target_muscle: "chest", sub_role: "flat" },
    { pattern: "vertical_pull", role: "primary", classification: "compound", programming_role: "primary_compound", target_muscle: "back", sub_role: "pulldown" },
    { pattern: "horizontal_push", role: "secondary", classification: "compound", programming_role: "secondary_movement", target_muscle: "chest", sub_role: "incline" },
    { pattern: "horizontal_pull", role: "secondary", classification: "compound", programming_role: "secondary_compound", target_muscle: "back", sub_role: "row" },
    { pattern: "horizontal_push", role: "isolation", classification: "isolation", programming_role: "isolation", target_muscle: "chest", sub_role: "fly" },
    { pattern: "vertical_pull", role: "isolation", classification: "isolation", programming_role: "isolation", target_muscle: "back", sub_role: "straight_arm" },
  ],
  shoulders_arms: [
    { pattern: "vertical_push", role: "primary", classification: "compound", programming_role: "primary_compound", target_muscle: "front_delts" },
    { pattern: "shoulder_abduction", role: "isolation", classification: "isolation", programming_role: "isolation", target_muscle: "side_delts" },
    { pattern: "elbow_flexion", role: "isolation", classification: "isolation", programming_role: "isolation", target_muscle: "biceps" },
    { pattern: "elbow_extension", role: "isolation", classification: "isolation", programming_role: "isolation", target_muscle: "triceps" },
    { pattern: "rear_delt", role: "isolation", classification: "isolation", programming_role: "accessory", target_muscle: "rear_delts" },
    { pattern: "elbow_extension", role: "accessory", classification: "isolation", programming_role: "accessory", target_muscle: "triceps", sub_role: "overhead_ext" },
  ],
  quads_focus: [
    { pattern: "squat", role: "primary", classification: "compound", programming_role: "primary_compound", target_muscle: "quads" },
    { pattern: "lunge", role: "secondary", classification: "compound", programming_role: "secondary_movement", target_muscle: "quads" },
    { pattern: "knee_extension", role: "isolation", classification: "isolation", programming_role: "isolation", target_muscle: "quads" },
    { pattern: "calf_plantar_flexion", role: "accessory", classification: "isolation", programming_role: "accessory", target_muscle: "calves" },
    { pattern: "anti_extension_core", role: "accessory", classification: "accessory", programming_role: "finisher", target_muscle: "core" },
  ],
  posterior_focus: [
    { pattern: "hinge", role: "primary", classification: "compound", programming_role: "primary_compound", target_muscle: "hamstrings" },
    { pattern: "hip_extension", role: "primary", classification: "compound", programming_role: "secondary_compound", target_muscle: "glutes" },
    { pattern: "knee_flexion", role: "isolation", classification: "isolation", programming_role: "isolation", target_muscle: "hamstrings" },
    { pattern: "calf_plantar_flexion", role: "accessory", classification: "isolation", programming_role: "accessory", target_muscle: "calves" },
  ],
  conditioning: [
    { pattern: "anti_extension_core", role: "primary", classification: "accessory", programming_role: "accessory", target_muscle: "core" },
    { pattern: "spinal_flexion", role: "secondary", classification: "accessory", programming_role: "accessory", target_muscle: "core" },
    { pattern: "cardio", role: "accessory", classification: "cardio", programming_role: "finisher" },
  ],
};

/**
 * Returns required patterns for a given session type or custom emphasis muscles,
 * scaling appropriately according to available duration and experience level.
 */
export function getRequiredPatterns(sessionType, emphasisMuscles = [], options = {}) {
  // If first argument is an object options bundle:
  if (typeof sessionType === "object" && sessionType !== null) {
    const opts = sessionType;
    return getRequiredPatterns(opts.sessionType, opts.emphasisMuscles, {
      duration: opts.duration ?? opts.sessionDurationMinutes,
      experience: opts.experience ?? opts.experienceLevel,
      priorityMuscles: opts.priorityMuscles,
    });
  }

  const duration = options.duration ?? options.sessionDurationMinutes ?? 60;
  const experience = options.experience ?? options.experienceLevel ?? "intermediate";
  const priorityMuscles = (options.priorityMuscles || []).map((m) => m.toLowerCase());

  // Determine target exercise pattern count based on duration:
  // 30m: 2-3 exercises
  // 45m: 4 exercises
  // 60m: 5 exercises
  // 75m: 6-7 exercises
  // 90m: 7-8 exercises
  let targetCount = 5;
  if (duration <= 35) targetCount = 3;
  else if (duration <= 50) targetCount = 4;
  else if (duration <= 65) targetCount = 5;
  else if (duration <= 80) targetCount = 6;
  else targetCount = 7;

  // Advanced users with >= 60 min can handle 1 additional specialized accessory
  if (experience === "advanced" && duration >= 60 && targetCount < 8) {
    targetCount = Math.min(8, targetCount + 1);
  }

  // Beginner trainees are capped at 4 exercises max
  if (experience === "beginner" && targetCount > 4) {
    targetCount = 4;
  }

  let baseList = [];

  // Check if standard template exists and it's not a custom split
  if (SESSION_TYPE_PATTERNS[sessionType] && sessionType !== "custom") {
    baseList = [...SESSION_TYPE_PATTERNS[sessionType]];
  } else if (emphasisMuscles && emphasisMuscles.length > 0) {
    // Custom split day: derive patterns from emphasis muscles
    const derived = [];
    const usedKeys = new Set();

    for (const muscle of emphasisMuscles) {
      const candidates = MUSCLE_PRIMARY_PATTERNS[muscle] || [];
      for (const cand of candidates) {
        const key = `${cand.pattern}_${cand.sub_role || ""}_${muscle}`;
        if (!usedKeys.has(key)) {
          derived.push({
            ...cand,
            target_muscle: muscle,
          });
          usedKeys.add(key);
        }
      }
    }

    baseList = derived.length > 0 ? derived : [...SESSION_TYPE_PATTERNS.full_body];
  } else {
    baseList = [...SESSION_TYPE_PATTERNS.full_body];
  }

  // If priority muscles are present and hit this session, prioritize those patterns
  if (priorityMuscles.length > 0) {
    baseList.sort((a, b) => {
      const aHits = priorityMuscles.includes((a.target_muscle || "").toLowerCase());
      const bHits = priorityMuscles.includes((b.target_muscle || "").toLowerCase());
      if (aHits && !bHits) return -1;
      if (!aHits && bHits) return 1;
      return 0;
    });
  }

  // Slice to duration target count, protecting at least 2 primary/secondary patterns
  const finalPatterns = baseList.slice(0, Math.max(2, Math.min(baseList.length, targetCount)));

  // Ensure every item has both classification and programming_role
  return finalPatterns.map((item, idx) => ({
    ...item,
    classification: item.classification || (item.role === "primary" ? "compound" : "isolation"),
    programming_role: item.programming_role || (
      idx === 0 && item.role === "primary" ? "primary_compound" :
      item.role === "secondary" && item.classification === "compound" ? "secondary_compound" :
      item.role === "isolation" ? "isolation" : "accessory"
    ),
  }));
}

