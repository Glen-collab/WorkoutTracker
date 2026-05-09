# Chatbot Voice + Free Bodyweight Starter

Two related pieces of the access / chatbot UX:

1. **Chatbot voice flips per program** — Steve's clients see "Coach Steve", Ashley's see "Coach Ashley", etc. Pre-login (no program loaded) the placeholder is a generic "Ask your Coach…".
2. **Free starter program at code 1234** — a 3-day bodyweight program owned by Glen for first-time users to test-drive the app without an access code.

---

## Chatbot voice resolution

`src/components/chatbot/WorkoutChatbot.jsx` — the "Ask Coach…" input under the pill tree.

### Placeholder logic

```js
placeholder={(() => {
  const cc = program?.coachConfig;
  const primary = cc?.coach_voice_name?.trim();
  const secondary = cc?.secondary_coach_name?.trim();
  if (primary) {
    if (cc.single_coach === false && secondary) {
      return `Ask Coach ${primary} or ${secondary} anything…`;
    }
    return `Ask Coach ${primary} anything…`;
  }
  return 'Ask your Coach anything…';
})()}
```

Resolution path:
- **Pre-login** (no program loaded yet): no `coachConfig` → placeholder is the generic *"Ask your Coach anything…"*. The LLM-side BSA default voice (Glen + Ali) still answers if the user types — that's intentional, and the access-screen messaging guides them toward Glen + Ali for the starter program.
- **After loading a program owned by a coach with a `chatbot_config` set** (e.g. Steve): placeholder becomes *"Ask Coach Steve or Brooklyn anything…"* (dual-coach mode) or *"Ask Coach Steve anything…"* (single-coach mode).
- **After loading a program owned by a coach without a `chatbot_config`** (e.g. Glen himself): falls back to the generic *"Ask your Coach anything…"* placeholder. The LLM still picks the BSA default voice for the actual replies.

### Where `program.coachConfig` comes from

`App.jsx` fetches it on program load:

```js
if (prog.coachId) {
  const apiBase = window.gwtConfig?.platformApiBase || 'https://app.bestrongagain.com/api';
  const r = await fetch(`${apiBase}/coaches/chatbot-config/${prog.coachId}`);
  if (r.ok) prog.coachConfig = await r.json();
}
setProgram(prog);
```

`prog.coachId` is resolved server-side via `_resolve_coach_uuid()` in `bsa-coach-platform/backend/workout_api.py` because `workout_programs.created_by` is historically inconsistent (sometimes UUID, sometimes email). The endpoint is a public GET — no auth needed since the config is just voice/branding metadata.

### Sent to the LLM

`coach_config` is forwarded into the `/api/embed-chat` context every time the user sends a message. The bsa-chatbot's white-label path activates whenever `coach_config.coach_voice_name` is set, swapping in the per-coach prompt (separate from BSA's default Glen+Ali system prompt — not appended to it).

---

## The access-screen dialog tree

`src/components/chatbot/WorkoutChatbot.jsx` — the `TREE` constant defines the pill-button decision tree.

### `access_help` node

> "It's simple! 1) If you're new, enter your name, email, and the access code your coach gave you. 2) If you're returning, just enter your email and code. 3) Optionally enter your 1RM values so your coach can calculate percentages for you."

Removes the outdated `XXXXX-XXXXX` format reference (codes are 4-digit numeric now).

### `no_code` node

> "No problem! Your coach will give you a 4-digit access code once they build your program. In the meantime, want to test-drive the app? Use code **1234** with any email and you'll load a free bodyweight starter workout — no equipment needed. Coach Glen and Ali will help you out as you go!"

This is the test-drive entry point for new visitors who don't have a coach yet.

---

## Free Bodyweight Starter — code 1234

A 3-day program inserted directly into RDS (`workout_programs` row, owner = `wisco.barbell@gmail.com`, access_code = `1234`).

### Why owned by Glen

Two reasons:
1. The chatbot's coach voice resolves through the program's `created_by` → coach UUID → `coachConfig`. Glen has no `chatbot_config` set, so the lookup returns null and the BSA default voice (Glen + Ali) answers — exactly what the no_code message advertises.
2. The Cloudflare video pool falls through `featured_global` → all of Glen's curated videos light up for the starter user.

### Why anyone can load it with any email

`load-program.php` validates `access_code + is_active = TRUE` only. The `user_email` on the program row is the OWNER's email, not a permission gate — any email + a valid access code creates a `workout_user_position` row for that user/code pair so they can track their own progress independently.

### The 3 days

All exercises hand-picked from `exercise_manifest.json` — only entries with `has_default_video: true` (no broken video references).

| Day | Theme                     | Highlights                                                                |
|-----|---------------------------|---------------------------------------------------------------------------|
| 1   | Full Body Foundation      | Push-Ups · Forward Lunge · Bird Dogs / Plank Shoulder Taps / Hollow Hold triset · Child's Pose / Cobra / Downward Dog cooldown |
| 2   | Upper Focus               | Knee Pushups → Push-Ups + Plank Taps superset → T Pushups / Wall Handstands / Mountain Climbers triset |
| 3   | Lower & Core              | Forward Lunge · Cossack Squat · Bird Dogs / Hollow Hold / Mountain Climbers triset |

Each day has theme block (with motivational copy from "Coach Glen" or "Coach Ali"), warmup, main work blocks, and a cooldown. 25 unique exercises total, every one with a Cloudflare Stream video.

### Recreating / updating the starter

Build the program JSON locally with a small Python script that reads `exercise_manifest.json` and assembles the block structure (see commit `Free starter access code: FREE -> 1234` for the original generation). Insert via psycopg2 directly — RDS doesn't expose `pg_read_file` for `psql` heredoc inserts:

```bash
ssh ec2-user@3.19.135.182 "/opt/bestrongagain/venv/bin/python3 <<PY
import json, psycopg2, os
data = json.load(open('/tmp/free_program.json'))
conn = psycopg2.connect(os.environ['DATABASE_URL'])
cur = conn.cursor()
cur.execute(\"DELETE FROM workout_programs WHERE access_code = '1234'\")
cur.execute('INSERT INTO workout_programs (access_code, user_email, program_name, program_nickname, program_data, created_by, is_active, is_template) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)',
  ('1234', 'wisco.barbell@gmail.com', 'Free Bodyweight Starter', 'Try the App', json.dumps(data), 'wisco.barbell@gmail.com', True, False))
conn.commit()
PY"
```

---

## Files touched in this area

| File                                                    | Role                                                                |
|---------------------------------------------------------|---------------------------------------------------------------------|
| `src/components/chatbot/WorkoutChatbot.jsx`             | Dynamic placeholder, dialog tree (`access_help`, `no_code` nodes)   |
| `src/App.jsx`                                           | Fetches `coachConfig` from `/api/coaches/chatbot-config/:coachId` and attaches to `program` before setting it |

---

## Related docs

- **[`react-trainer-dashboard/docs/AI_COACH_SUMMARY.md`](../../react-trainer-dashboard/docs/AI_COACH_SUMMARY.md)** — same coach-voice resolution. Both this tracker's chatbot and the dashboard's AI summaries call `GET /api/coaches/chatbot-config/<coach_id>` and forward `coach_config` into `bsa-chatbot`'s `/api/embed-chat`. Keep them in sync if the schema changes.
- **[`bsa-coach-platform/docs/SMART_IMPORT.md`](../../bsa-coach-platform/docs/SMART_IMPORT.md)** — many programs the tracker loads were built via Smart Import. The starter program at code 1234 was hand-rolled (not Smart-Imported) but uses the same exercise manifest.
- **[`bsa-coach-platform/docs/GYM_ENTITY.md`](../../bsa-coach-platform/docs/GYM_ENTITY.md)** — coach transfer flips the chatbot voice for affected clients on their next program load (`coachConfig` re-resolves to the new coach).
- **[`bsa-coach-platform/docs/VIDEO_OVERRIDE_SYSTEM.md`](../../bsa-coach-platform/docs/VIDEO_OVERRIDE_SYSTEM.md)** — explains how `/api/media/tracker-overrides` decides which exercise videos this tracker shows, including the gym pool layer.
- **[`bsa-coach-platform/docs/ARCHITECTURE.md`](../../bsa-coach-platform/docs/ARCHITECTURE.md)** — full BSA ecosystem map.
