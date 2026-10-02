import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import { store } from "./db/store.js";
import { generateProgram } from "./engines/programGenerator.js";
import { getAvailableSplits, SPLIT_LIBRARY } from "./engines/splitEngine.js";
import { logWorkoutSession, runAdaptationCheck } from "./engines/logAndAdapt.js";
import { handleExerciseChangeRequest } from "./engines/alternativeEngine.js";
import { computeNextTarget } from "./engines/progressionEngine.js";
import { EXERCISES } from "./data/exercises.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

const PORT = process.env.PORT || 3000;

// ---- Profile ----
app.post("/api/profile", (req, res) => {
  const profile = req.body;
  if (!profile.user_id) return res.status(400).json({ error: "user_id is required" });
  store.saveProfile(profile.user_id, profile);
  res.json({ saved: true, profile });
});

app.get("/api/profile/:userId", (req, res) => {
  const profile = store.getProfile(req.params.userId);
  if (!profile) return res.status(404).json({ error: "not found" });
  res.json(profile);
});

// ---- Split Library ----
app.get("/api/splits", (req, res) => {
  const days = req.query.days ? Number(req.query.days) : null;
  const splits = getAvailableSplits(days);
  res.json({ splits });
});

// ---- Program generation ----
app.post("/api/program/generate", (req, res) => {
  try {
    const profile = req.body.user_id ? req.body : { ...store.getProfile(req.body.user_id), ...req.body };
    const resolvedProfile = req.body.user_id && !req.body.goal ? store.getProfile(req.body.user_id) : profile;
    if (!resolvedProfile) return res.status(400).json({ error: "No profile found. POST /api/profile first or include full profile." });
    const program = generateProgram(resolvedProfile);
    store.saveProgram(program.program_id, program);
    res.json(program);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/program/:programId", (req, res) => {
  const program = store.getProgram(req.params.programId);
  if (!program) return res.status(404).json({ error: "not found" });
  res.json(program);
});

// ---- Progression preview (what should I aim for today?) ----
app.post("/api/progression/next-target", (req, res) => {
  const { user_id, exercise_id, prescription } = req.body;
  const history = store.getExerciseHistory(user_id, exercise_id);
  const exercise = EXERCISES.find((e) => e.exercise_id === exercise_id);
  const target = computeNextTarget({ history, prescription, exerciseName: exercise?.name ?? exercise_id });
  res.json(target);
});

// ---- Workout logging ----
app.post("/api/log", (req, res) => {
  try {
    const result = logWorkoutSession(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/history/:userId/:exerciseId", (req, res) => {
  res.json(store.getExerciseHistory(req.params.userId, req.params.exerciseId));
});

// ---- Exercise change ----
app.post("/api/exercise/change", (req, res) => {
  const { user_id, exercise_id, reason, available_equipment, exclude_ids } = req.body;
  try {
    const result = handleExerciseChangeRequest({
      exerciseId: exercise_id, reason, availableEquipment: available_equipment || [], excludeIds: exclude_ids || [],
    });

    store.updateUserExercisePreferences(user_id, (prefs) => {
      if (reason === "dislike") prefs.disliked = [...new Set([...prefs.disliked, exercise_id])];
      if (reason === "pain_discomfort") prefs.flagged_pain = [...new Set([...prefs.flagged_pain, exercise_id])];
      if (reason === "equipment_unavailable") prefs.equipment_unavailable = [...new Set([...prefs.equipment_unavailable, exercise_id])];
      return prefs;
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ---- Adaptation ----
app.get("/api/adaptation/:userId", (req, res) => {
  const result = runAdaptationCheck(req.params.userId);
  res.json(result);
});

app.get("/api/adaptation/:userId/events", (req, res) => {
  res.json(store.getAdaptationEvents(req.params.userId));
});

// ---- Reference data ----
app.get("/api/exercises", (req, res) => {
  res.json(EXERCISES);
});

app.listen(PORT, () => {
  console.log(`CLAWW Workout OS API listening on http://localhost:${PORT}`);
});
