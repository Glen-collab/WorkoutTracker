# Session Recap — Sprint/Plyo Engine + Projected Roadmap (Jun 26–27, 2026)

**TL;DR:** Built the collegiate-level **Sprint/Plyo Engine** across the builder + tracker
(+ one backend tweak), then added a **projected "roadmap" line** to the tracker's weekly
graph so it's not a flatline before anything is logged.

> **Which repo is which** (so you know where each session lives):
> - `workoutbuilder` → coach-facing builder (Netlify, push to `main` = deploy)
> - `WorkoutTracker` → client PWA (Netlify, push to `main` = deploy)
> - `bsa-coach-platform` → Flask backend on EC2 (scp + restart `bestrongagain.service`)

---

## 1. CNS Load engine — the builder (`workoutbuilder`) ✅ LIVE
A unified neural-load model: jumps, sprints, and lifting all on ONE currency
(load = CNS rating 1–5 × efforts).

- **`src/data/movementClassification.js`** — 199 exercises tagged `cns / zone / driver / type`
  (the classification sheet you approved). `classifyMovement()` is combo-aware
  ("Box Jump + Step Down" rated by its hardest part).
- **`src/utils/cnsLoadCalc.js`** — per-exercise/day/program CNS load.
- **`src/components/builder/CnsLoadView.jsx`** — new **⚡ CNS Load** button (next to
  Progressions/Volume): neural-load wave chart + **High/Low day pattern** grid
  (Francis 48–72h spacing) + per-week foot-contacts / sprint-volume dials + load-spike flag.
- On each exercise row: a read-only **⚡ CNS n/5 pill** (Low/Med/High) + a **Target RPE**
  field with the 1–10 → velocity scale pop-out.

## 2. RPE round-trip — tracker + backend ✅ LIVE
- **Builder:** you set a **Target RPE** per movement (blank = hidden, same as distance/duration).
- **Tracker (`ExerciseCard.jsx`):** athlete picks **Actual RPE (1–10)**. Shows ONLY when you
  set a target. Live gap flag: 🔥 ran hot (≥2 over = fatigue) / 💚 gas in tank / ✅ on target.
- **Back to you:** the **workout-logged email** now prints `⚡ RPE: target X / actual Y` + the
  flag per exercise. (The coach platform has no per-exercise UI view — the email is the channel.)
  - Backend: `bsa-coach-platform/backend/workout_api.py` → `build_workout_detail_html`.

## 3. CNS Load on the tracker weekly graph ✅ LIVE
- New **⚡ CNS Load** tab next to Tonnage/Calories/Core/Time/Distance.
- `cns_load` rides inside the existing `volume_stats` JSON → **no DB migration**.
  Backend `get_weekly_stats` sums it per week.
- **Mobile fix:** removed the always-on "today" CNS pill (most people don't know what it is)
  and made the graph tabs **wrap** so they fit on a phone.

## 4. Projected "roadmap" line on the weekly graph ✅ LIVE  ← newest
The graph was all zeros until something was logged. Now:
- A **dashed "Projected" line** shows the prescribed shape of the WHOLE program from day one.
- As each week is completed, a **solid "Logged" dot** locks onto it. Legend: `--- projected · ● logged`.
- Built from **each person's own program + their own 1RM/bodyweight** — auto-scales powerlifter
  → beginner, **no fudge factor** (bench 300×3×5 → 4,500 lbs). You chose *honest projection*
  over a conservative cushion.
- **No backend change** — the full program (`allWorkouts`) was already in the load response.
- `projectDayStats()` in `DailyTonnage.jsx` reuses the EXACT live math (feeds a synthetic
  "all-complete, nothing-typed" tracking map) so projected → actual can never drift.
- **Fix (Jun 27):** the dashed future line blinked out after logging (post-log re-fetch
  momentarily empties `allWorkouts`). Made the projection **sticky** (cached per program) so
  the roadmap stays drawn as weeks lock in.

---

## Deploy notes
- `workoutbuilder` + `WorkoutTracker`: every change pushed to `main` → Netlify auto-deploys.
- `bsa-coach-platform`: `workout_api.py` deployed to EC2 by hand (backups `.bak-cns`, `.bak-rpe`).
  **✅ RESOLVED (Jun 27):** another session committed + pushed all the drift (my cns_load + RPE,
  plus the older email_log / bodyweight / hiddenDays work — commits `0ec4665`, `b2b2627`, etc.).
  Verified `workout_api.py`, `admin.py`, `kiosk.py` are **identical to live on EC2** → git = live.
  Only untracked leftovers: `scripts/backup_programs.py` + `scripts/run_backup.sh` (RDS backup
  tooling — commit when ready, not deploy-critical).

---

## Part 2 — %PB engine + sprints end-to-end (Jun 27, all ✅ LIVE)

### 5. Sprint %PB target times — the velocity twin of 1RM→%→weight
- **Builder:** a collapsible **Sprint PBs** panel (next to Bench/Squat). Hybrid distance set
  you picked: **10/40yd + 60/100/150/200/300/400m** (every velocity zone, keeps the 40-yd dash).
  On any Movement row, a **🏃 Sprint** control: pick distance + Target % → shows target = PB ÷ %.
  `utils/sprintTargets.js` holds the distances + math.
- **PER-ATHLETE (the key fix):** one program → many kids → different PBs, so the target is NOT
  baked per-program. The builder is your **template/guide**; each kid's target is computed in the
  **tracker** from **their own PB**. 4.7 kid and 4.9 kid run the same program, see different targets.
- **Server storage:** migration `004_sprint_pbs.sql` → `sprint_pbs` JSONB on `workout_user_position`
  (same row as 1RMs). Kid enters their PB inline in the sprint block → saves to their **account**
  (follows them across devices, visible to you later). `update-user-stats` merges per-distance.

### 6. Blanket zone sprints (top of the Linear picker)
- Pick the QUALITY, set your own sets/distance/rest: **Acceleration / Max Velocity / Speed
  Endurance / Special Endurance / Tempo / Recovery**. Each pre-classified (zone + CNS) so the
  engine works automatically.

### 7. Sprint logging + the coach email
- Tracker sprint block has a **"Your times (sec)"** row — one box per rep — so the athlete logs
  what they ran. The coach **email** now shows per sprint:
  `🏃 40 yd @ 95% · PB 4.70 → target 4.95s · ran 4.9, 5.0, 5.1` (prescription + their PB/target +
  actual times). `build_workout_detail_html`.

### Verification pass (Jun 27) — VERIFIED SOLID end-to-end
- PB save+merge proven via the real endpoint + DB read-back (no clobber); per-kid target math
  (4.70→4.95s, 4.90→5.16s); RPE email line + flags correct at all thresholds; backend git = live;
  `sprint_pbs` column confirmed in RDS. Fixed during the pass: PB input now persists on **blur**
  (was per keystroke). Only un-automatable check = an email physically landing in Glen's inbox.

## Decisions locked this session
- **RPE stays opt-in / minimal.** Kids won't reliably self-report; objective sprint **times** +
  a conversation beat a 1–10. RPE earns its keep on **lifting** (no objective velocity) and remote
  athletes. Don't build more RPE analytics. (memory: `feedback_rpe_deemphasis`)
- **Hidden-day labels: KEEP raw numbers.** Navigation already skips hidden days (TV + remote do
  just the visible days). The day *labels* show raw numbers with a gap (hide Day 4 → "…3, 5, 6, 7").
  Glen chose to **keep** this — do NOT "collapse" the labels. It looks like a bug but is intended.
- **Challenge:** "July 4th 5k challenge" (mm:ss, lower-better) starts **Mon 6/29** → won't show on
  the tracker until then (backend only renders *active*, not *upcoming*). Working as designed.

## Still NOT built (next up)
- **Coach roster view of each kid's PBs** — the server storage now makes this possible (dashboard
  or printable sheet). The natural next step.
- Velocity-vs-RPE fatigue flag, ACWR injury-spike flag — deferred (RPE de-emphasized). v1 CNS
  coefficients tunable once real weeks are logged. Optional: auto "ran X% off target — ask why"
  flag off the objective times (preferred over self-reported RPE).

_Full design + status also tracked in Claude's memory: `project_sprint_plyo_engine.md`._
