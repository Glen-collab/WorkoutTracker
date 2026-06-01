# Session — 2026-06-01 · TV Whiteboard Fixes

Worked on the gym TV "whiteboard" view (`/tv/static`, rendered by
`src/components/tv/TVStatic.jsx`). Two issues: varied rep schemes showing
wrong, and the bottom bar clipping the last exercise.

## TL;DR
- **Sets/reps display** was already fixed the night before (commit `2c9fcec`)
  and was live — the gym Pi was just running a **stale cached bundle**. A Pi
  **reboot** picked up the new code and Legacy week 1 bench flipped from
  `3x10` → `10/10/8/8`.
- Hardened the formatter so reps typed straight into the Reps box (`10,10,8,8`)
  also render per-set (`049824d`).
- Removed the bottom `Code · Coach · Exit` footer that was clipping the last
  row on dense days (`71cb49b`).

## Key facts about the TV whiteboard
- **Gym TV/Pi URL:** `bestrongagain.netlify.app/tv/static?coach=<code>&device=<serial>`
  → the **WorkoutTracker** repo (`TVStatic.jsx`). *Not* `app.bestrongagain.com/tv/static`,
  which is the separate coach-platform "BSA Coach" app.
- **`tracker.js` is a stable (non-hashed) filename** in the Workbox precache.
  After a deploy, a single Chromium refresh keeps serving the OLD bundle — the
  service worker only swaps on the next load after it clears. **Fix = reboot the
  Pi** (kiosk reloads the URL clean at boot) or refresh twice. Confirm a deploy
  is live via the phone incognito test on the same URL.

## Issue 1 — varied reps showed as "3x10" instead of "10/10/8/8"
**Root cause:** when a coach applies a scheme (e.g. `10-10-8-8`), the exercise
stores the real per-set array **and** keeps the leftover add-exercise defaults
(`setsCount:"3"`, `reps:"10"`). The *old* formatter read those leftovers; the
*new* one reads the `sets[]` array.

Verified against live data (code 1081, "Legacy Athletes", Week 1 → Block 2):
```
Barbell Bench Press  scheme:"10-10-8-8"  isPercentageBased:true
sets: [ {reps:10,pct:65}, {reps:10,pct:70}, {reps:8,pct:75}, {reps:8,pct:80} ]
```
Data was correct + code was live → it was purely a stale Pi bundle. **Rebooted
the Pi → fixed.**

**Inspect live program JSON** (handy for any future "TV shows wrong reps"):
```bash
curl -s -X POST "https://app.bestrongagain.com/api/workout/load-program.php" \
  -H "Content-Type: application/json" \
  -d '{"code":"<4digit>","email":"tv-display@bestrongagain.com","requested_week":1,"requested_day":1}'
```
(Parse with `node`, not `python3`, on the Windows box.)

## Issue 2 — last exercise clipped by the bottom bar
The footer (`Code: <code> · Coach: <coach>` + red **Exit** button) was
`flexShrink: 0` sitting under the `flex:1` workout columns, stealing the row
that got cut off. **Removed the footer entirely** — the coach code is baked into
the kiosk URL, so the wall TV needs neither the on-screen attribution nor an exit
affordance. The last row now renders.
- If Exit is ever wanted on a tablet, re-add a small corner button.
- For days longer than this, the next levers are the auto-scroll/crawl and the
  `fontScale` thresholds (shrinks text past 20 exercises).

## Commits (Glen-collab/WorkoutTracker, main → Netlify auto-deploy)
| Commit | What |
|--------|------|
| `2c9fcec` | (prev night) per-set reps from `sets[]` / `repsPerSet[]` arrays |
| `049824d` | also split a delimited Reps string (`10,10,8,8`) into per-set |
| `71cb49b` | drop bottom Code/Coach/Exit footer (was clipping last row) |

## Reminder for next time
Deploy is push-to-`main` (Netlify). After any TV change, the gym Pi needs a
**reboot** to drop the cached bundle — refresh alone won't do it.
