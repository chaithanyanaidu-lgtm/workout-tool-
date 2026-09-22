/**
 * ORCHESTRATOR — WORKOUT LOGGING -> PERFORMANCE ANALYSIS -> ADAPTATION
 *
 * PHASE 11/12: takes a completed session log from the UI, writes it to
 * exercise_history + progression_state, then asks the adaptation engine
 * whether anything about the *program* should change (it does NOT
 * decide today's numbers — progressionEngine already told the user what
 * to attempt before the session started).
 */

import { store } from "../db/store.js";
import { evaluateExerciseAdaptation, evaluateProgramAdaptation, toAdaptationEvent } from "./adaptationEngine.js";
import { getExerciseById } from "../data/exercises.js";

/**
 * sessionLog: {
 *   user_id, date, session_name, completed,
 *   exercises: [ { exercise_id, load, reps: [n,n,n], sets, rir, completed } ]
 * }
 */
export function logWorkoutSession(sessionLog) {
  const { user_id } = sessionLog;

  for (const entry of sessionLog.exercises) {
    store.appendExerciseHistory(user_id, entry.exercise_id, {
      date: sessionLog.date,
      load: entry.load ?? null,
      reps: entry.reps,
      sets: entry.sets,
      rir: entry.rir ?? null,
      completed: entry.completed !== false,
    });
  }

  store.appendWorkoutLog(user_id, {
    date: sessionLog.date,
    session_name: sessionLog.session_name,
    completed: sessionLog.completed !== false,
    exercise_ids: sessionLog.exercises.map((e) => e.exercise_id),
  });

  return { logged: true, exercises_logged: sessionLog.exercises.length };
}

/**
 * Runs the adaptation engine across every exercise the user has history
 * for, then a program-level rollup. Persists every decision as an
 * adaptation_event for auditability/explainability (spec section 24).
 */
export function runAdaptationCheck(userId) {
  const workoutLogs = store.getWorkoutLogs(userId);
  const exerciseIds = new Set();
  for (const log of workoutLogs) for (const id of log.exercise_ids) exerciseIds.add(id);

  const exerciseEvaluations = [];
  for (const exerciseId of exerciseIds) {
    const history = store.getExerciseHistory(userId, exerciseId);
    const exercise = getExerciseById(exerciseId);
    const decision = evaluateExerciseAdaptation({ exerciseName: exercise?.name ?? exerciseId, history });
    exerciseEvaluations.push({ exercise_id: exerciseId, ...decision });

    if (decision.level > 0) {
      store.appendAdaptationEvent(userId, toAdaptationEvent({ userId, scope: "exercise", exerciseId, decision: decision }));
    }
  }

  const programDecision = evaluateProgramAdaptation({ exerciseEvaluations, workoutLogs });
  if (programDecision.level > 0) {
    store.appendAdaptationEvent(userId, toAdaptationEvent({ userId, scope: "program", decision: programDecision }));
  }

  return { exercise_evaluations: exerciseEvaluations, program_decision: programDecision };
}
