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

## NOT built yet (next up)
- **%PB target-time engine** — coach-only PB entry (a "Sprint PBs" panel like Bench/Squat),
  autofills **target time = PB ÷ %**, like the 1RM→%→weight logic. You confirmed the model;
  awaiting the go to build.
- Velocity-vs-RPE fatigue flag + retest-ready flag; ACWR injury-spike flag (have the RPE
  round-trip now). v1 CNS coefficients are tunable once real weeks are logged.

_Full design + status also tracked in Claude's memory: `project_sprint_plyo_engine.md`._
