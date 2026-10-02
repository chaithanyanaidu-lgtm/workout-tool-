import assert from "node:assert/strict";
import { generateProgram } from "../src/engines/programGenerator.js";
import { handleExerciseChangeRequest, getAlternatives } from "../src/engines/alternativeEngine.js";
import { computeNextTarget } from "../src/engines/progressionEngine.js";
import { evaluateExerciseAdaptation } from "../src/engines/adaptationEngine.js";
import { validateSession, validateWeeklyVolume } from "../src/engines/validationEngine.js";
import { getAvailableSplits, SPLIT_LIBRARY, parseCustomSplit } from "../src/engines/splitEngine.js";
import { EXERCISES } from "../src/data/exercises.js";

let passed = 0, failed = 0;
const results = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    results.push(`✔ ${name}`);
  } catch (err) {
    failed++;
    results.push(`✘ ${name}\n    ${err.message}`);
  }
}

function baseProfile(overrides = {}) {
  return {
    user_id: "test_user",
    goal: "general_fitness",
    experience: "beginner",
    age: 30, sex: "male", height_cm: 178, weight_kg: 80,
    days_per_week: 3,
    session_duration_min: 60,
    location: "commercial_gym",
    equipment: ["barbell", "dumbbell", "bench", "machine", "cable", "smith_machine", "pull_up_bar", "bodyweight", "kettlebell", "band", "bike", "treadmill"],
    preferences: { preferred_exercises: [], disliked_exercises: [], cardio_preference: null },
    constraints: { injuries: [], exercise_restrictions: [] },
    ...overrides,
  };
}

function allExercises(program) {
  return program.days.flatMap((d) => d.exercises || []);
}

// ---------- 1. Beginner 3-day program ----------
test("1. Beginner 3-day program generates full-body split with simple prescriptions", () => {
  const program = generateProgram(baseProfile({ experience: "beginner", days_per_week: 3 }));
  const trainingDays = program.days.filter((d) => !d.is_rest_day);
  assert.equal(trainingDays.length, 3);
  assert.ok(trainingDays.every((d) => d.session_type === "full_body"));
  assert.ok(allExercises(program).length > 0);
});

// ---------- 2. Intermediate 4-day hypertrophy (bulking) program ----------
test("2. Intermediate 4-day hypertrophy program uses upper/lower split", () => {
  const program = generateProgram(baseProfile({ experience: "intermediate", goal: "bulking", days_per_week: 4 }));
  const trainingDays = program.days.filter((d) => !d.is_rest_day);
  assert.equal(trainingDays.length, 4);
  assert.deepEqual(trainingDays.map((d) => d.session_type), ["upper", "lower", "upper", "lower"]);
});

// ---------- 3. Advanced 6-day program ----------
test("3. Advanced 6-day program uses push/pull/legs x2", () => {
  const program = generateProgram(baseProfile({ experience: "advanced", days_per_week: 6 }));
  const trainingDays = program.days.filter((d) => !d.is_rest_day);
  assert.equal(trainingDays.length, 6);
  assert.deepEqual(trainingDays.map((d) => d.session_type), ["push", "pull", "legs", "push", "pull", "legs"]);
});

// ---------- 4. Cutting program ----------
test("4. Cutting program includes cardio and strength-maintenance priorities", () => {
  const program = generateProgram(baseProfile({ goal: "cutting", days_per_week: 4, experience: "intermediate" }));
  assert.equal(program.cardio_plan.weekly_sessions > 0, true);
  assert.ok(program.days.some((d) => d.optional_cardio));
});

// ---------- 5. Recomposition program ----------
test("5. Recomposition program balances hypertrophy/strength with conditioning", () => {
  const program = generateProgram(baseProfile({ goal: "recomposition", days_per_week: 4, experience: "intermediate" }));
  assert.ok(program.days.length === 7);
  assert.ok(program.cardio_plan.intensity === "low_to_moderate");
});

// ---------- 6. Endurance program ----------
test("6. Endurance program prioritizes higher cardio frequency", () => {
  const program = generateProgram(baseProfile({ goal: "endurance", days_per_week: 5, experience: "intermediate" }));
  assert.equal(program.cardio_plan.weekly_sessions, 4);
});

// ---------- 7. General fitness program ----------
test("7. General fitness program is valid and balanced", () => {
  const program = generateProgram(baseProfile({ goal: "general_fitness", days_per_week: 3 }));
  assert.equal(program.weekly_volume_validation.valid, true);
});

// ---------- 8. Home gym with dumbbells only ----------
test("8. Home gym (dumbbells + bodyweight only) never selects unavailable equipment", () => {
  const program = generateProgram(baseProfile({
    equipment: ["dumbbell", "bodyweight", "bench"], days_per_week: 3, experience: "beginner",
  }));
  const usedIds = allExercises(program).map((e) => e.exercise_id);
  for (const id of usedIds) {
    const ex = EXERCISES.find((e) => e.exercise_id === id);
    assert.ok(ex.equipment.some((eq) => ["dumbbell", "bodyweight", "bench"].includes(eq)), `${id} requires unavailable equipment`);
  }
});

// ---------- 9. Full commercial gym ----------
test("9. Full commercial gym produces a richer, varied exercise set", () => {
  const program = generateProgram(baseProfile({ days_per_week: 5, experience: "advanced", goal: "bulking" }));
  const usedIds = new Set(allExercises(program).map((e) => e.exercise_id));
  assert.ok(usedIds.size >= 6);
});

// ---------- 10. Limited 30-minute session ----------
test("10. 30-minute session trims accessories but keeps primary movement", () => {
  const program = generateProgram(baseProfile({ session_duration_min: 30, days_per_week: 3, experience: "intermediate" }));
  const day = program.days.find((d) => !d.is_rest_day);
  assert.ok(day.exercises.some((e) => e.role === "primary"));
  assert.ok(day.estimated_duration_minutes <= 45); // some slack, but should be meaningfully trimmed
});

// ---------- 11. Exercise substitution ----------
test("11. Exercise substitution (bench press) preserves training purpose, excludes cable fly", () => {
  const alts = getAlternatives({ exerciseId: "bb_bench_press", availableEquipment: ["dumbbell", "bench", "cable", "smith_machine", "machine"] });
  const ids = alts.map((a) => a.exercise_id);
  assert.ok(ids.includes("db_bench_press") || ids.includes("machine_chest_press") || ids.includes("smith_bench_press"));
  assert.ok(!ids.includes("cable_fly"), "cable fly should never be offered as a bench press alternative");
});

// ---------- 12. Progression after successful performance ----------
test("12. Progression engine increases load after hitting top of rep range on all sets", () => {
  const prescription = { rep_min: 6, rep_max: 10, sets: 3, progression: "double_progression" };
  const history = [{ date: "2026-09-01", load: 60, reps: [10, 10, 10], sets: 3, completed: true }];
  const result = computeNextTarget({ history, prescription, exerciseName: "Barbell Bench Press" });
  assert.equal(result.action, "increase_load");
  assert.ok(result.next_load > 60);
});

// ---------- 13. No progression after failed performance ----------
test("13. Progression engine holds load when rep range top not reached", () => {
  const prescription = { rep_min: 6, rep_max: 10, sets: 3, progression: "double_progression" };
  const history = [{ date: "2026-09-01", load: 60, reps: [8, 7, 6], sets: 3, completed: true }];
  const result = computeNextTarget({ history, prescription, exerciseName: "Barbell Bench Press" });
  assert.equal(result.action, "repeat");
  assert.equal(result.next_load, 60);
});

// ---------- 14. Repeated performance decline ----------
test("14. Adaptation engine flags exercise-level swap only after repeated high-confidence decline", () => {
  const history = [
    { date: "1", load: 60, reps: [10, 10, 9], sets: 3, completed: true },
    { date: "2", load: 60, reps: [8, 7, 7], sets: 3, completed: true },
    { date: "3", load: 60, reps: [7, 6, 5], sets: 3, completed: true },
    { date: "4", load: 60, reps: [6, 5, 4], sets: 3, completed: true },
  ];
  const decision = evaluateExerciseAdaptation({ exerciseName: "Barbell Bench Press", history });
  assert.ok(decision.level >= 1, "declining trend should trigger at least a Level 1 progression adjustment");

  // A single bad session amid otherwise stable performance must NOT trigger the same escalation.
  const oneBadSession = [
    { date: "1", load: 60, reps: [10, 10, 10], sets: 3, completed: true },
    { date: "2", load: 60, reps: [10, 10, 10], sets: 3, completed: true },
    { date: "3", load: 60, reps: [5, 4, 3], sets: 3, completed: true },
  ];
  const singleBadDecision = evaluateExerciseAdaptation({ exerciseName: "Barbell Bench Press", history: oneBadSession });
  assert.equal(singleBadDecision.level, 0, "a single bad session should not trigger a program change");
});

// ---------- 15. User changing exercise because of equipment ----------
test("15. Change-exercise for 'equipment_unavailable' returns purpose-preserving alternatives", () => {
  const result = handleExerciseChangeRequest({
    exerciseId: "bb_back_squat", reason: "equipment_unavailable", availableEquipment: ["dumbbell", "machine", "bodyweight"],
  });
  assert.equal(result.action, "substitute");
  assert.ok(result.alternatives.length > 0);
});

// ---------- 16. User changing exercise because they dislike it ----------
test("16. Change-exercise for 'dislike' returns alternatives and flags preference to remember", () => {
  const result = handleExerciseChangeRequest({
    exerciseId: "pullup", reason: "dislike", availableEquipment: ["cable", "machine"],
  });
  assert.equal(result.remember_preference, true);
  assert.ok(result.alternatives.length > 0);
});

// ---------- 17. Workout with insufficient available equipment ----------
test("17. Extremely limited equipment (bodyweight only) still produces a valid, non-empty session", () => {
  const program = generateProgram(baseProfile({ equipment: ["bodyweight"], days_per_week: 3, experience: "beginner" }));
  const day = program.days.find((d) => !d.is_rest_day);
  assert.ok(day.exercises.length > 0, "should still assemble a session from bodyweight-only movements");
});

// ---------- 18. Program with excessive weekly volume is caught by validation ----------
test("18. Weekly volume validation flags allocations above the experience-level max", () => {
  const weeklyTargets = { chest: { min: 8, max: 12, target: 10 } };
  const allocation = { 1: { chest: 20 } }; // deliberately excessive
  const result = validateWeeklyVolume({ weeklyTargets, allocation });
  assert.equal(result.valid, false);
  assert.ok(result.issues.length > 0);
});

// ---------- 19. Duplicate movement detection ----------
test("19. Validation engine detects duplicate exercises in a session", () => {
  const fakeSession = {
    is_rest_day: false, session_type: "push",
    exercises: [
      { exercise_id: "bb_bench_press", sets: 3, role: "primary" },
      { exercise_id: "bb_bench_press", sets: 3, role: "secondary" },
    ],
    locked_selections: { horizontal_push: "bb_bench_press" },
    trimmed_for_time: [],
    estimated_duration_minutes: 40,
  };
  const result = validateSession({ session: fakeSession, experienceProfile: { max_technical_demand: 5 }, availableEquipment: ["barbell", "bench"], sessionDurationMinutes: 60 });
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((i) => i.includes("Duplicate")));
});

// ---------- 20. Program regeneration after validation failure ----------
test("20. Every generated session in a full program passes validation (regeneration works)", () => {
  const program = generateProgram(baseProfile({ days_per_week: 6, experience: "advanced", session_duration_min: 45 }));
  for (const day of program.days) {
    if (day.is_rest_day) continue;
    const result = validateSession({
      session: day, experienceProfile: { max_technical_demand: 5 },
      availableEquipment: baseProfile().equipment, sessionDurationMinutes: 45,
    });
    assert.equal(result.valid, true, `Day ${day.day_index} (${day.session_type}) failed validation: ${result.issues.join("; ")}`);
  }
});

// ---------- 21. Split library provides templates for 2 to 7 days ----------
test("21. Split library provides recognizable templates for every frequency (2-7 days)", () => {
  for (let days = 2; days <= 7; days++) {
    const splits = getAvailableSplits(days);
    assert.ok(splits.length >= 2, `Expected at least 2 templates for ${days} days`);
  }
  const fiveDay = getAvailableSplits(5).map((s) => s.name);
  assert.ok(fiveDay.some((n) => n.includes("Push / Pull / Legs / Upper / Lower")));
  assert.ok(fiveDay.some((n) => n.includes("Chest / Back / Shoulders / Legs / Arms")));
});

// ---------- 22. User selected split template (5-day Bro Split) ----------
test("22. Program generator respects user selected split template", () => {
  const program = generateProgram(baseProfile({
    days_per_week: 5,
    split_id: "5day_bro_split_1",
    experience: "intermediate",
  }));
  const trainingDays = program.days.filter((d) => !d.is_rest_day);
  assert.equal(trainingDays.length, 5);
  assert.equal(program.split_id, "5day_bro_split_1");
  assert.equal(trainingDays[0].session_type, "chest");
  assert.equal(trainingDays[1].session_type, "back");
  assert.equal(trainingDays[2].session_type, "shoulders");
  assert.equal(trainingDays[3].session_type, "legs");
  assert.equal(trainingDays[4].session_type, "arms");
});

// ---------- 23. Custom split builder ----------
test("23. Custom split builder parses user structure and builds workouts accordingly", () => {
  const customDays = [
    { day_name: "Chest + Triceps", muscles: ["chest", "triceps"] },
    { day_name: "Back + Biceps", muscles: ["back", "biceps"] },
    { day_name: "Rest", is_rest: true },
    { day_name: "Leg Day", muscles: ["quads", "hamstrings", "glutes", "calves"] },
    { day_name: "Shoulders", muscles: ["front_delts", "side_delts", "rear_delts"] },
    { day_name: "Chest + Back", muscles: ["chest", "back"] },
    { day_name: "Rest", is_rest: true },
  ];
  const program = generateProgram(baseProfile({
    custom_split: customDays,
    experience: "intermediate",
  }));
  assert.equal(program.is_custom_split, true);
  const trainingDays = program.days.filter((d) => !d.is_rest_day);
  assert.equal(trainingDays.length, 5);
  // Monday: Chest + Triceps
  const mondayEx = trainingDays[0].exercises;
  assert.ok(mondayEx.some((e) => e.primary_muscle === "chest"));
  assert.ok(mondayEx.some((e) => e.primary_muscle === "triceps" || e.secondary_muscles.includes("triceps")));
  // Tuesday: Back + Biceps
  const tuesdayEx = trainingDays[1].exercises;
  assert.ok(tuesdayEx.some((e) => e.primary_muscle === "back"));
  assert.ok(tuesdayEx.some((e) => e.primary_muscle === "biceps" || e.secondary_muscles.includes("biceps")));
});

// ---------- 24. Trainee muscle priorities ----------
test("24. Priority muscles receive better exercise placement and volume tracking", () => {
  const programWithPriority = generateProgram(baseProfile({
    days_per_week: 5,
    split_id: "5day_ppl_ul",
    priority_muscles: ["side_delts", "biceps"],
  }));
  assert.ok(programWithPriority.priority_muscles.includes("side_delts"));
  assert.ok(programWithPriority.weekly_volume_summary.side_delts.frequency_days > 0);
  assert.ok(programWithPriority.weekly_volume_summary.biceps.direct_sets > 0);
});

// ---------- 25. Exercise Intelligence Database completeness ----------
test("25. Exercise database contains all 20 required structured metadata fields", () => {
  assert.ok(EXERCISES.length >= 30);
  for (const ex of EXERCISES) {
    if (ex.classification === "cardio" || ex.type === "cardio") continue;
    assert.ok(ex.name, "Exercise missing name");
    assert.ok(ex.primary_muscles && ex.primary_muscles.length > 0, `${ex.name} missing primary_muscles`);
    assert.ok(Array.isArray(ex.secondary_muscles), `${ex.name} missing secondary_muscles`);
    assert.ok(ex.movement_pattern, `${ex.name} missing movement_pattern`);
    assert.ok(["compound", "isolation", "accessory"].includes(ex.classification), `${ex.name} invalid classification: ${ex.classification}`);
    assert.ok(ex.equipment && ex.equipment.length > 0, `${ex.name} missing equipment`);
    assert.ok(ex.difficulty >= 1 && ex.difficulty <= 5, `${ex.name} missing difficulty`);
    assert.ok(ex.recommended_rep_range, `${ex.name} missing recommended_rep_range`);
    assert.ok(typeof ex.unilateral === "boolean", `${ex.name} missing unilateral`);
    assert.ok(ex.substitution_group, `${ex.name} missing substitution_group`);
    assert.ok(ex.muscle_stimulus_profile, `${ex.name} missing muscle_stimulus_profile`);
  }
});

// ---------- 26. Section 17 Workout data display fields ----------
test("26. Generated exercises display all required Section 17 fields", () => {
  const program = generateProgram(baseProfile({ days_per_week: 3, experience: "beginner" }));
  const firstSession = program.days.find((d) => !d.is_rest_day);
  assert.ok(firstSession.exercises.length > 0);
  for (const ex of firstSession.exercises) {
    assert.ok(ex.name, "Missing exercise name");
    assert.ok(ex.primary_muscle || ex.primary_muscles.length > 0, "Missing primary muscle");
    assert.ok(ex.classification, "Missing classification");
    assert.ok(ex.movement_pattern, "Missing movement pattern");
    assert.ok(ex.sets > 0, "Missing sets");
    assert.ok(ex.reps_display, "Missing reps display");
    assert.ok(ex.rest_display, "Missing rest display");
    assert.ok(ex.intensity_display, "Missing intensity display");
    assert.ok(ex.progression_instruction, "Missing progression instruction");
    assert.ok(Array.isArray(ex.alternatives), "Missing alternatives list");
  }
});

// ---------- 27. 7-Day split template generation ----------
test("27. 7-Day split produces valid week schedule without errors", () => {
  const program = generateProgram(baseProfile({ days_per_week: 7, split_id: "7day_ppl_ul_active" }));
  assert.equal(program.days.length, 7);
  assert.ok(program.days.every((d) => !d.is_rest_day || d.session_type === "rest"));
});

// ---------- 28. Equipment preset handling (dumbbells only) ----------
test("28. Dumbbells equipment preset excludes barbells and cables", () => {
  const program = generateProgram(baseProfile({
    equipment_preset: "dumbbells",
    days_per_week: 3,
  }));
  const exercises = allExercises(program);
  for (const e of exercises) {
    const full = EXERCISES.find((x) => x.exercise_id === e.exercise_id);
    assert.ok(full.equipment.some((eq) => ["dumbbell", "bench", "bodyweight"].includes(eq)), `${full.name} used illegal equipment`);
  }
});

// ---------- 29. Experience Differentiation (Beginner vs Intermediate vs Advanced) ----------
test("29. Experience levels are meaningfully differentiated across exercises, sets, RIR, progression, and intensity techniques", () => {
  const profileCommon = {
    days_per_week: 5,
    split_id: "5day_ppl_ul",
    goal: "hypertrophy",
    session_duration_min: 60,
  };

  const begProg = generateProgram(baseProfile({ ...profileCommon, experience: "beginner" }));
  const intProg = generateProgram(baseProfile({ ...profileCommon, experience: "intermediate" }));
  const advProg = generateProgram(baseProfile({ ...profileCommon, experience: "advanced" }));

  const begEx = allExercises(begProg);
  const intEx = allExercises(intProg);
  const advEx = allExercises(advProg);

  // 1. Progression method differentiation
  assert.ok(begEx.every((e) => e.progression === "linear_simple" || e.progression_instruction.includes("Linear Progression")));
  assert.ok(intEx.some((e) => e.progression === "double_progression" || e.progression_instruction.includes("Double Progression")));
  assert.ok(advEx.some((e) => e.progression === "dynamic_double_progression" || e.progression_instruction.includes("Dynamic Double Progression")));

  // 2. RIR differentiation: Beginner has higher RIR (safer) than Advanced
  const avgBegRir = begEx.reduce((s, e) => s + e.rir, 0) / begEx.length;
  const avgIntRir = intEx.reduce((s, e) => s + e.rir, 0) / intEx.length;
  const avgAdvRir = advEx.reduce((s, e) => s + e.rir, 0) / advEx.length;
  assert.ok(avgBegRir > avgIntRir, "Beginner average RIR should be higher than Intermediate");
  assert.ok(avgIntRir > avgAdvRir, "Intermediate average RIR should be higher than Advanced");

  // 3. Advanced trainees receive intensity techniques on accessories
  assert.ok(advEx.some((e) => e.intensity_technique || e.intensityTechnique), "Advanced should receive intensity techniques on accessories");
  assert.ok(begEx.every((e) => !e.intensity_technique && !e.intensityTechnique), "Beginners should not receive intensity techniques");

  // 4. Sets count: Advanced receives more total sets than Beginner
  const begTotalSets = begEx.reduce((s, e) => s + e.sets, 0);
  const advTotalSets = advEx.reduce((s, e) => s + e.sets, 0);
  assert.ok(advTotalSets > begTotalSets, "Advanced should have higher weekly set volume than Beginner");
});

// ---------- 30. Duration Scaling (30m vs 45m vs 60m vs 75m vs 90m) ----------
test("30. Session duration scales exercise counts, sets, and realistic time estimates without redundant movements", () => {
  const durations = [30, 45, 60, 75, 90];
  const programs = durations.map((d) =>
    generateProgram(baseProfile({ days_per_week: 3, split_id: "3day_ppl", session_duration_min: d, experience: "intermediate" }))
  );

  const pushDays = programs.map((p) => p.days.find((d) => d.session_type === "push"));

  // Check exercise count ranges per Section 27.12
  // 30m: 2-3 exercises
  assert.ok(pushDays[0].exercises.length >= 2 && pushDays[0].exercises.length <= 3, `30m expected 2-3 ex, got ${pushDays[0].exercises.length}`);
  // 45m: 3-5 exercises
  assert.ok(pushDays[1].exercises.length >= 3 && pushDays[1].exercises.length <= 5, `45m expected 3-5 ex, got ${pushDays[1].exercises.length}`);
  // 60m: 4-6 exercises
  assert.ok(pushDays[2].exercises.length >= 4 && pushDays[2].exercises.length <= 6, `60m expected 4-6 ex, got ${pushDays[2].exercises.length}`);
  // 75m: 5-7 exercises
  assert.ok(pushDays[3].exercises.length >= 5 && pushDays[3].exercises.length <= 7, `75m expected 5-7 ex, got ${pushDays[3].exercises.length}`);
  // 90m: 6-8 exercises
  assert.ok(pushDays[4].exercises.length >= 6 && pushDays[4].exercises.length <= 8, `90m expected 6-8 ex, got ${pushDays[4].exercises.length}`);

  // Total working sets must scale monotonically with duration
  const totalSets = pushDays.map((d) => d.totalSets || d.total_sets);
  for (let i = 0; i < totalSets.length - 1; i++) {
    assert.ok(totalSets[i] <= totalSets[i + 1], `Total sets should scale with duration: ${totalSets[i]} <= ${totalSets[i + 1]}`);
  }

  // Realistic duration estimation must scale monotonically
  const estTimes = pushDays.map((d) => d.estimatedDuration || d.estimated_duration_minutes);
  for (let i = 0; i < estTimes.length - 1; i++) {
    assert.ok(estTimes[i] <= estTimes[i + 1], `Estimated time should increase: ${estTimes[i]} <= ${estTimes[i + 1]}`);
  }

  // Section 27.4: No redundant movements in 75m/90m session
  const ninetyMinPushEx = pushDays[4].exercises.map((e) => e.exercise_id);
  const uniqueNinetyMinPushEx = new Set(ninetyMinPushEx);
  assert.equal(uniqueNinetyMinPushEx.size, ninetyMinPushEx.length, "Session should have zero duplicate exercises");
});

// ---------- 31. Split Ownership Absolute (Section 27.1) ----------
test("31. Split ownership is absolute: custom split days and muscle targets are never overwritten", () => {
  const custom5Day = [
    { day_name: "Chest + Triceps Focus", muscles: ["chest", "triceps"] },
    { day_name: "Back + Biceps Focus", muscles: ["back", "biceps"] },
    { day_name: "Rest Day A", is_rest: true },
    { day_name: "Legs Heavy", muscles: ["quads", "hamstrings", "glutes"] },
    { day_name: "Shoulder Day", muscles: ["front_delts", "side_delts", "rear_delts"] },
    { day_name: "Chest + Back Hypertrophy", muscles: ["chest", "back"] },
    { day_name: "Rest Day B", is_rest: true },
  ];

  const program = generateProgram(baseProfile({
    custom_split: custom5Day,
    experience: "advanced",
    goal: "hypertrophy",
  }));

  assert.equal(program.is_custom_split, true);
  const trainingDays = program.days.filter((d) => !d.is_rest_day);
  assert.equal(trainingDays.length, 5);

  // Day 1: Chest + Triceps
  assert.equal(trainingDays[0].session_name, "Chest + Triceps Focus");
  const d1Ex = trainingDays[0].exercises;
  assert.ok(d1Ex.some((e) => e.primary_muscle === "chest"));
  assert.ok(d1Ex.some((e) => e.primary_muscle === "triceps" || e.secondary_muscles.includes("triceps")));

  // Day 5: Chest + Back
  assert.equal(trainingDays[4].session_name, "Chest + Back Hypertrophy");
  const d5Ex = trainingDays[4].exercises;
  assert.ok(d5Ex.some((e) => e.primary_muscle === "chest"));
  assert.ok(d5Ex.some((e) => e.primary_muscle === "back"));
});

// ---------- 32. Separate Classification and Programming Role (Section 27.3) ----------
test("32. Exercises strictly maintain separate classification and programming_role", () => {
  const program = generateProgram(baseProfile({ days_per_week: 3, split_id: "3day_ppl", experience: "intermediate" }));
  const exercises = allExercises(program);

  for (const ex of exercises) {
    assert.ok(ex.classification, `${ex.name} missing classification`);
    assert.ok(ex.programming_role || ex.programmingRole, `${ex.name} missing programming_role`);
    assert.ok(["compound", "isolation", "accessory"].includes(ex.classification), `Invalid classification: ${ex.classification}`);
    assert.ok(
      ["primary_compound", "secondary_compound", "secondary_movement", "isolation", "accessory", "finisher"].includes(ex.programming_role || ex.programmingRole),
      `Invalid programming_role: ${ex.programming_role || ex.programmingRole}`
    );
  }

  const bench = exercises.find((e) => e.exercise_id === "bb_bench_press");
  if (bench) {
    assert.equal(bench.classification, "compound");
    assert.equal(bench.programming_role, "primary_compound");
  }
});

// ---------- 33. Stimulus Contribution Model (Section 27.6) ----------
test("33. Stimulus contribution model accounts for fractional secondary stimulus and effective sets", () => {
  const program = generateProgram(baseProfile({ days_per_week: 4, split_id: "4day_upper_lower", experience: "intermediate" }));
  const summary = program.weekly_volume_summary;

  assert.ok(summary.chest.direct_sets > 0);
  assert.ok(summary.triceps.secondary_sets > 0, "Pressing movements should contribute secondary sets to triceps");
  assert.ok(summary.front_delts.secondary_sets > 0, "Pressing movements should contribute secondary sets to front delts");

  // Effective volume is not a simple 1:1 set inflation
  assert.ok(summary.triceps.effective_sets > 0);
  assert.ok(summary.triceps.effective_sets < summary.triceps.direct_sets + summary.triceps.secondary_sets, "Secondary sets must have fractional contribution");
});

// ---------- 34. Deterministic Generation & Data Contract (Section 27.16 & 27.18) ----------
test("34. Generation is deterministic and adheres strictly to Section 27.18 data contract", () => {
  const profile = baseProfile({ days_per_week: 5, split_id: "5day_ppl_ul", experience: "advanced", session_duration_min: 75 });
  const prog1 = generateProgram(profile);
  const prog2 = generateProgram(profile);

  // Deterministic program generation
  assert.equal(prog1.days.length, prog2.days.length);
  for (let i = 0; i < prog1.days.length; i++) {
    const d1 = prog1.days[i];
    const d2 = prog2.days[i];
    assert.equal(d1.exercises.length, d2.exercises.length, `Day ${i + 1} exercise count mismatch`);
    for (let j = 0; j < d1.exercises.length; j++) {
      assert.equal(d1.exercises[j].exercise_id, d2.exercises[j].exercise_id, `Exercise mismatch at day ${i}, ex ${j}`);
      assert.equal(d1.exercises[j].sets, d2.exercises[j].sets);
      assert.equal(d1.exercises[j].rir, d2.exercises[j].rir);
    }
  }

  // Contract compliance: exercise object
  const ex = prog1.days[0].exercises[0];
  const requiredExFields = [
    "id", "name", "primaryMuscle", "secondaryMuscles", "classification",
    "programmingRole", "movementPattern", "equipment", "difficulty",
    "sets", "reps", "restSeconds", "rir", "alternatives", "progression",
    "stimulusContribution"
  ];
  for (const field of requiredExFields) {
    assert.ok(ex[field] !== undefined, `Exercise missing required contract field: ${field}`);
  }

  // Contract compliance: program object
  const requiredProgFields = [
    "goal", "experience", "frequency", "split", "equipment",
    "duration", "priorityMuscles", "weeklySchedule", "weeklyVolume",
    "progressionModel", "generationMetadata"
  ];
  for (const field of requiredProgFields) {
    assert.ok(prog1[field] !== undefined, `Program missing required contract field: ${field}`);
  }
});

console.log(results.join("\n"));
console.log(`\n${passed} passed, ${failed} failed (of ${passed + failed})`);
if (failed > 0) process.exit(1);


