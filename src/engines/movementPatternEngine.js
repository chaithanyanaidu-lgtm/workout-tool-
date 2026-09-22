/**
 * PHASE 5 (cont.) — MOVEMENT PATTERN ENGINE
 *
 * Determines which movement patterns a given session_type actually
 * needs, rather than forcing every pattern into every session.
 */

const UPPER_PATTERNS = ["horizontal_push", "horizontal_pull", "vertical_push", "vertical_pull", "elbow_flexion", "elbow_extension", "lateral_raise", "rear_delt"];
const LOWER_PATTERNS = ["squat", "hip_hinge", "knee_flexion", "hip_extension", "calves", "core"];

const SESSION_TYPE_PATTERNS = {
  full_body: ["horizontal_push", "vertical_pull", "squat", "hip_hinge", "core"],
  upper: UPPER_PATTERNS,
  lower: LOWER_PATTERNS,
  push: ["horizontal_push", "vertical_push", "lateral_raise", "elbow_extension"],
  pull: ["horizontal_pull", "vertical_pull", "rear_delt", "elbow_flexion"],
  legs: LOWER_PATTERNS,
};

/**
 * Returns the ordered list of movement patterns required for a session,
 * with a `role` tag (primary/secondary/accessory) that the session
 * generator uses to order and prioritize exercises.
 */
export function getRequiredPatterns(sessionType) {
  const patterns = SESSION_TYPE_PATTERNS[sessionType] || [];
  return patterns.map((pattern, idx) => ({
    pattern,
    role: idx === 0 ? "primary" : idx <= 2 ? "secondary" : "accessory",
  }));
}
