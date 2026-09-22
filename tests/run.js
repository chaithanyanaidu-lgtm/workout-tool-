import assert from "node:assert/strict";
import { generateProgram } from "../src/engines/programGenerator.js";
import { handleExerciseChangeRequest, getAlternatives } from "../src/engines/alternativeEngine.js";
import { computeNextTarget } from "../src/engines/progressionEngine.js";
import { evaluateExerciseAdaptation } from "../src/engines/adaptationEngine.js";
import { validateSession, validateWeeklyVolume } from "../src/engines/validationEngine.js";
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

console.log(results.join("\n"));
console.log(`\n${passed} passed, ${failed} failed (of ${passed + failed})`);
if (failed > 0) process.exit(1);
