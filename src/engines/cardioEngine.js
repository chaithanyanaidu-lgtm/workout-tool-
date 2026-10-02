/**
 * CLAWW — CARDIO ENGINE
 *
 * Prescribes goal-aware cardiovascular work.
 * Supports all 8 training goals plus aliases.
 */

import { EXERCISES, resolveEquipmentPreset } from "../data/exercises.js";

const GOAL_CARDIO_POLICY = {
  hypertrophy: { weekly_sessions: 1, intensity: "low", rationale: "A small amount of low-intensity cardio supports recovery and cardiovascular health without competing with the hypertrophy stimulus." },
  bulking: { weekly_sessions: 1, intensity: "low", rationale: "A small amount of low-intensity cardio supports recovery and cardiovascular health without competing with the hypertrophy stimulus." },
  strength: { weekly_sessions: 1, intensity: "low", rationale: "Low-intensity cardio keeps work capacity high while preserving energy for heavy strength lifts." },
  fat_loss: { weekly_sessions: 3, intensity: "moderate", rationale: "Cardio is added to support the energy deficit while resistance training is prioritized to retain muscle." },
  cutting: { weekly_sessions: 3, intensity: "moderate", rationale: "Cardio is added to support the energy deficit while resistance training is prioritized to retain muscle." },
  recomposition: { weekly_sessions: 2, intensity: "low_to_moderate", rationale: "Moderate cardio supports energy balance recomposition needs without undermining strength/hypertrophy work." },
  endurance: { weekly_sessions: 4, intensity: "mixed", rationale: "Aerobic development is the primary goal, so cardio frequency and variety (steady-state + intervals) is prioritized." },
  general_fitness: { weekly_sessions: 2, intensity: "low_to_moderate", rationale: "General cardiovascular fitness is supported without displacing strength and muscle-development work." },
  athletic_performance: { weekly_sessions: 2, intensity: "mixed", rationale: "Conditioning and interval work support athletic work capacity and sports readiness." },
  beginner_fitness: { weekly_sessions: 2, intensity: "low", rationale: "Low-impact aerobic base building to develop consistent exercise habits safely." },
};

export function planWeeklyCardio({ goal = "general_fitness", availableEquipment, cardioPreference, lowerBodyTrainingLoad, availableExtraMinutes }) {
  const policy = GOAL_CARDIO_POLICY[goal] || GOAL_CARDIO_POLICY.general_fitness;
  let sessions = policy.weekly_sessions;

  const resolvedEquip = resolveEquipmentPreset(availableEquipment);

  // If lower-body resistance load is already high this week, avoid stacking high-impact cardio on top.
  const highLowerLoad = lowerBodyTrainingLoad === "high";
  const modality = pickModality({ availableEquipment: resolvedEquip, cardioPreference, avoidImpact: highLowerLoad });

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
  const isCardio = (e) => e.movement_pattern === "cardio" || e.classification === "cardio" || e.type === "cardio";

  if (cardioPreference && EXERCISES.some((e) => e.exercise_id === cardioPreference && isCardio(e))) {
    const preferred = EXERCISES.find((e) => e.exercise_id === cardioPreference);
    if (preferred.equipment.some((eq) => availableEquipment.includes(eq))) {
      if (!(avoidImpact && preferred.substitution_group === "cardio_impact")) return preferred.exercise_id;
    }
  }
  const candidates = EXERCISES.filter((e) => isCardio(e) && e.equipment.some((eq) => availableEquipment.includes(eq)));
  const pool = avoidImpact ? candidates.filter((e) => e.substitution_group !== "cardio_impact") : candidates;
  return (pool[0] || candidates[0] || EXERCISES.find((e) => e.exercise_id === "walking")).exercise_id;
}
