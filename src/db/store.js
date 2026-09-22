/**
 * PHASE 26 — DATABASE ARCHITECTURE (reference implementation)
 *
 * This is a lightweight JSON-file store standing in for a real relational
 * database, structured as the exact tables named in the spec so it can be
 * swapped for Postgres/etc. without touching any engine code:
 *
 *   profiles, training_preferences, exercise_history, training_programs,
 *   workout_sessions, workout_exercises, exercise_sets, exercise_logs,
 *   progression_state, adaptation_events, user_exercise_preferences,
 *   cardio_sessions
 *
 * (exercise_library / exercise_alternatives live in src/data/exercises.js
 * and the AlternativeEngine, since they are derived from static metadata
 * rather than mutated per-user.)
 *
 * Every engine talks to this module only through the functions below —
 * never touches the file system directly — so storage can be swapped later.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "claww_db.json");

const EMPTY = {
  profiles: {},                 // user_id -> profile
  training_preferences: {},     // user_id -> preferences/constraints
  training_programs: {},        // program_id -> program (weeks of sessions)
  exercise_history: {},         // user_id -> exercise_id -> [ {date, load, reps[], sets, rir, completed} ]
  progression_state: {},        // user_id -> exercise_id -> { stage, last_target, consecutive_top_of_range }
  adaptation_events: {},        // user_id -> [ {date, level, reason, detail} ]
  user_exercise_preferences: {}, // user_id -> { disliked: [], flagged_pain: [], equipment_unavailable: [] }
  workout_logs: {},             // user_id -> [ session_log ]
};

function load() {
  if (!fs.existsSync(DB_PATH)) return structuredClone(EMPTY);
  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    return { ...structuredClone(EMPTY), ...JSON.parse(raw) };
  } catch {
    return structuredClone(EMPTY);
  }
}

let DB = load();

function persist() {
  fs.writeFileSync(DB_PATH, JSON.stringify(DB, null, 2));
}

export const store = {
  reset() {
    DB = structuredClone(EMPTY);
    persist();
  },

  // ---- profiles ----
  saveProfile(userId, profile) {
    DB.profiles[userId] = profile;
    persist();
  },
  getProfile(userId) {
    return DB.profiles[userId] || null;
  },

  // ---- preferences / constraints ----
  savePreferences(userId, prefs) {
    DB.training_preferences[userId] = prefs;
    persist();
  },
  getPreferences(userId) {
    return DB.training_preferences[userId] || { disliked_exercises: [], preferred_exercises: [], injuries: [], exercise_restrictions: [] };
  },

  // ---- programs ----
  saveProgram(programId, program) {
    DB.training_programs[programId] = program;
    persist();
  },
  getProgram(programId) {
    return DB.training_programs[programId] || null;
  },
  getProgramsForUser(userId) {
    return Object.values(DB.training_programs).filter((p) => p.user_id === userId);
  },

  // ---- exercise history (source of truth for progression + adaptation) ----
  appendExerciseHistory(userId, exerciseId, entry) {
    DB.exercise_history[userId] ??= {};
    DB.exercise_history[userId][exerciseId] ??= [];
    DB.exercise_history[userId][exerciseId].push(entry);
    persist();
  },
  getExerciseHistory(userId, exerciseId) {
    return DB.exercise_history[userId]?.[exerciseId] || [];
  },

  // ---- progression state ----
  getProgressionState(userId, exerciseId) {
    return DB.progression_state[userId]?.[exerciseId] || null;
  },
  setProgressionState(userId, exerciseId, state) {
    DB.progression_state[userId] ??= {};
    DB.progression_state[userId][exerciseId] = state;
    persist();
  },

  // ---- adaptation events (explainable audit trail) ----
  appendAdaptationEvent(userId, event) {
    DB.adaptation_events[userId] ??= [];
    DB.adaptation_events[userId].push(event);
    persist();
  },
  getAdaptationEvents(userId) {
    return DB.adaptation_events[userId] || [];
  },

  // ---- user exercise preferences (learned from "Change Exercise") ----
  getUserExercisePreferences(userId) {
    return DB.user_exercise_preferences[userId] || { disliked: [], flagged_pain: [], equipment_unavailable: [] };
  },
  updateUserExercisePreferences(userId, updater) {
    const current = store.getUserExercisePreferences(userId);
    const next = updater(structuredClone(current));
    DB.user_exercise_preferences[userId] = next;
    persist();
    return next;
  },

  // ---- workout logs (full session logs, for performance analysis) ----
  appendWorkoutLog(userId, log) {
    DB.workout_logs[userId] ??= [];
    DB.workout_logs[userId].push(log);
    persist();
  },
  getWorkoutLogs(userId) {
    return DB.workout_logs[userId] || [];
  },
};
