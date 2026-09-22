// CLAWW frontend — talks to the backend engines only through the API.
// This file renders structured data; it never invents a workout.

const el = (tag, attrs = {}, children = []) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else if (k === "html") node.innerHTML = v;
    else node.setAttribute(k, v);
  }
  for (const child of [].concat(children)) {
    if (child == null) continue;
    node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return node;
};

const api = {
  saveProfile: (profile) => fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) }).then((r) => r.json()),
  generateProgram: (user_id) => fetch("/api/program/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id }) }).then((r) => r.json()),
  history: (user_id, exercise_id) => fetch(`/api/history/${user_id}/${exercise_id}`).then((r) => r.json()),
  nextTarget: (payload) => fetch("/api/progression/next-target", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then((r) => r.json()),
  log: (payload) => fetch("/api/log", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then((r) => r.json()),
  changeExercise: (payload) => fetch("/api/exercise/change", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then((r) => r.json()),
  adaptation: (user_id) => fetch(`/api/adaptation/${user_id}`).then((r) => r.json()),
  exercises: () => fetch("/api/exercises").then((r) => r.json()),
};

const state = {
  userId: localStorage.getItem("claww_user_id") || `u_${Math.random().toString(36).slice(2, 8)}`,
  profile: null,
  program: null,
  activeDayIndex: null,
  exerciseCatalog: [],
  adaptationFeed: [],
};
localStorage.setItem("claww_user_id", state.userId);

const GOALS = [
  ["bulking", "Bulking"], ["cutting", "Cutting"], ["recomposition", "Recomposition"],
  ["endurance", "Endurance"], ["general_fitness", "General Fitness"],
];
const EXPERIENCE = [["beginner", "Beginner"], ["intermediate", "Intermediate"], ["advanced", "Advanced"]];
const EQUIPMENT_OPTIONS = [
  ["barbell", "Barbell"], ["dumbbell", "Dumbbell"], ["bench", "Bench"], ["machine", "Machines"],
  ["cable", "Cables"], ["smith_machine", "Smith Machine"], ["pull_up_bar", "Pull-up Bar"],
  ["bodyweight", "Bodyweight"], ["kettlebell", "Kettlebell"], ["band", "Bands"], ["bike", "Bike"], ["treadmill", "Treadmill"],
];

async function main() {
  state.exerciseCatalog = await api.exercises();
  renderOnboarding();
}

function root() {
  const r = document.getElementById("app");
  r.innerHTML = "";
  return r;
}

// ---------------- Onboarding ----------------
function renderOnboarding() {
  const form = {
    goal: "bulking", experience: "beginner", days_per_week: 3, session_duration_min: 60,
    equipment: new Set(["barbell", "dumbbell", "bench", "machine", "cable", "bodyweight"]),
  };

  const goalPills = el("div", { class: "pill-select" }, GOALS.map(([id, label]) =>
    el("button", {
      type: "button", class: `pill ${form.goal === id ? "active" : ""}`, "data-id": id,
      onclick: (e) => {
        form.goal = id;
        goalPills.querySelectorAll(".pill").forEach((p) => p.classList.remove("active"));
        e.currentTarget.classList.add("active");
      },
    }, label)
  ));

  const expPills = el("div", { class: "pill-select" }, EXPERIENCE.map(([id, label]) =>
    el("button", {
      type: "button", class: `pill ${form.experience === id ? "active" : ""}`,
      onclick: (e) => {
        form.experience = id;
        expPills.querySelectorAll(".pill").forEach((p) => p.classList.remove("active"));
        e.currentTarget.classList.add("active");
      },
    }, label)
  ));

  const equipPills = el("div", { class: "pill-select" }, EQUIPMENT_OPTIONS.map(([id, label]) =>
    el("button", {
      type: "button", class: `pill ${form.equipment.has(id) ? "active" : ""}`,
      onclick: (e) => {
        if (form.equipment.has(id)) { form.equipment.delete(id); e.currentTarget.classList.remove("active"); }
        else { form.equipment.add(id); e.currentTarget.classList.add("active"); }
      },
    }, label)
  ));

  const daysInput = el("input", { type: "number", min: "2", max: "6", value: "3", oninput: (e) => (form.days_per_week = Number(e.target.value)) });
  const durationInput = el("input", { type: "number", min: "20", max: "120", step: "5", value: "60", oninput: (e) => (form.session_duration_min = Number(e.target.value)) });

  const submit = el("button", {
    class: "primary-btn",
    onclick: async () => {
      submit.disabled = true;
      submit.textContent = "Building program…";
      const profile = {
        user_id: state.userId,
        goal: form.goal,
        experience: form.experience,
        age: 30, sex: "unspecified", height_cm: 175, weight_kg: 75,
        days_per_week: form.days_per_week,
        session_duration_min: form.session_duration_min,
        location: "custom",
        equipment: Array.from(form.equipment),
        preferences: { preferred_exercises: [], disliked_exercises: [], cardio_preference: null },
        constraints: { injuries: [], exercise_restrictions: [] },
      };
      await api.saveProfile(profile);
      state.profile = profile;
      const program = await api.generateProgram(state.userId);
      state.program = program;
      state.activeDayIndex = program.days.find((d) => !d.is_rest_day)?.day_index ?? 1;
      renderApp();
    },
  }, "Build my program");

  const container = el("div", { class: "onboard" }, [
    el("h1", {}, "CLAWW"),
    el("p", { class: "sub" }, "A training operating system. Tell it your goal, experience, and equipment — it builds a structured, explainable program, not a random workout."),
    el("div", { class: "field-group" }, [el("label", {}, "Goal"), goalPills]),
    el("div", { class: "field-group" }, [el("label", {}, "Training experience"), expPills]),
    el("div", { class: "field-group" }, [
      el("div", { class: "field-row" }, [
        el("div", {}, [el("label", {}, "Days per week (2–6)"), daysInput]),
        el("div", {}, [el("label", {}, "Session length (minutes)"), durationInput]),
      ]),
    ]),
    el("div", { class: "field-group" }, [el("label", {}, "Available equipment"), equipPills]),
    submit,
  ]);

  root().appendChild(container);
}

// ---------------- Main app shell ----------------
function renderApp() {
  const r = root();
  r.appendChild(el("div", { class: "topbar" }, [
    el("div", { class: "wordmark" }, [
      el("span", { class: "mark" }, "CLAWW"),
      el("span", { class: "tagline" }, "training operating system"),
    ]),
    el("div", { class: "goal-chip" }, `${state.program.goal.replace("_", " ")} · ${state.program.experience}`),
  ]));

  const shell = el("div", { class: "shell" });
  shell.appendChild(renderWeekStrip());
  shell.appendChild(el("div", { id: "session-slot" }));
  shell.appendChild(el("div", { id: "feed-slot" }));
  r.appendChild(shell);

  renderSession();
  renderFeed();
}

function renderWeekStrip() {
  const strip = el("div", { class: "week-strip" });
  const dayNames = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  state.program.days.forEach((day) => {
    const isRest = day.is_rest_day;
    const cell = el("div", {
      class: `day-cell ${isRest ? "rest" : "training"} ${day.day_index === state.activeDayIndex ? "active" : ""}`,
      onclick: isRest ? undefined : () => { state.activeDayIndex = day.day_index; renderSession(); refreshStrip(); },
    }, [
      el("span", { class: "d-idx" }, dayNames[day.day_index - 1]),
      el("span", {}, isRest ? "Rest" : (day.session_name || day.session_type)),
    ]);
    strip.appendChild(cell);
  });
  strip.id = "week-strip";
  return strip;
}

function refreshStrip() {
  const old = document.getElementById("week-strip");
  old.replaceWith(renderWeekStrip());
}

// ---------------- Session view ----------------
async function renderSession() {
  const slot = document.getElementById("session-slot");
  slot.innerHTML = "";
  const day = state.program.days.find((d) => d.day_index === state.activeDayIndex);

  if (day.is_rest_day) {
    slot.appendChild(el("div", { class: "rest-panel" }, [
      el("div", { class: "big" }, "REST DAY"),
      el("p", {}, "Recovery is part of the program. No session is scheduled today."),
    ]));
    return;
  }

  const header = el("div", { class: "session-header" }, [
    el("h2", {}, day.session_name || day.session_type),
    el("div", { class: "session-meta" }, [
      el("div", { class: "est" }, `${day.estimated_duration_minutes} min estimated`),
      el("div", {}, day.session_type.replace("_", " ")),
    ]),
  ]);
  slot.appendChild(header);

  if (day.warmup) {
    slot.appendChild(el("div", { class: "warmup-block" }, [
      el("div", {}, [el("strong", {}, "Warm-up "), `(~${day.warmup.duration_minutes} min)`]),
      el("div", {}, day.warmup.general_preparation),
      el("div", {}, day.warmup.movement_preparation),
      ...(day.warmup.ramp_sets || []).map((s) => el("div", {}, s)),
    ]));
  }

  const setInputsByExercise = {};

  for (const [idx, ex] of day.exercises.entries()) {
    const card = await renderExerciseCard(ex, idx, day, setInputsByExercise);
    slot.appendChild(card);
  }

  if (day.trimmed_for_time?.length) {
    slot.appendChild(el("div", { class: "trimmed-note" }, `Trimmed for time to fit your ${state.profile?.session_duration_min ?? ""}-minute session: ${day.trimmed_for_time.join(", ")}.`));
  }

  if (day.optional_cardio) {
    slot.appendChild(el("div", { class: "optional-cardio" }, [el("b", {}, "Optional: "), day.optional_cardio.note]));
  }

  slot.appendChild(el("div", { class: "log-bar" }, [
    el("button", {
      class: "primary-btn",
      onclick: async () => {
        const exercisesLog = day.exercises.map((ex) => {
          const inputs = setInputsByExercise[ex.exercise_id];
          const reps = inputs.setInputs.map((i) => Number(i.value) || 0);
          const load = inputs.loadInput.value === "" ? null : Number(inputs.loadInput.value);
          const completed = reps.every((r) => r > 0);
          return { exercise_id: ex.exercise_id, load, reps, sets: ex.sets, rir: ex.rir, completed };
        });
        await api.log({ user_id: state.userId, date: new Date().toISOString(), session_name: day.session_name, completed: true, exercises: exercisesLog });
        await renderFeed();
        showToast("Workout logged. Adaptation check complete — see the feed below.");
      },
    }, "Log workout"),
  ]));
}

async function renderExerciseCard(ex, idx, day, setInputsByExercise) {
  const meta = state.exerciseCatalog.find((e) => e.exercise_id === ex.exercise_id);
  const [history, target] = await Promise.all([
    api.history(state.userId, ex.exercise_id),
    api.nextTarget({ user_id: state.userId, exercise_id: ex.exercise_id, prescription: { rep_min: ex.rep_min, rep_max: ex.rep_max, sets: ex.sets, progression: ex.progression } }),
  ]);
  const last = history[history.length - 1];

  const card = el("div", { class: `exercise ${ex.superset_group ? "superset" : ""}` });

  card.appendChild(el("div", { class: "exercise-head" }, [
    el("span", { class: "exercise-num" }, String(idx + 1).padStart(2, "0")),
    el("span", { class: "exercise-name" }, ex.name),
    el("span", { class: "pattern-tag" }, meta ? meta.movement_pattern.replace(/_/g, " ") : ex.role),
  ]));

  card.appendChild(el("div", { class: "rx-row" }, [
    el("span", {}, [`${ex.sets} × `, el("b", {}, `${ex.rep_min}-${ex.rep_max}`)]),
    el("span", {}, ["RIR ", el("b", {}, String(ex.rir))]),
    el("span", {}, ["Rest ", el("b", {}, formatRest(ex.rest_seconds))]),
    ex.superset_group ? el("span", {}, "⤿ superset") : null,
  ]));

  card.appendChild(el("div", { class: "perf-row" }, [
    el("div", { class: "perf-box" }, [
      el("div", { class: "label" }, "Previous"),
      el("div", { class: "value" }, last ? `${last.load != null ? last.load + "kg × " : ""}${last.reps.join("/")}` : "No data yet"),
    ]),
    el("div", { class: "perf-box target" }, [
      el("div", { class: "label" }, "Today's target"),
      el("div", { class: "value" }, `${target.next_load != null ? target.next_load + "kg × " : ""}${target.next_rep_target}`),
    ]),
  ]));

  card.appendChild(el("div", { class: "explain" }, target.explanation));

  const setInputs = Array.from({ length: ex.sets }, (_, i) =>
    el("input", { class: "set-input", type: "number", min: "0", placeholder: `S${i + 1}` })
  );
  const loadInput = el("input", { class: "load-input", type: "number", step: "0.5", placeholder: "kg", value: target.next_load ?? "" });

  setInputsByExercise[ex.exercise_id] = { setInputs, loadInput };

  const setRow = el("div", { class: "set-log-row" }, [
    el("span", { class: "set-label" }, "LOG:"),
    loadInput,
    ...setInputs,
  ]);
  card.appendChild(setRow);

  card.appendChild(el("div", { class: "exercise-actions" }, [
    el("button", { class: "change-btn", onclick: () => openChangeModal(ex, meta) }, "Change Exercise"),
  ]));

  return card;
}

function formatRest(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ---------------- Change exercise modal ----------------
function openChangeModal(ex, meta) {
  const backdrop = el("div", { class: "modal-backdrop", onclick: (e) => { if (e.target === backdrop) backdrop.remove(); } });
  const body = el("div", { id: "modal-body" });

  function showReasons() {
    body.innerHTML = "";
    body.appendChild(el("h3", {}, "Change Exercise"));
    body.appendChild(el("div", { class: "modal-sub" }, `Why do you want to change ${ex.name}?`));
    const reasons = [
      ["equipment_unavailable", "Equipment unavailable"],
      ["too_difficult", "Too difficult"],
      ["dislike", "Don't like it"],
      ["pain_discomfort", "Pain / discomfort"],
    ];
    const list = el("div", { class: "reason-list" }, reasons.map(([id, label]) =>
      el("button", { class: "reason-btn", onclick: () => handleReason(id) }, label)
    ));
    body.appendChild(list);
    body.appendChild(el("button", { class: "ghost-btn modal-close", onclick: () => backdrop.remove() }, "Cancel"));
  }

  async function handleReason(reason) {
    const result = await api.changeExercise({
      user_id: state.userId, exercise_id: ex.exercise_id, reason,
      available_equipment: state.profile.equipment,
    });
    body.innerHTML = "";
    body.appendChild(el("h3", {}, "Change Exercise"));

    if (result.action === "flag_for_review") {
      body.appendChild(el("div", { class: "modal-msg" }, result.message));
      body.appendChild(el("button", { class: "ghost-btn modal-close", onclick: () => backdrop.remove() }, "Close"));
      return;
    }

    body.appendChild(el("div", { class: "modal-sub" }, result.message));
    if (!result.alternatives.length) {
      body.appendChild(el("div", { class: "modal-msg" }, "No suitable alternative was found with your current equipment."));
    } else {
      const list = el("div", { class: "alt-list" }, result.alternatives.map((alt) =>
        el("div", { class: "alt-item" }, [
          el("div", { class: "name" }, alt.name),
          el("div", { class: "reason" }, alt.reason),
          el("button", { onclick: () => applySwap(alt) }, "Use this instead"),
        ])
      ));
      body.appendChild(list);
    }
    body.appendChild(el("button", { class: "ghost-btn modal-close", onclick: () => backdrop.remove() }, "Cancel"));
  }

  function applySwap(alt) {
    const day = state.program.days.find((d) => d.day_index === state.activeDayIndex);
    const target = day.exercises.find((e) => e.exercise_id === ex.exercise_id);
    const newMeta = state.exerciseCatalog.find((e) => e.exercise_id === alt.exercise_id);
    target.exercise_id = alt.exercise_id;
    target.name = alt.name;
    target.rep_min = newMeta.recommended_rep_min ?? target.rep_min;
    target.rep_max = newMeta.recommended_rep_max ?? target.rep_max;
    target.rir = newMeta.recommended_RIR ?? target.rir;
    target.rest_seconds = newMeta.default_rest ?? target.rest_seconds;
    backdrop.remove();
    renderSession();
    showToast(`Swapped in ${alt.name}.`);
  }

  showReasons();
  backdrop.appendChild(el("div", { class: "modal" }, [body]));
  document.body.appendChild(backdrop);
}

// ---------------- Adaptation feed ----------------
async function renderFeed() {
  const slot = document.getElementById("feed-slot");
  slot.innerHTML = "";
  const result = await api.adaptation(state.userId);
  const changed = [...result.exercise_evaluations.filter((e) => e.level > 0), ...(result.program_decision.level > 0 ? [{ ...result.program_decision, exercise_id: null }] : [])];

  const feed = el("div", { class: "feed" }, [el("h3", {}, "Adaptation feed — what changed, and why")]);

  if (changed.length === 0) {
    feed.appendChild(el("div", { class: "feed-item level-0" }, [
      el("span", { class: "tag" }, "LEVEL 0 · NO CHANGE"),
      "Your program continues as planned — nothing in your logged data yet justifies a change.",
    ]));
  } else {
    for (const item of changed) {
      feed.appendChild(el("div", { class: `feed-item level-${item.level}` }, [
        el("span", { class: "tag" }, `LEVEL ${item.level} · ${item.action.replace(/_/g, " ").toUpperCase()}`),
        item.explanation,
      ]));
    }
  }
  slot.appendChild(feed);
}

function showToast(message) {
  const toast = el("div", { class: "toast" }, message);
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

main();
