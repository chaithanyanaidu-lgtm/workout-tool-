# CLAWW — Workout Operating System

A deterministic, explainable strength & conditioning program generator and
adaptation engine. CLAWW builds structured training programs from your
profile, tracks what you actually perform, and makes controlled,
explainable adjustments over time — it does not invent workouts with an
LLM, does not use fake percentage allocations, and does not use fake
physiological metrics or hard numeric thresholds.

## Philosophy

```
USER PROFILE → GOAL ENGINE → TRAINING LEVEL → AVAILABILITY → EQUIPMENT →
CONSTRAINTS → SPLIT ENGINE → MUSCLE/MOVEMENT VOLUME ENGINE →
EXERCISE SELECTION → ALTERNATIVE ENGINE → SET/REP/RIR/REST PRESCRIPTION →
SESSION GENERATOR → VALIDATION → WORKOUT LOGGING → PERFORMANCE ANALYSIS →
ADAPTATION ENGINE → NEXT SESSION / NEXT WEEK
```

Four clean responsibilities, kept separate on purpose:

1. **Program Generator** — decides *what* you train (`src/engines/programGenerator.js`).
2. **Progression Engine** — decides *how* you progress week to week (`src/engines/progressionEngine.js`).
3. **Adaptation Engine** — decides *whether* the existing program needs to change, from real logged behaviour, using the smallest effective intervention (`src/engines/adaptationEngine.js`).
4. **(Optional) LLM layer** — would only ever *explain* the above in natural language. It is not implemented here and is never the source of truth for training prescriptions — every explanation string in this system is generated deterministically by the engine that made the decision.

No hard-coded thresholds like `IF RQS < 72 → reduce volume 15%` exist anywhere in this codebase. Adaptation decisions are driven by trend + confidence + repetition across multiple logged sessions (see `performanceAnalyzer.js` and `adaptationEngine.js`), and a single bad workout never rewrites the program.

## Running it

```bash
npm install
npm start        # API + frontend at http://localhost:3000
npm test         # 20 required test scenarios (src/data, engines, adaptation)
```

Open `http://localhost:3000` for the UI: fill in goal/experience/equipment,
it generates your weekly program, lets you log sets, previews your
progression target for each exercise, offers purpose-preserving exercise
swaps ("Change Exercise"), and shows an adaptation feed explaining any
change to your program in plain language.

## Architecture

```
src/
  data/exercises.js        Phase 1 — structured exercise database
  db/store.js               Phase 26 — table-shaped JSON persistence (swap for real DB later)
  engines/
    goalEngine.js            Phase 3  — goal priority profiles (not % allocations)
    experienceEngine.js       Phase 3  — beginner/intermediate/advanced complexity
    splitEngine.js             Phase 4  — weekly day/split structure
    volumeEngine.js             Phase 5  — weekly muscle volume targets + distribution
    movementPatternEngine.js     Phase 5  — required movement coverage per session type
    selectionEngine.js            Phase 6  — exercise selection with program stability
    alternativeEngine.js           Phase 2/12 — purpose-preserving substitutions, "Change Exercise"
    prescriptionEngine.js           Phase 7  — sets/reps/RIR/rest/progression method
    cardioEngine.js                  Phase 19 — goal-aware cardio planning
    sessionGenerator.js               Phase 8/15-18 — warm-up, time-fit, supersets, assembly
    progressionEngine.js               Phase 9/14 — progressive overload from logged history
    performanceAnalyzer.js              Phase 11/20 — trend classification from observable data only
    adaptationEngine.js                  Phase 12/20-23 — graded Level 0-5 adaptation decisions
    validationEngine.js                   Phase 13/30 — pre-flight checks before a session ships
    programGenerator.js                    Orchestrator tying the above into a full weekly program
    logAndAdapt.js                          Orchestrator for logging + running adaptation checks
  server.js                Express API
public/                    Frontend (vanilla JS, no build step)
tests/run.js                20 required test scenarios (Phase 14/31)
```

## API

| Endpoint | Purpose |
|---|---|
| `POST /api/profile` | Save a user profile |
| `POST /api/program/generate` | Generate a weekly program for a user |
| `GET /api/program/:programId` | Fetch a saved program |
| `POST /api/progression/next-target` | Preview today's target for one exercise |
| `POST /api/log` | Log a completed workout session |
| `GET /api/history/:userId/:exerciseId` | Exercise history |
| `POST /api/exercise/change` | "Change Exercise" — equipment / too difficult / dislike / pain |
| `GET /api/adaptation/:userId` | Run the adaptation engine and get explained decisions |
| `GET /api/adaptation/:userId/events` | Adaptation audit trail |
| `GET /api/exercises` | Full exercise database |

## Design choices worth knowing about

- **Alternative engine preserves training purpose.** A bench press swap
  offers dumbbell/Smith/machine chest press, never a cable fly — same
  compound, same loading role, same movement pattern.
- **Pain/discomfort is never auto-resolved.** "Change Exercise → Pain or
  discomfort" flags and pauses the exercise; it does not silently swap in
  a replacement, and tells the user to get it evaluated professionally.
- **Progression only moves on repeated, full-range performance.** Load
  never increases just because a new week started — it requires every set
  in the most recent logged session to have hit the top of the prescribed
  rep range.
- **Adaptation requires repetition, not one bad day.** `performanceAnalyzer.js`
  classifies trend only from ≥3 sessions and requires a majority/monotonic
  decline before the adaptation engine acts, and even then applies the
  smallest sufficient level (0–5) rather than jumping to a program rewrite.
- **Session-time optimization trims lowest priority first** (optional
  accessories → accessories → secondary movements), never randomly, and
  never drops the primary movement.
