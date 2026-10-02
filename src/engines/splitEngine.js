/**
 * CLAWW — SPLIT LIBRARY & CUSTOM SPLIT ENGINE
 *
 * Provides a rich library of recognizable training splits for 2-7 days,
 * and allows trainees to define custom splits without forcing a structure.
 *
 * In accordance with Core Flow & Philosophy:
 * - The user owns the training structure.
 * - The system builds workouts INSIDE the selected split.
 */

// ---------------------------------------------------------------------------
// Day Builders
// ---------------------------------------------------------------------------
export function fullBodyDay(label = "Full Body") {
  return { session_type: "full_body", name: label, emphasis_muscles: ["chest", "back", "quads", "hamstrings", "glutes", "core"] };
}
export function upperDay(label = "Upper Body") {
  return { session_type: "upper", name: label, emphasis_muscles: ["chest", "back", "front_delts", "side_delts", "rear_delts", "biceps", "triceps"] };
}
export function lowerDay(label = "Lower Body") {
  return { session_type: "lower", name: label, emphasis_muscles: ["quads", "hamstrings", "glutes", "calves", "core"] };
}
export function pushDay(label = "Push") {
  return { session_type: "push", name: label, emphasis_muscles: ["chest", "front_delts", "side_delts", "triceps"] };
}
export function pullDay(label = "Pull") {
  return { session_type: "pull", name: label, emphasis_muscles: ["back", "rear_delts", "biceps"] };
}
export function legsDay(label = "Legs") {
  return { session_type: "legs", name: label, emphasis_muscles: ["quads", "hamstrings", "glutes", "calves", "core"] };
}
export function chestDay(label = "Chest Focus") {
  return { session_type: "chest", name: label, emphasis_muscles: ["chest", "triceps", "front_delts"] };
}
export function backDay(label = "Back Focus") {
  return { session_type: "back", name: label, emphasis_muscles: ["back", "rear_delts", "biceps"] };
}
export function shouldersDay(label = "Shoulders") {
  return { session_type: "shoulders", name: label, emphasis_muscles: ["front_delts", "side_delts", "rear_delts"] };
}
export function legsQuadsDay(label = "Legs (Quad Focus)") {
  return { session_type: "quads_focus", name: label, emphasis_muscles: ["quads", "glutes", "calves"] };
}
export function legsHamstringsGlutesDay(label = "Legs (Hamstrings & Glutes)") {
  return { session_type: "posterior_focus", name: label, emphasis_muscles: ["hamstrings", "glutes", "calves"] };
}
export function armsDay(label = "Arms") {
  return { session_type: "arms", name: label, emphasis_muscles: ["biceps", "triceps", "forearms"] };
}
export function chestBackDay(label = "Chest & Back") {
  return { session_type: "chest_back", name: label, emphasis_muscles: ["chest", "back"] };
}
export function shouldersArmsDay(label = "Shoulders & Arms") {
  return { session_type: "shoulders_arms", name: label, emphasis_muscles: ["front_delts", "side_delts", "rear_delts", "biceps", "triceps"] };
}
export function torsoDay(label = "Torso") {
  return { session_type: "upper", name: label, emphasis_muscles: ["chest", "back", "front_delts", "side_delts"] };
}
export function limbsDay(label = "Limbs") {
  return { session_type: "lower", name: label, emphasis_muscles: ["quads", "hamstrings", "glutes", "biceps", "triceps"] };
}
export function conditioningCoreDay(label = "Conditioning & Core") {
  return { session_type: "conditioning", name: label, emphasis_muscles: ["core"] };
}
export function restDay() {
  return { session_type: "rest", name: "Rest", emphasis_muscles: [] };
}

// ---------------------------------------------------------------------------
// Split Library Registry
// ---------------------------------------------------------------------------
export const SPLIT_LIBRARY = {
  // 2 Days
  "2day_fullbody": {
    id: "2day_fullbody",
    name: "Full Body A / B",
    days_per_week: 2,
    description: "Two full-body sessions maximizing frequency and recovery between workouts.",
    schedule_pattern: [fullBodyDay("Full Body A"), fullBodyDay("Full Body B")],
    rest_pattern: [1, 0, 0, 1, 0, 0, 0], // Mon, Thu
  },
  "2day_upper_lower": {
    id: "2day_upper_lower",
    name: "Upper / Lower",
    days_per_week: 2,
    description: "Dedicated upper-body and lower-body workouts with full week recovery.",
    schedule_pattern: [upperDay("Upper Body"), lowerDay("Lower Body")],
    rest_pattern: [1, 0, 0, 1, 0, 0, 0],
  },
  "2day_torso_limbs": {
    id: "2day_torso_limbs",
    name: "Torso / Limbs",
    days_per_week: 2,
    description: "Chest & back paired together, followed by legs and arms.",
    schedule_pattern: [torsoDay("Torso (Chest & Back)"), limbsDay("Limbs (Legs & Arms)")],
    rest_pattern: [1, 0, 0, 1, 0, 0, 0],
  },

  // 3 Days
  "3day_fullbody": {
    id: "3day_fullbody",
    name: "Full Body (A / B / C)",
    days_per_week: 3,
    description: "The classic three-day full body split providing high frequency for every muscle group.",
    schedule_pattern: [fullBodyDay("Full Body A"), fullBodyDay("Full Body B"), fullBodyDay("Full Body C")],
    rest_pattern: [1, 0, 1, 0, 1, 0, 0], // Mon, Wed, Fri
  },
  "3day_ppl": {
    id: "3day_ppl",
    name: "Push / Pull / Legs",
    days_per_week: 3,
    description: "One dedicated push, pull, and leg day per week with maximum recovery.",
    schedule_pattern: [pushDay("Push"), pullDay("Pull"), legsDay("Legs")],
    rest_pattern: [1, 0, 1, 0, 1, 0, 0],
  },
  "3day_upper_lower_fb": {
    id: "3day_upper_lower_fb",
    name: "Upper / Lower / Full Body",
    days_per_week: 3,
    description: "Upper and lower foundation followed by a high-intensity full-body anchor session.",
    schedule_pattern: [upperDay("Upper Body"), lowerDay("Lower Body"), fullBodyDay("Full Body Anchor")],
    rest_pattern: [1, 0, 1, 0, 1, 0, 0],
  },

  // 4 Days
  "4day_upper_lower": {
    id: "4day_upper_lower",
    name: "Upper / Lower / Upper / Lower",
    days_per_week: 4,
    description: "The gold standard 4-day split hitting every muscle group twice a week with optimal recovery.",
    schedule_pattern: [upperDay("Upper A"), lowerDay("Lower A"), upperDay("Upper B"), lowerDay("Lower B")],
    rest_pattern: [1, 1, 0, 1, 1, 0, 0], // Mon, Tue, Thu, Fri
  },
  "4day_pp_pp": {
    id: "4day_pp_pp",
    name: "Push / Pull / Push / Pull",
    days_per_week: 4,
    description: "Alternating anterior (push + quads) and posterior (pull + hamstrings) days.",
    schedule_pattern: [pushDay("Push & Quads A"), pullDay("Pull & Hamstrings A"), pushDay("Push & Quads B"), pullDay("Pull & Hamstrings B")],
    rest_pattern: [1, 1, 0, 1, 1, 0, 0],
  },
  "4day_ppl_upper": {
    id: "4day_ppl_upper",
    name: "Push / Pull / Legs / Upper",
    days_per_week: 4,
    description: "Dedicated push, pull, and legs sessions plus an upper-body hypertrophy booster.",
    schedule_pattern: [pushDay("Push"), pullDay("Pull"), legsDay("Legs"), upperDay("Upper Focus")],
    rest_pattern: [1, 1, 0, 1, 1, 0, 0],
  },
  "4day_fullbody": {
    id: "4day_fullbody",
    name: "Full Body x 4 (Undulating)",
    days_per_week: 4,
    description: "Four undulating full-body sessions varying intensity and movement emphasis.",
    schedule_pattern: [fullBodyDay("Full Body A"), fullBodyDay("Full Body B"), fullBodyDay("Full Body C"), fullBodyDay("Full Body D")],
    rest_pattern: [1, 1, 0, 1, 1, 0, 0],
  },

  // 5 Days
  "5day_ppl_ul": {
    id: "5day_ppl_ul",
    name: "Push / Pull / Legs / Upper / Lower",
    days_per_week: 5,
    description: "One of the most popular 5-day structures balancing high frequency and dedicated leg volume.",
    schedule_pattern: [pushDay("Push"), pullDay("Pull"), legsDay("Legs"), upperDay("Upper"), lowerDay("Lower")],
    rest_pattern: [1, 1, 1, 0, 1, 1, 0], // Mon, Tue, Wed, Fri, Sat
  },
  "5day_ppl_uf": {
    id: "5day_ppl_uf",
    name: "Push / Pull / Legs / Upper / Full Body",
    days_per_week: 5,
    description: "Push, Pull, Legs followed by an Upper session and a Full Body finisher.",
    schedule_pattern: [pushDay("Push"), pullDay("Pull"), legsDay("Legs"), upperDay("Upper"), fullBodyDay("Full Body")],
    rest_pattern: [1, 1, 1, 0, 1, 1, 0],
  },
  "5day_ul_ppl": {
    id: "5day_ul_ppl",
    name: "Upper / Lower / Push / Pull / Legs",
    days_per_week: 5,
    description: "Heavy upper and lower days early in the week, followed by PPL hypertrophy sessions.",
    schedule_pattern: [upperDay("Upper Heavy"), lowerDay("Lower Heavy"), pushDay("Push Hypertrophy"), pullDay("Pull Hypertrophy"), legsDay("Legs Hypertrophy")],
    rest_pattern: [1, 1, 0, 1, 1, 1, 0],
  },
  "5day_bro_split_1": {
    id: "5day_bro_split_1",
    name: "Chest / Back / Shoulders / Legs / Arms",
    days_per_week: 5,
    description: "Classic bodybuilding single muscle-group specialization split.",
    schedule_pattern: [chestDay("Chest"), backDay("Back"), shouldersDay("Shoulders"), legsDay("Legs"), armsDay("Arms")],
    rest_pattern: [1, 1, 1, 0, 1, 1, 0],
  },
  "5day_bro_split_2": {
    id: "5day_bro_split_2",
    name: "Chest / Back / Legs / Shoulders / Arms",
    days_per_week: 5,
    description: "Traditional body-part split placing leg day in the middle of the week.",
    schedule_pattern: [chestDay("Chest"), backDay("Back"), legsDay("Legs"), shouldersDay("Shoulders"), armsDay("Arms")],
    rest_pattern: [1, 1, 1, 0, 1, 1, 0],
  },
  "5day_ul_ul_fb": {
    id: "5day_ul_ul_fb",
    name: "Upper / Lower / Upper / Lower / Full Body",
    days_per_week: 5,
    description: "Two upper/lower rotations capped with a full-body conditioning session.",
    schedule_pattern: [upperDay("Upper A"), lowerDay("Lower A"), upperDay("Upper B"), lowerDay("Lower B"), fullBodyDay("Full Body")],
    rest_pattern: [1, 1, 0, 1, 1, 1, 0],
  },
  "5day_fullbody": {
    id: "5day_fullbody",
    name: "Full Body x 5",
    days_per_week: 5,
    description: "Five low-fatigue, high-frequency full-body sessions.",
    schedule_pattern: [fullBodyDay("Full Body 1"), fullBodyDay("Full Body 2"), fullBodyDay("Full Body 3"), fullBodyDay("Full Body 4"), fullBodyDay("Full Body 5")],
    rest_pattern: [1, 1, 1, 0, 1, 1, 0],
  },

  // 6 Days
  "6day_ppl_x2": {
    id: "6day_ppl_x2",
    name: "Push / Pull / Legs / Push / Pull / Legs (PPL x 2)",
    days_per_week: 6,
    description: "The gold standard 6-day split giving every muscle group two dedicated weekly sessions.",
    schedule_pattern: [pushDay("Push A"), pullDay("Pull A"), legsDay("Legs A"), pushDay("Push B"), pullDay("Pull B"), legsDay("Legs B")],
    rest_pattern: [1, 1, 1, 0, 1, 1, 1], // Mon-Wed, Fri-Sun
  },
  "6day_ul_x3": {
    id: "6day_ul_x3",
    name: "Upper / Lower x 3",
    days_per_week: 6,
    description: "High-frequency upper/lower rotation for trainees who recover well.",
    schedule_pattern: [upperDay("Upper 1"), lowerDay("Lower 1"), upperDay("Upper 2"), lowerDay("Lower 2"), upperDay("Upper 3"), lowerDay("Lower 3")],
    rest_pattern: [1, 1, 1, 1, 1, 1, 0],
  },
  "6day_ppl_ul_arms": {
    id: "6day_ppl_ul_arms",
    name: "Push / Pull / Legs / Upper / Lower / Arms & Weak Points",
    days_per_week: 6,
    description: "A hybrid PPL + Upper/Lower with a 6th day dedicated to arms and weak points.",
    schedule_pattern: [pushDay("Push"), pullDay("Pull"), legsDay("Legs"), upperDay("Upper"), lowerDay("Lower"), armsDay("Arms & Weak Points")],
    rest_pattern: [1, 1, 1, 0, 1, 1, 1],
  },
  "6day_arnold": {
    id: "6day_arnold",
    name: "Arnold Split (Chest & Back / Shoulders & Arms / Legs x 2)",
    days_per_week: 6,
    description: "Antagonist pairing split popularized by Arnold Schwarzenegger for massive upper-body pumps.",
    schedule_pattern: [chestBackDay("Chest & Back A"), shouldersArmsDay("Shoulders & Arms A"), legsDay("Legs A"), chestBackDay("Chest & Back B"), shouldersArmsDay("Shoulders & Arms B"), legsDay("Legs B")],
    rest_pattern: [1, 1, 1, 0, 1, 1, 1],
  },
  "6day_bodypart": {
    id: "6day_bodypart",
    name: "Chest / Back / Quads / Shoulders / Hamstrings & Glutes / Arms",
    days_per_week: 6,
    description: "Detailed body-part specialization separating anterior and posterior leg training.",
    schedule_pattern: [chestDay("Chest"), backDay("Back"), legsQuadsDay("Quads & Calves"), shouldersDay("Shoulders"), legsHamstringsGlutesDay("Hamstrings & Glutes"), armsDay("Arms")],
    rest_pattern: [1, 1, 1, 0, 1, 1, 1],
  },

  // 7 Days
  "7day_ppl_ul_active": {
    id: "7day_ppl_ul_active",
    name: "Push / Pull / Legs / Upper / Lower / Conditioning / Mobility",
    days_per_week: 7,
    description: "5 heavy resistance days + 1 conditioning day + 1 active recovery/core day.",
    schedule_pattern: [pushDay("Push"), pullDay("Pull"), legsDay("Legs"), upperDay("Upper"), lowerDay("Lower"), conditioningCoreDay("Conditioning & Core"), conditioningCoreDay("Active Recovery & Mobility")],
    rest_pattern: [1, 1, 1, 1, 1, 1, 1],
  },
  "7day_bodypart": {
    id: "7day_bodypart",
    name: "Chest / Back / Quads / Shoulders / Hamstrings & Glutes / Arms / Core",
    days_per_week: 7,
    description: "A complete 7-day specialization split for daily training enthusiasts.",
    schedule_pattern: [chestDay("Chest"), backDay("Back"), legsQuadsDay("Quads"), shouldersDay("Shoulders"), legsHamstringsGlutesDay("Hamstrings & Glutes"), armsDay("Arms"), conditioningCoreDay("Core & Recovery")],
    rest_pattern: [1, 1, 1, 1, 1, 1, 1],
  },
  "7day_ppl_x2_active": {
    id: "7day_ppl_x2_active",
    name: "PPL x 2 + Active Recovery & Core",
    days_per_week: 7,
    description: "Full PPL x 2 rotation followed by light active recovery and core work on day 7.",
    schedule_pattern: [pushDay("Push A"), pullDay("Pull A"), legsDay("Legs A"), pushDay("Push B"), pullDay("Pull B"), legsDay("Legs B"), conditioningCoreDay("Active Recovery")],
    rest_pattern: [1, 1, 1, 1, 1, 1, 1],
  },
};

// ---------------------------------------------------------------------------
// Split Retrieval
// ---------------------------------------------------------------------------
export function getAvailableSplits(daysPerWeek) {
  const allSplits = Object.values(SPLIT_LIBRARY);
  if (!daysPerWeek) return allSplits;
  return allSplits.filter((s) => s.days_per_week === Number(daysPerWeek));
}

// ---------------------------------------------------------------------------
// Custom Split Parser
// ---------------------------------------------------------------------------
/**
 * Accepts user-defined custom days and parses them into structured training sessions.
 * Example input:
 * [
 *   { day_name: "Monday", muscles: ["chest", "triceps"] },
 *   { day_name: "Tuesday", muscles: ["back", "biceps"] },
 *   { day_name: "Wednesday", is_rest: true },
 *   { day_name: "Thursday", muscles: ["quads", "hamstrings", "glutes"] },
 *   { day_name: "Friday", muscles: ["front_delts", "side_delts", "rear_delts"] },
 *   { day_name: "Saturday", muscles: ["chest", "back"] },
 *   { day_name: "Sunday", is_rest: true },
 * ]
 */
export function parseCustomSplit(customDays) {
  if (!Array.isArray(customDays) || customDays.length === 0) {
    throw new Error("Custom split must provide an array of days.");
  }

  const days = customDays.map((d, index) => {
    if (d.is_rest || !d.muscles || d.muscles.length === 0) {
      return { day_index: index + 1, session_type: "rest", name: d.day_name || `Day ${index + 1} (Rest)`, emphasis_muscles: [] };
    }

    const muscles = Array.from(new Set(d.muscles.map((m) => m.toLowerCase())));
    const sessionType = deriveSessionTypeFromMuscles(muscles);
    const label = d.day_name || muscles.map(capitalize).join(" + ");

    return {
      day_index: index + 1,
      session_type: sessionType,
      name: label,
      emphasis_muscles: muscles,
    };
  });

  const trainingDaysCount = days.filter((d) => d.session_type !== "rest").length;

  return {
    daysPerWeek: trainingDaysCount,
    split_id: "custom",
    is_custom: true,
    days,
    rationale: `User-defined custom split (${trainingDaysCount} training days) targeting specific muscle pairings.`,
  };
}

function deriveSessionTypeFromMuscles(muscles) {
  const hasChest = muscles.includes("chest");
  const hasBack = muscles.includes("back");
  const hasLegs = muscles.some((m) => ["quads", "hamstrings", "glutes", "calves"].includes(m));
  const hasShoulders = muscles.some((m) => ["front_delts", "side_delts", "rear_delts"].includes(m));
  const hasArms = muscles.some((m) => ["biceps", "triceps"].includes(m));

  if (hasChest && hasBack && hasLegs) return "full_body";
  if (hasChest && hasBack) return "chest_back";
  if (hasChest && hasShoulders && hasArms) return "push";
  if (hasBack && hasArms && !hasChest) return "pull";
  if (hasLegs && !hasChest && !hasBack) return "legs";
  if (hasChest && !hasBack && !hasLegs) return "chest";
  if (hasBack && !hasChest && !hasLegs) return "back";
  if (hasShoulders && hasArms && !hasChest && !hasBack) return "shoulders_arms";
  if (hasShoulders && !hasChest && !hasBack && !hasLegs) return "shoulders";
  if (hasArms && !hasChest && !hasBack && !hasLegs) return "arms";
  if (!hasLegs && (hasChest || hasBack || hasShoulders)) return "upper";
  return "custom";
}

function capitalize(s) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Main Split Builder (Orchestrator)
// ---------------------------------------------------------------------------
export function buildSplit({ daysPerWeek = 3, splitId = null, customSplit = null, experienceLevel = "beginner", goal = "general_fitness" }) {
  // 1. Custom split takes immediate precedence
  if (customSplit && Array.isArray(customSplit) && customSplit.length > 0) {
    return parseCustomSplit(customSplit);
  }

  // 2. Specific split template requested by ID
  if (splitId && SPLIT_LIBRARY[splitId]) {
    const template = SPLIT_LIBRARY[splitId];
    const week = assembleWeekFromTemplate(template);
    return {
      daysPerWeek: template.days_per_week,
      split_id: template.id,
      name: template.name,
      days: week,
      rationale: template.description,
    };
  }

  // 3. Fallback to sensible defaults matching existing test expectations
  const numDays = Math.max(2, Math.min(7, Number(daysPerWeek)));
  let defaultSplitId;

  switch (numDays) {
    case 2:
      defaultSplitId = "2day_fullbody";
      break;
    case 3:
      defaultSplitId = "3day_fullbody";
      break;
    case 4:
      defaultSplitId = "4day_upper_lower";
      break;
    case 5:
      if (experienceLevel === "beginner") {
        defaultSplitId = "5day_ul_ul_fb";
      } else if (goal === "endurance") {
        defaultSplitId = "5day_ppl_uf";
      } else {
        defaultSplitId = "5day_ppl_ul";
      }
      break;
    case 6:
      defaultSplitId = "6day_ppl_x2";
      break;
    case 7:
      defaultSplitId = "7day_ppl_ul_active";
      break;
  }

  const template = SPLIT_LIBRARY[defaultSplitId] || SPLIT_LIBRARY["3day_fullbody"];
  const week = assembleWeekFromTemplate(template);

  return {
    daysPerWeek: template.days_per_week,
    split_id: template.id,
    name: template.name,
    days: week,
    rationale: template.description,
  };
}

function assembleWeekFromTemplate(template) {
  const week = [];
  let trainingIdx = 0;

  for (let slot = 0; slot < 7; slot++) {
    const isTraining = template.rest_pattern[slot] === 1;
    if (isTraining && trainingIdx < template.schedule_pattern.length) {
      const daySpec = template.schedule_pattern[trainingIdx];
      week.push({
        day_index: slot + 1,
        session_type: daySpec.session_type,
        name: daySpec.name,
        emphasis_muscles: [...daySpec.emphasis_muscles],
      });
      trainingIdx++;
    } else {
      week.push({
        day_index: slot + 1,
        session_type: "rest",
        name: "Rest",
        emphasis_muscles: [],
      });
    }
  }

  return week;
}
