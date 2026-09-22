/**
 * PHASE 1 — EXERCISE DATABASE
 *
 * Every exercise is structured data, never invented at runtime.
 * The LLM layer never generates exercises — it only explains choices
 * made by the engines below, using this table as ground truth.
 *
 * Fields (per spec section 9):
 *  exercise_id, name, category, movement_pattern, primary_muscles,
 *  secondary_muscles, equipment, experience_level, difficulty, stability,
 *  technical_demand, fatigue_cost, joint_stress_tags,
 *  recommended_rep_min/max, recommended_RIR, default_rest,
 *  goal_tags, substitution_group, unilateral, type (compound/isolation)
 *
 * fatigue_cost / technical_demand / stability / difficulty: 1 (low) - 5 (high).
 * These are internal ordering signals for exercise selection & superset
 * pairing — never surfaced to the user as fake precision scores.
 */

export const MUSCLES = [
  "chest", "back", "quads", "hamstrings", "glutes", "calves",
  "biceps", "triceps", "front_delts", "side_delts", "rear_delts", "core",
];

export const MOVEMENT_PATTERNS = [
  "horizontal_push", "horizontal_pull", "vertical_push", "vertical_pull",
  "elbow_flexion", "elbow_extension", "lateral_raise", "rear_delt",
  "squat", "hip_hinge", "knee_flexion", "hip_extension", "calves", "core",
];

export const EQUIPMENT = [
  "barbell", "dumbbell", "bench", "machine", "cable", "smith_machine",
  "bodyweight", "pull_up_bar", "kettlebell", "band", "bike", "treadmill",
];

export const EXERCISES = [
  // ---------------- HORIZONTAL PUSH ----------------
  {
    exercise_id: "bb_bench_press", name: "Barbell Bench Press", category: "chest",
    movement_pattern: "horizontal_push", primary_muscles: ["chest"], secondary_muscles: ["triceps", "front_delts"],
    equipment: ["barbell", "bench"], experience_level: "beginner", difficulty: 3, stability: 3, technical_demand: 3,
    fatigue_cost: 4, joint_stress_tags: ["shoulder", "wrist"], recommended_rep_min: 6, recommended_rep_max: 10,
    recommended_RIR: 2, default_rest: 180, goal_tags: ["hypertrophy", "strength"], substitution_group: "horizontal_push_chest_heavy",
    unilateral: false, type: "compound",
  },
  {
    exercise_id: "db_bench_press", name: "Dumbbell Bench Press", category: "chest",
    movement_pattern: "horizontal_push", primary_muscles: ["chest"], secondary_muscles: ["triceps", "front_delts"],
    equipment: ["dumbbell", "bench"], experience_level: "beginner", difficulty: 3, stability: 4, technical_demand: 2,
    fatigue_cost: 4, joint_stress_tags: ["shoulder"], recommended_rep_min: 6, recommended_rep_max: 10,
    recommended_RIR: 2, default_rest: 150, goal_tags: ["hypertrophy", "strength"], substitution_group: "horizontal_push_chest_heavy",
    unilateral: false, type: "compound",
  },
  {
    exercise_id: "smith_bench_press", name: "Smith Machine Bench Press", category: "chest",
    movement_pattern: "horizontal_push", primary_muscles: ["chest"], secondary_muscles: ["triceps", "front_delts"],
    equipment: ["smith_machine", "bench"], experience_level: "beginner", difficulty: 2, stability: 1, technical_demand: 1,
    fatigue_cost: 3, joint_stress_tags: ["shoulder"], recommended_rep_min: 6, recommended_rep_max: 10,
    recommended_RIR: 2, default_rest: 150, goal_tags: ["hypertrophy", "strength"], substitution_group: "horizontal_push_chest_heavy",
    unilateral: false, type: "compound",
  },
  {
    exercise_id: "machine_chest_press", name: "Machine Chest Press", category: "chest",
    movement_pattern: "horizontal_push", primary_muscles: ["chest"], secondary_muscles: ["triceps", "front_delts"],
    equipment: ["machine"], experience_level: "beginner", difficulty: 1, stability: 1, technical_demand: 1,
    fatigue_cost: 3, joint_stress_tags: [], recommended_rep_min: 8, recommended_rep_max: 12,
    recommended_RIR: 1, default_rest: 120, goal_tags: ["hypertrophy", "strength", "general_fitness"], substitution_group: "horizontal_push_chest_heavy",
    unilateral: false, type: "compound",
  },
  {
    exercise_id: "pushup", name: "Push-up", category: "chest",
    movement_pattern: "horizontal_push", primary_muscles: ["chest"], secondary_muscles: ["triceps", "front_delts", "core"],
    equipment: ["bodyweight"], experience_level: "beginner", difficulty: 1, stability: 3, technical_demand: 1,
    fatigue_cost: 2, joint_stress_tags: ["wrist"], recommended_rep_min: 8, recommended_rep_max: 20,
    recommended_RIR: 2, default_rest: 90, goal_tags: ["hypertrophy", "general_fitness", "endurance"], substitution_group: "horizontal_push_chest_heavy",
    unilateral: false, type: "compound",
  },
  {
    exercise_id: "incline_db_press", name: "Incline Dumbbell Press", category: "chest",
    movement_pattern: "horizontal_push", primary_muscles: ["chest"], secondary_muscles: ["front_delts", "triceps"],
    equipment: ["dumbbell", "bench"], experience_level: "intermediate", difficulty: 3, stability: 4, technical_demand: 2,
    fatigue_cost: 3, joint_stress_tags: ["shoulder"], recommended_rep_min: 8, recommended_rep_max: 12,
    recommended_RIR: 2, default_rest: 120, goal_tags: ["hypertrophy"], substitution_group: "horizontal_push_chest_secondary",
    unilateral: false, type: "compound",
  },
  {
    exercise_id: "cable_fly", name: "Cable Fly", category: "chest",
    movement_pattern: "horizontal_push", primary_muscles: ["chest"], secondary_muscles: [],
    equipment: ["cable"], experience_level: "beginner", difficulty: 1, stability: 2, technical_demand: 2,
    fatigue_cost: 1, joint_stress_tags: ["shoulder"], recommended_rep_min: 12, recommended_rep_max: 20,
    recommended_RIR: 1, default_rest: 75, goal_tags: ["hypertrophy"], substitution_group: "chest_isolation",
    unilateral: false, type: "isolation",
  },

  // ---------------- VERTICAL PUSH ----------------
  {
    exercise_id: "ohp_barbell", name: "Barbell Overhead Press", category: "shoulders",
    movement_pattern: "vertical_push", primary_muscles: ["front_delts"], secondary_muscles: ["triceps", "side_delts"],
    equipment: ["barbell"], experience_level: "intermediate", difficulty: 3, stability: 3, technical_demand: 3,
    fatigue_cost: 4, joint_stress_tags: ["shoulder", "lower_back"], recommended_rep_min: 5, recommended_rep_max: 8,
    recommended_RIR: 2, default_rest: 180, goal_tags: ["strength", "hypertrophy"], substitution_group: "vertical_push_heavy",
    unilateral: false, type: "compound",
  },
  {
    exercise_id: "db_shoulder_press", name: "Dumbbell Shoulder Press", category: "shoulders",
    movement_pattern: "vertical_push", primary_muscles: ["front_delts"], secondary_muscles: ["triceps", "side_delts"],
    equipment: ["dumbbell"], experience_level: "beginner", difficulty: 2, stability: 3, technical_demand: 2,
    fatigue_cost: 3, joint_stress_tags: ["shoulder"], recommended_rep_min: 8, recommended_rep_max: 12,
    recommended_RIR: 2, default_rest: 120, goal_tags: ["strength", "hypertrophy"], substitution_group: "vertical_push_heavy",
    unilateral: false, type: "compound",
  },
  {
    exercise_id: "machine_shoulder_press", name: "Machine Shoulder Press", category: "shoulders",
    movement_pattern: "vertical_push", primary_muscles: ["front_delts"], secondary_muscles: ["triceps", "side_delts"],
    equipment: ["machine"], experience_level: "beginner", difficulty: 1, stability: 1, technical_demand: 1,
    fatigue_cost: 2, joint_stress_tags: [], recommended_rep_min: 8, recommended_rep_max: 12,
    recommended_RIR: 1, default_rest: 120, goal_tags: ["strength", "hypertrophy", "general_fitness"], substitution_group: "vertical_push_heavy",
    unilateral: false, type: "compound",
  },
  {
    exercise_id: "pike_pushup", name: "Pike Push-up", category: "shoulders",
    movement_pattern: "vertical_push", primary_muscles: ["front_delts"], secondary_muscles: ["triceps"],
    equipment: ["bodyweight"], experience_level: "beginner", difficulty: 2, stability: 3, technical_demand: 2,
    fatigue_cost: 2, joint_stress_tags: ["wrist", "shoulder"], recommended_rep_min: 6, recommended_rep_max: 15,
    recommended_RIR: 2, default_rest: 90, goal_tags: ["general_fitness", "hypertrophy"], substitution_group: "vertical_push_heavy",
    unilateral: false, type: "compound",
  },
  {
    exercise_id: "cable_lateral_raise", name: "Cable Lateral Raise", category: "shoulders",
    movement_pattern: "lateral_raise", primary_muscles: ["side_delts"], secondary_muscles: [],
    equipment: ["cable"], experience_level: "beginner", difficulty: 1, stability: 2, technical_demand: 2,
    fatigue_cost: 1, joint_stress_tags: ["shoulder"], recommended_rep_min: 12, recommended_rep_max: 20,
    recommended_RIR: 1, default_rest: 60, goal_tags: ["hypertrophy"], substitution_group: "lateral_raise",
    unilateral: false, type: "isolation",
  },
  {
    exercise_id: "db_lateral_raise", name: "Dumbbell Lateral Raise", category: "shoulders",
    movement_pattern: "lateral_raise", primary_muscles: ["side_delts"], secondary_muscles: [],
    equipment: ["dumbbell"], experience_level: "beginner", difficulty: 1, stability: 2, technical_demand: 1,
    fatigue_cost: 1, joint_stress_tags: ["shoulder"], recommended_rep_min: 12, recommended_rep_max: 20,
    recommended_RIR: 1, default_rest: 60, goal_tags: ["hypertrophy"], substitution_group: "lateral_raise",
    unilateral: false, type: "isolation",
  },
  {
    exercise_id: "machine_lateral_raise", name: "Machine Lateral Raise", category: "shoulders",
    movement_pattern: "lateral_raise", primary_muscles: ["side_delts"], secondary_muscles: [],
    equipment: ["machine"], experience_level: "beginner", difficulty: 1, stability: 1, technical_demand: 1,
    fatigue_cost: 1, joint_stress_tags: [], recommended_rep_min: 12, recommended_rep_max: 20,
    recommended_RIR: 1, default_rest: 60, goal_tags: ["hypertrophy"], substitution_group: "lateral_raise",
    unilateral: false, type: "isolation",
  },
  {
    exercise_id: "rear_delt_fly_cable", name: "Cable Rear Delt Fly", category: "shoulders",
    movement_pattern: "rear_delt", primary_muscles: ["rear_delts"], secondary_muscles: ["back"],
    equipment: ["cable"], experience_level: "beginner", difficulty: 1, stability: 2, technical_demand: 2,
    fatigue_cost: 1, joint_stress_tags: [], recommended_rep_min: 12, recommended_rep_max: 20,
    recommended_RIR: 1, default_rest: 60, goal_tags: ["hypertrophy"], substitution_group: "rear_delt",
    unilateral: false, type: "isolation",
  },
  {
    exercise_id: "rear_delt_fly_db", name: "Dumbbell Rear Delt Fly", category: "shoulders",
    movement_pattern: "rear_delt", primary_muscles: ["rear_delts"], secondary_muscles: ["back"],
    equipment: ["dumbbell"], experience_level: "beginner", difficulty: 1, stability: 2, technical_demand: 1,
    fatigue_cost: 1, joint_stress_tags: [], recommended_rep_min: 12, recommended_rep_max: 20,
    recommended_RIR: 1, default_rest: 60, goal_tags: ["hypertrophy"], substitution_group: "rear_delt",
    unilateral: false, type: "isolation",
  },

  // ---------------- HORIZONTAL PULL ----------------
  {
    exercise_id: "bb_row", name: "Barbell Row", category: "back",
    movement_pattern: "horizontal_pull", primary_muscles: ["back"], secondary_muscles: ["biceps", "rear_delts"],
    equipment: ["barbell"], experience_level: "intermediate", difficulty: 3, stability: 3, technical_demand: 3,
    fatigue_cost: 4, joint_stress_tags: ["lower_back"], recommended_rep_min: 6, recommended_rep_max: 10,
    recommended_RIR: 2, default_rest: 150, goal_tags: ["strength", "hypertrophy"], substitution_group: "horizontal_pull_heavy",
    unilateral: false, type: "compound",
  },
  {
    exercise_id: "db_row", name: "Dumbbell Row", category: "back",
    movement_pattern: "horizontal_pull", primary_muscles: ["back"], secondary_muscles: ["biceps", "rear_delts"],
    equipment: ["dumbbell", "bench"], experience_level: "beginner", difficulty: 2, stability: 3, technical_demand: 2,
    fatigue_cost: 3, joint_stress_tags: [], recommended_rep_min: 8, recommended_rep_max: 12,
    recommended_RIR: 2, default_rest: 120, goal_tags: ["strength", "hypertrophy"], substitution_group: "horizontal_pull_heavy",
    unilateral: true, type: "compound",
  },
  {
    exercise_id: "seated_cable_row", name: "Seated Cable Row", category: "back",
    movement_pattern: "horizontal_pull", primary_muscles: ["back"], secondary_muscles: ["biceps", "rear_delts"],
    equipment: ["cable"], experience_level: "beginner", difficulty: 1, stability: 1, technical_demand: 1,
    fatigue_cost: 2, joint_stress_tags: [], recommended_rep_min: 8, recommended_rep_max: 12,
    recommended_RIR: 1, default_rest: 120, goal_tags: ["strength", "hypertrophy", "general_fitness"], substitution_group: "horizontal_pull_heavy",
    unilateral: false, type: "compound",
  },
  {
    exercise_id: "chest_supported_row_machine", name: "Machine Chest-Supported Row", category: "back",
    movement_pattern: "horizontal_pull", primary_muscles: ["back"], secondary_muscles: ["biceps", "rear_delts"],
    equipment: ["machine"], experience_level: "beginner", difficulty: 1, stability: 1, technical_demand: 1,
    fatigue_cost: 2, joint_stress_tags: [], recommended_rep_min: 8, recommended_rep_max: 12,
    recommended_RIR: 1, default_rest: 120, goal_tags: ["strength", "hypertrophy"], substitution_group: "horizontal_pull_heavy",
    unilateral: false, type: "compound",
  },
  {
    exercise_id: "band_row", name: "Band Row", category: "back",
    movement_pattern: "horizontal_pull", primary_muscles: ["back"], secondary_muscles: ["biceps", "rear_delts"],
    equipment: ["band"], experience_level: "beginner", difficulty: 1, stability: 2, technical_demand: 1,
    fatigue_cost: 1, joint_stress_tags: [], recommended_rep_min: 12, recommended_rep_max: 20,
    recommended_RIR: 1, default_rest: 90, goal_tags: ["general_fitness", "hypertrophy"], substitution_group: "horizontal_pull_heavy",
    unilateral: false, type: "compound",
  },

  // ---------------- VERTICAL PULL ----------------
  {
    exercise_id: "pullup", name: "Pull-up", category: "back",
    movement_pattern: "vertical_pull", primary_muscles: ["back"], secondary_muscles: ["biceps"],
    equipment: ["pull_up_bar", "bodyweight"], experience_level: "intermediate", difficulty: 4, stability: 3, technical_demand: 2,
    fatigue_cost: 4, joint_stress_tags: ["shoulder"], recommended_rep_min: 4, recommended_rep_max: 10,
    recommended_RIR: 2, default_rest: 150, goal_tags: ["strength", "hypertrophy"], substitution_group: "vertical_pull_heavy",
    unilateral: false, type: "compound",
  },
  {
    exercise_id: "lat_pulldown", name: "Lat Pulldown", category: "back",
    movement_pattern: "vertical_pull", primary_muscles: ["back"], secondary_muscles: ["biceps"],
    equipment: ["cable"], experience_level: "beginner", difficulty: 1, stability: 1, technical_demand: 1,
    fatigue_cost: 2, joint_stress_tags: ["shoulder"], recommended_rep_min: 8, recommended_rep_max: 12,
    recommended_RIR: 1, default_rest: 120, goal_tags: ["strength", "hypertrophy", "general_fitness"], substitution_group: "vertical_pull_heavy",
    unilateral: false, type: "compound",
  },
  {
    exercise_id: "assisted_pullup_machine", name: "Assisted Pull-up Machine", category: "back",
    movement_pattern: "vertical_pull", primary_muscles: ["back"], secondary_muscles: ["biceps"],
    equipment: ["machine"], experience_level: "beginner", difficulty: 2, stability: 2, technical_demand: 1,
    fatigue_cost: 3, joint_stress_tags: ["shoulder"], recommended_rep_min: 6, recommended_rep_max: 12,
    recommended_RIR: 1, default_rest: 120, goal_tags: ["strength", "hypertrophy"], substitution_group: "vertical_pull_heavy",
    unilateral: false, type: "compound",
  },
  {
    exercise_id: "band_pulldown", name: "Band Pulldown", category: "back",
    movement_pattern: "vertical_pull", primary_muscles: ["back"], secondary_muscles: ["biceps"],
    equipment: ["band"], experience_level: "beginner", difficulty: 1, stability: 1, technical_demand: 1,
    fatigue_cost: 1, joint_stress_tags: [], recommended_rep_min: 12, recommended_rep_max: 20,
    recommended_RIR: 1, default_rest: 90, goal_tags: ["general_fitness"], substitution_group: "vertical_pull_heavy",
    unilateral: false, type: "compound",
  },

  // ---------------- ELBOW FLEXION (biceps) ----------------
  {
    exercise_id: "db_curl", name: "Dumbbell Curl", category: "arms",
    movement_pattern: "elbow_flexion", primary_muscles: ["biceps"], secondary_muscles: [],
    equipment: ["dumbbell"], experience_level: "beginner", difficulty: 1, stability: 2, technical_demand: 1,
    fatigue_cost: 1, joint_stress_tags: ["elbow"], recommended_rep_min: 8, recommended_rep_max: 15,
    recommended_RIR: 1, default_rest: 75, goal_tags: ["hypertrophy"], substitution_group: "elbow_flexion",
    unilateral: false, type: "isolation",
  },
  {
    exercise_id: "cable_curl", name: "Cable Curl", category: "arms",
    movement_pattern: "elbow_flexion", primary_muscles: ["biceps"], secondary_muscles: [],
    equipment: ["cable"], experience_level: "beginner", difficulty: 1, stability: 1, technical_demand: 1,
    fatigue_cost: 1, joint_stress_tags: ["elbow"], recommended_rep_min: 10, recommended_rep_max: 15,
    recommended_RIR: 1, default_rest: 60, goal_tags: ["hypertrophy"], substitution_group: "elbow_flexion",
    unilateral: false, type: "isolation",
  },
  {
    exercise_id: "band_curl", name: "Band Curl", category: "arms",
    movement_pattern: "elbow_flexion", primary_muscles: ["biceps"], secondary_muscles: [],
    equipment: ["band"], experience_level: "beginner", difficulty: 1, stability: 1, technical_demand: 1,
    fatigue_cost: 1, joint_stress_tags: [], recommended_rep_min: 12, recommended_rep_max: 20,
    recommended_RIR: 1, default_rest: 60, goal_tags: ["hypertrophy", "general_fitness"], substitution_group: "elbow_flexion",
    unilateral: false, type: "isolation",
  },

  // ---------------- ELBOW EXTENSION (triceps) ----------------
  {
    exercise_id: "cable_triceps_extension", name: "Cable Triceps Extension", category: "arms",
    movement_pattern: "elbow_extension", primary_muscles: ["triceps"], secondary_muscles: [],
    equipment: ["cable"], experience_level: "beginner", difficulty: 1, stability: 1, technical_demand: 1,
    fatigue_cost: 1, joint_stress_tags: ["elbow"], recommended_rep_min: 10, recommended_rep_max: 15,
    recommended_RIR: 1, default_rest: 60, goal_tags: ["hypertrophy"], substitution_group: "elbow_extension",
    unilateral: false, type: "isolation",
  },
  {
    exercise_id: "overhead_db_extension", name: "Dumbbell Overhead Triceps Extension", category: "arms",
    movement_pattern: "elbow_extension", primary_muscles: ["triceps"], secondary_muscles: [],
    equipment: ["dumbbell"], experience_level: "beginner", difficulty: 2, stability: 2, technical_demand: 2,
    fatigue_cost: 1, joint_stress_tags: ["elbow", "shoulder"], recommended_rep_min: 10, recommended_rep_max: 15,
    recommended_RIR: 1, default_rest: 60, goal_tags: ["hypertrophy"], substitution_group: "elbow_extension",
    unilateral: false, type: "isolation",
  },
  {
    exercise_id: "dips", name: "Bodyweight Dips", category: "arms",
    movement_pattern: "elbow_extension", primary_muscles: ["triceps"], secondary_muscles: ["chest", "front_delts"],
    equipment: ["bodyweight"], experience_level: "intermediate", difficulty: 3, stability: 3, technical_demand: 2,
    fatigue_cost: 3, joint_stress_tags: ["shoulder"], recommended_rep_min: 6, recommended_rep_max: 15,
    recommended_RIR: 2, default_rest: 120, goal_tags: ["hypertrophy", "strength"], substitution_group: "elbow_extension",
    unilateral: false, type: "compound",
  },

  // ---------------- SQUAT / KNEE-DOMINANT ----------------
  {
    exercise_id: "bb_back_squat", name: "Barbell Back Squat", category: "legs",
    movement_pattern: "squat", primary_muscles: ["quads"], secondary_muscles: ["glutes", "hamstrings", "core"],
    equipment: ["barbell"], experience_level: "intermediate", difficulty: 4, stability: 3, technical_demand: 4,
    fatigue_cost: 5, joint_stress_tags: ["knee", "lower_back"], recommended_rep_min: 5, recommended_rep_max: 10,
    recommended_RIR: 2, default_rest: 180, goal_tags: ["strength", "hypertrophy"], substitution_group: "squat_heavy",
    unilateral: false, type: "compound",
  },
  {
    exercise_id: "goblet_squat", name: "Goblet Squat", category: "legs",
    movement_pattern: "squat", primary_muscles: ["quads"], secondary_muscles: ["glutes", "core"],
    equipment: ["dumbbell", "kettlebell"], experience_level: "beginner", difficulty: 2, stability: 3, technical_demand: 2,
    fatigue_cost: 3, joint_stress_tags: ["knee"], recommended_rep_min: 8, recommended_rep_max: 15,
    recommended_RIR: 2, default_rest: 120, goal_tags: ["strength", "hypertrophy", "general_fitness"], substitution_group: "squat_heavy",
    unilateral: false, type: "compound",
  },
  {
    exercise_id: "leg_press", name: "Leg Press", category: "legs",
    movement_pattern: "squat", primary_muscles: ["quads"], secondary_muscles: ["glutes"],
    equipment: ["machine"], experience_level: "beginner", difficulty: 1, stability: 1, technical_demand: 1,
    fatigue_cost: 3, joint_stress_tags: ["knee"], recommended_rep_min: 8, recommended_rep_max: 15,
    recommended_RIR: 1, default_rest: 150, goal_tags: ["strength", "hypertrophy"], substitution_group: "squat_heavy",
    unilateral: false, type: "compound",
  },
  {
    exercise_id: "bodyweight_squat", name: "Bodyweight Squat", category: "legs",
    movement_pattern: "squat", primary_muscles: ["quads"], secondary_muscles: ["glutes"],
    equipment: ["bodyweight"], experience_level: "beginner", difficulty: 1, stability: 2, technical_demand: 1,
    fatigue_cost: 2, joint_stress_tags: ["knee"], recommended_rep_min: 12, recommended_rep_max: 25,
    recommended_RIR: 2, default_rest: 90, goal_tags: ["general_fitness", "endurance"], substitution_group: "squat_heavy",
    unilateral: false, type: "compound",
  },
  {
    exercise_id: "leg_extension", name: "Leg Extension", category: "legs",
    movement_pattern: "squat", primary_muscles: ["quads"], secondary_muscles: [],
    equipment: ["machine"], experience_level: "beginner", difficulty: 1, stability: 1, technical_demand: 1,
    fatigue_cost: 1, joint_stress_tags: ["knee"], recommended_rep_min: 10, recommended_rep_max: 20,
    recommended_RIR: 1, default_rest: 75, goal_tags: ["hypertrophy"], substitution_group: "quad_isolation",
    unilateral: false, type: "isolation",
  },

  // ---------------- HIP HINGE ----------------
  {
    exercise_id: "conventional_deadlift", name: "Conventional Deadlift", category: "legs",
    movement_pattern: "hip_hinge", primary_muscles: ["hamstrings", "glutes"], secondary_muscles: ["back", "core"],
    equipment: ["barbell"], experience_level: "advanced", difficulty: 5, stability: 3, technical_demand: 5,
    fatigue_cost: 5, joint_stress_tags: ["lower_back"], recommended_rep_min: 3, recommended_rep_max: 6,
    recommended_RIR: 2, default_rest: 210, goal_tags: ["strength"], substitution_group: "hip_hinge_heavy",
    unilateral: false, type: "compound",
  },
  {
    exercise_id: "romanian_deadlift_bb", name: "Barbell Romanian Deadlift", category: "legs",
    movement_pattern: "hip_hinge", primary_muscles: ["hamstrings", "glutes"], secondary_muscles: ["back"],
    equipment: ["barbell"], experience_level: "intermediate", difficulty: 3, stability: 3, technical_demand: 3,
    fatigue_cost: 4, joint_stress_tags: ["lower_back"], recommended_rep_min: 6, recommended_rep_max: 10,
    recommended_RIR: 2, default_rest: 150, goal_tags: ["strength", "hypertrophy"], substitution_group: "hip_hinge_heavy",
    unilateral: false, type: "compound",
  },
  {
    exercise_id: "db_romanian_deadlift", name: "Dumbbell Romanian Deadlift", category: "legs",
    movement_pattern: "hip_hinge", primary_muscles: ["hamstrings", "glutes"], secondary_muscles: ["back"],
    equipment: ["dumbbell"], experience_level: "beginner", difficulty: 2, stability: 3, technical_demand: 2,
    fatigue_cost: 3, joint_stress_tags: ["lower_back"], recommended_rep_min: 8, recommended_rep_max: 12,
    recommended_RIR: 2, default_rest: 120, goal_tags: ["strength", "hypertrophy", "general_fitness"], substitution_group: "hip_hinge_heavy",
    unilateral: false, type: "compound",
  },
  {
    exercise_id: "kb_swing", name: "Kettlebell Swing", category: "legs",
    movement_pattern: "hip_hinge", primary_muscles: ["glutes", "hamstrings"], secondary_muscles: ["core"],
    equipment: ["kettlebell"], experience_level: "beginner", difficulty: 2, stability: 2, technical_demand: 2,
    fatigue_cost: 3, joint_stress_tags: ["lower_back"], recommended_rep_min: 12, recommended_rep_max: 20,
    recommended_RIR: 2, default_rest: 90, goal_tags: ["general_fitness", "endurance", "hypertrophy"], substitution_group: "hip_hinge_heavy",
    unilateral: false, type: "compound",
  },
  {
    exercise_id: "back_extension", name: "Back Extension", category: "legs",
    movement_pattern: "hip_hinge", primary_muscles: ["glutes", "hamstrings"], secondary_muscles: ["back"],
    equipment: ["machine", "bodyweight"], experience_level: "beginner", difficulty: 1, stability: 2, technical_demand: 1,
    fatigue_cost: 2, joint_stress_tags: ["lower_back"], recommended_rep_min: 10, recommended_rep_max: 20,
    recommended_RIR: 1, default_rest: 75, goal_tags: ["hypertrophy", "general_fitness"], substitution_group: "hip_hinge_heavy",
    unilateral: false, type: "compound",
  },

  // ---------------- KNEE FLEXION / HIP EXTENSION (hams+glutes isolation) ----------------
  {
    exercise_id: "leg_curl_machine", name: "Lying Leg Curl", category: "legs",
    movement_pattern: "knee_flexion", primary_muscles: ["hamstrings"], secondary_muscles: [],
    equipment: ["machine"], experience_level: "beginner", difficulty: 1, stability: 1, technical_demand: 1,
    fatigue_cost: 1, joint_stress_tags: ["knee"], recommended_rep_min: 10, recommended_rep_max: 15,
    recommended_RIR: 1, default_rest: 75, goal_tags: ["hypertrophy"], substitution_group: "hamstring_isolation",
    unilateral: false, type: "isolation",
  },
  {
    exercise_id: "hip_thrust_bb", name: "Barbell Hip Thrust", category: "legs",
    movement_pattern: "hip_extension", primary_muscles: ["glutes"], secondary_muscles: ["hamstrings"],
    equipment: ["barbell", "bench"], experience_level: "beginner", difficulty: 2, stability: 2, technical_demand: 2,
    fatigue_cost: 3, joint_stress_tags: [], recommended_rep_min: 8, recommended_rep_max: 12,
    recommended_RIR: 2, default_rest: 120, goal_tags: ["hypertrophy", "strength"], substitution_group: "glute_isolation",
    unilateral: false, type: "compound",
  },
  {
    exercise_id: "cable_pull_through", name: "Cable Pull-Through", category: "legs",
    movement_pattern: "hip_extension", primary_muscles: ["glutes"], secondary_muscles: ["hamstrings"],
    equipment: ["cable"], experience_level: "beginner", difficulty: 1, stability: 2, technical_demand: 2,
    fatigue_cost: 1, joint_stress_tags: [], recommended_rep_min: 12, recommended_rep_max: 20,
    recommended_RIR: 1, default_rest: 75, goal_tags: ["hypertrophy"], substitution_group: "glute_isolation",
    unilateral: false, type: "isolation",
  },

  // ---------------- CALVES ----------------
  {
    exercise_id: "standing_calf_raise_machine", name: "Standing Calf Raise (Machine)", category: "legs",
    movement_pattern: "calves", primary_muscles: ["calves"], secondary_muscles: [],
    equipment: ["machine"], experience_level: "beginner", difficulty: 1, stability: 1, technical_demand: 1,
    fatigue_cost: 1, joint_stress_tags: ["ankle"], recommended_rep_min: 10, recommended_rep_max: 20,
    recommended_RIR: 1, default_rest: 60, goal_tags: ["hypertrophy"], substitution_group: "calves",
    unilateral: false, type: "isolation",
  },
  {
    exercise_id: "bodyweight_calf_raise", name: "Bodyweight Calf Raise", category: "legs",
    movement_pattern: "calves", primary_muscles: ["calves"], secondary_muscles: [],
    equipment: ["bodyweight"], experience_level: "beginner", difficulty: 1, stability: 1, technical_demand: 1,
    fatigue_cost: 1, joint_stress_tags: ["ankle"], recommended_rep_min: 12, recommended_rep_max: 25,
    recommended_RIR: 1, default_rest: 60, goal_tags: ["hypertrophy", "general_fitness"], substitution_group: "calves",
    unilateral: false, type: "isolation",
  },
  {
    exercise_id: "db_calf_raise", name: "Dumbbell Calf Raise", category: "legs",
    movement_pattern: "calves", primary_muscles: ["calves"], secondary_muscles: [],
    equipment: ["dumbbell"], experience_level: "beginner", difficulty: 1, stability: 2, technical_demand: 1,
    fatigue_cost: 1, joint_stress_tags: ["ankle"], recommended_rep_min: 12, recommended_rep_max: 20,
    recommended_RIR: 1, default_rest: 60, goal_tags: ["hypertrophy"], substitution_group: "calves",
    unilateral: false, type: "isolation",
  },

  // ---------------- CORE ----------------
  {
    exercise_id: "plank", name: "Plank", category: "core",
    movement_pattern: "core", primary_muscles: ["core"], secondary_muscles: [],
    equipment: ["bodyweight"], experience_level: "beginner", difficulty: 1, stability: 2, technical_demand: 1,
    fatigue_cost: 1, joint_stress_tags: [], recommended_rep_min: 20, recommended_rep_max: 60,
    recommended_RIR: 1, default_rest: 60, goal_tags: ["general_fitness", "hypertrophy", "endurance"], substitution_group: "core_anti_extension",
    unilateral: false, type: "isolation",
  },
  {
    exercise_id: "cable_crunch", name: "Cable Crunch", category: "core",
    movement_pattern: "core", primary_muscles: ["core"], secondary_muscles: [],
    equipment: ["cable"], experience_level: "beginner", difficulty: 1, stability: 1, technical_demand: 1,
    fatigue_cost: 1, joint_stress_tags: [], recommended_rep_min: 12, recommended_rep_max: 20,
    recommended_RIR: 1, default_rest: 60, goal_tags: ["hypertrophy"], substitution_group: "core_flexion",
    unilateral: false, type: "isolation",
  },
  {
    exercise_id: "hanging_leg_raise", name: "Hanging Leg Raise", category: "core",
    movement_pattern: "core", primary_muscles: ["core"], secondary_muscles: [],
    equipment: ["pull_up_bar", "bodyweight"], experience_level: "intermediate", difficulty: 3, stability: 3, technical_demand: 2,
    fatigue_cost: 2, joint_stress_tags: ["shoulder"], recommended_rep_min: 8, recommended_rep_max: 15,
    recommended_RIR: 1, default_rest: 75, goal_tags: ["hypertrophy", "general_fitness"], substitution_group: "core_flexion",
    unilateral: false, type: "isolation",
  },
  {
    exercise_id: "deadbug", name: "Dead Bug", category: "core",
    movement_pattern: "core", primary_muscles: ["core"], secondary_muscles: [],
    equipment: ["bodyweight"], experience_level: "beginner", difficulty: 1, stability: 2, technical_demand: 1,
    fatigue_cost: 1, joint_stress_tags: ["lower_back"], recommended_rep_min: 10, recommended_rep_max: 15,
    recommended_RIR: 1, default_rest: 45, goal_tags: ["general_fitness"], substitution_group: "core_anti_extension",
    unilateral: false, type: "isolation",
  },

  // ---------------- CARDIO ----------------
  {
    exercise_id: "walking", name: "Walking", category: "cardio",
    movement_pattern: "cardio", primary_muscles: [], secondary_muscles: ["quads", "calves", "glutes"],
    equipment: ["bodyweight", "treadmill"], experience_level: "beginner", difficulty: 1, stability: 1, technical_demand: 1,
    fatigue_cost: 1, joint_stress_tags: [], recommended_rep_min: null, recommended_rep_max: null,
    recommended_RIR: null, default_rest: 0, goal_tags: ["cutting", "general_fitness", "recomposition"], substitution_group: "cardio_low_impact",
    unilateral: false, type: "cardio", modality: "steady_state",
  },
  {
    exercise_id: "cycling_zone2", name: "Cycling (Zone 2)", category: "cardio",
    movement_pattern: "cardio", primary_muscles: [], secondary_muscles: ["quads", "glutes"],
    equipment: ["bike"], experience_level: "beginner", difficulty: 1, stability: 1, technical_demand: 1,
    fatigue_cost: 2, joint_stress_tags: ["knee"], recommended_rep_min: null, recommended_rep_max: null,
    recommended_RIR: null, default_rest: 0, goal_tags: ["cutting", "endurance", "general_fitness"], substitution_group: "cardio_low_impact",
    unilateral: false, type: "cardio", modality: "steady_state",
  },
  {
    exercise_id: "running", name: "Running", category: "cardio",
    movement_pattern: "cardio", primary_muscles: [], secondary_muscles: ["quads", "calves", "hamstrings"],
    equipment: ["bodyweight", "treadmill"], experience_level: "intermediate", difficulty: 2, stability: 2, technical_demand: 1,
    fatigue_cost: 3, joint_stress_tags: ["knee", "ankle"], recommended_rep_min: null, recommended_rep_max: null,
    recommended_RIR: null, default_rest: 0, goal_tags: ["endurance", "cutting"], substitution_group: "cardio_impact",
    unilateral: false, type: "cardio", modality: "steady_state",
  },
  {
    exercise_id: "intervals_bike", name: "Bike Intervals", category: "cardio",
    movement_pattern: "cardio", primary_muscles: [], secondary_muscles: ["quads", "glutes"],
    equipment: ["bike"], experience_level: "intermediate", difficulty: 3, stability: 1, technical_demand: 1,
    fatigue_cost: 4, joint_stress_tags: ["knee"], recommended_rep_min: null, recommended_rep_max: null,
    recommended_RIR: null, default_rest: 0, goal_tags: ["endurance"], substitution_group: "cardio_high_intensity",
    unilateral: false, type: "cardio", modality: "intervals",
  },
];

export function getExerciseById(id) {
  return EXERCISES.find((e) => e.exercise_id === id) || null;
}

export function getExercisesByPattern(pattern) {
  return EXERCISES.filter((e) => e.movement_pattern === pattern);
}

export function getExercisesByMuscle(muscle) {
  return EXERCISES.filter((e) => e.primary_muscles.includes(muscle) || e.secondary_muscles.includes(muscle));
}
