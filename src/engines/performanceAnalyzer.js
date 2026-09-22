/**
 * PHASE 11 / spec section 20 — PERFORMANCE ANALYZER
 *
 * Reads ONLY observable training data (reps, sets, load, RIR, rest,
 * completion, substitutions, frequency, adherence). Never infers
 * hormones, CNS fatigue, biological readiness, biomarkers, recovery
 * physiology, or injury status — those aren't measurable from this data
 * and CLAWW does not pretend otherwise.
 *
 * Produces a qualitative trend classification per exercise, requiring
 * MULTIPLE observations before calling anything a "decline" — a single
 * bad session is never, by itself, a trend.
 */

function volumeLoad(entry) {
  if (entry.load == null) return entry.reps.reduce((a, b) => a + b, 0); // bodyweight: use total reps as proxy
  return entry.reps.reduce((sum, r) => sum + r, 0) * entry.load;
}

/**
 * Classifies the trend across the last N (default 4) sessions for one
 * exercise. Requires at least 3 data points to call a trend at all —
 * one bad workout is insufficient signal by design (spec section 21).
 */
export function analyzeExerciseTrend(history, { window = 4 } = {}) {
  const recent = history.slice(-window);

  if (recent.length < 3) {
    return { trend: "insufficient_data", confidence: "low", observations: recent.length };
  }

  const loads = recent.map(volumeLoad);
  const completions = recent.map((e) => e.completed !== false);
  const completedCount = completions.filter(Boolean).length;

  // Simple monotonic-ish trend check across the window, not a single-point threshold.
  let declines = 0, improves = 0;
  for (let i = 1; i < loads.length; i++) {
    if (loads[i] < loads[i - 1]) declines++;
    else if (loads[i] > loads[i - 1]) improves++;
  }

  const incompleteCount = recent.length - completedCount;

  const transitions = loads.length - 1;

  let trend;
  let confidence;
  if (declines === transitions && transitions >= 2) {
    // Monotonic decline across every consecutive session in the window — the
    // repetition itself is the signal, independent of completion status.
    trend = "repeated_decline";
    confidence = "high";
  } else if (declines >= Math.ceil(transitions * 0.66) && transitions >= 2) {
    // Majority of transitions declining, but not every single one — real
    // pattern, but weaker signal than a fully monotonic decline.
    trend = "repeated_decline";
    confidence = "moderate";
  } else if (improves >= transitions && transitions >= 2) {
    trend = "consistent_progress";
    confidence = "high";
  } else if (incompleteCount >= Math.ceil(recent.length * 0.75)) {
    trend = "repeated_incompletion";
    confidence = "moderate";
  } else {
    trend = "stable_or_mixed";
    confidence = "moderate";
  }

  return { trend, confidence, observations: recent.length, incomplete_count: incompleteCount };
}

/**
 * Session-level adherence: how many of the last `windowSessions` logged
 * workouts were actually completed vs skipped, purely from log presence.
 */
export function analyzeAdherence(workoutLogs, { windowSessions = 6 } = {}) {
  const recent = workoutLogs.slice(-windowSessions);
  if (recent.length === 0) return { adherence: "unknown", completed: 0, total: 0 };
  const completed = recent.filter((s) => s.completed !== false).length;
  const ratio = completed / recent.length;
  const adherence = ratio >= 0.8 ? "high" : ratio >= 0.5 ? "moderate" : "low";
  return { adherence, completed, total: recent.length, ratio };
}
