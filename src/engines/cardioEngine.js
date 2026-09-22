/**
 * PHASE 19 — CARDIO ENGINE
 *
 * No arbitrary "cutting = 30% cardio" rule. Cardio prescription depends
 * on goal, current cardio habits, resistance-training load that day,
 * available time, preference, and endurance requirement.
 */

import { EXERCISES } from "../data/exercises.js";

const GOAL_CARDIO_POLICY = {
  bulking: { weekly_sessions: 1, intensity: "low", rationale: "A small amount of low-intensity cardio supports recovery and cardiovascular health without competing with the hypertrophy stimulus." },
  cutting: { weekly_sessions: 3, intensity: "moderate", rationale: "Cardio is added to help create the energy deficit while resistance training is prioritized to retain muscle." },
  recomposition: { weekly_sessions: 2, intensity: "low_to_moderate", rationale: "Moderate cardio supports the energy balance recomposition needs without undermining strength/hypertrophy work." },
  endurance: { weekly_sessions: 4, intensity: "mixed", rationale: "Aerobic development is the primary goal, so cardio frequency and variety (steady-state + intervals) is prioritized." },
  general_fitness: { weekly_sessions: 2, intensity: "low_to_moderate", rationale: "General cardiovascular fitness is supported without displacing strength and muscle-development work." },
};

export function planWeeklyCardio({ goal, availableEquipment, cardioPreference, lowerBodyTrainingLoad, availableExtraMinutes }) {
  const policy = GOAL_CARDIO_POLICY[goal];
  let sessions = policy.weekly_sessions;

  // If lower-body resistance load is already high this week, avoid stacking high-impact cardio on top.
  const highLowerLoad = lowerBodyTrainingLoad === "high";
  const modality = pickModality({ availableEquipment, cardioPreference, avoidImpact: highLowerLoad });

  if (availableExtraMinutes != null && availableExtraMinutes < 10) sessions = Math.max(0, sessions - 1);

  const exercise = EXERCISES.find((e) => e.exercise_id === modality);

  return {
    weekly_sessions: sessions,
    modality,
    modality_name: exercise?.name ?? modality,
    intensity: policy.intensity,
    avoided_high_impact_due_to_leg_load: highLowerLoad,
    rationale: policy.rationale + (highLowerLoad ? " Lower-impact cardio was chosen this week because your leg training load is already high." : ""),
  };
}

function pickModality({ availableEquipment, cardioPreference, avoidImpact }) {
  if (cardioPreference && EXERCISES.some((e) => e.exercise_id === cardioPreference && e.category === "cardio")) {
    const preferred = EXERCISES.find((e) => e.exercise_id === cardioPreference);
    if (preferred.equipment.some((eq) => availableEquipment.includes(eq))) {
      if (!(avoidImpact && preferred.substitution_group === "cardio_impact")) return preferred.exercise_id;
    }
  }
  const candidates = EXERCISES.filter((e) => e.category === "cardio" && e.equipment.some((eq) => availableEquipment.includes(eq)));
  const pool = avoidImpact ? candidates.filter((e) => e.substitution_group !== "cardio_impact") : candidates;
  return (pool[0] || candidates[0] || EXERCISES.find((e) => e.exercise_id === "walking")).exercise_id;
}
