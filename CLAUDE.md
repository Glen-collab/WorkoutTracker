# React Workout Tracker

## What This Is
A PWA for clients to log workouts assigned by their trainer. Users enter an access code, load their program, track weights/reps set-by-set, and log completed workouts. Includes an AI chatbot with pain management video library, travel workouts, and a gamified belt progression system (Test Your Might).

**Repo:** `Glen-collab/WorkoutTracker`
**Stack:** React 19, Vite 7, vite-plugin-pwa (Workbox)
**Build:** `npm run build` -> `dist/tracker.js` + `dist/tracker.css` + service worker
**Styling:** All inline styles (no Tailwind, no CSS modules)
**WordPress:** Plugin loads dist files, passes `window.gwtConfig.apiBase`

---

## Screen Flow

```
access -> consent -> questionnaire -> program (main tracking)
```

- **Access:** New user or returning (saved credentials in localStorage)
- **Consent:** Legal waiver acceptance
- **Questionnaire:** Pain/injury assessment (one-time, stored in localStorage)
- **Program:** Main workout tracking with day/week navigation

---

## Project Structure

```
src/
  App.jsx                          # Main app: all screens, state orchestration, API calls, post-workout flow

  hooks/
    useTrackerState.js             # Central state: user, maxes, profile, program, tracking data, travel mode
    useTrackerAPI.js               # API calls: load program, log workout, questionnaire, travel, stats
    trackerHelpers.js              # roundToNearest5, calculateWeight, get1RM, formatAccessCode, etc.

  components/
    program/
      ProgramView.jsx              # Main workout display: blocks, exercises, daily tonnage, log button
      ProgramHeader.jsx            # Week/day navigation, custom workout badge
      BlockCard.jsx                # Expandable block container (all block types)
      ExerciseCard.jsx             # Exercise tracking: video, inputs, recommendations, mark complete
      TrackingInputs.jsx           # Weight/reps input grid per set
      DailyTonnage.jsx             # Live volume stats card + ALL calculation logic
      WeeklyStatsCard.jsx          # Historical weekly progress chart (SVG-based)

    chatbot/
      WorkoutChatbot.jsx           # AI chatbot: pain tree, coaching, travel workouts, video library
      painTreeData.js              # 53-node pain management decision tree

    game/
      TestYourMight.jsx            # Belt progression game: sprite animation, tap challenge

    modals/
      CompletionModal.jsx          # Program completion feedback (stars, improvements, interests)
      CongratulationsModal.jsx     # Post-workout celebration with volume stats
      WeeklySummaryModal.jsx       # End-of-week stats summary
      PainModal.jsx                # Pain area selection from questionnaire

    motivation/
      exerciseMotivation.js        # 200+ exercise-specific motivational messages

  data/
    (exercise data lives in the workout builder repo)
```

---

## API Endpoints (useTrackerAPI.js)

All POST to `{gwtConfig.apiBase}/{endpoint}`:

| Endpoint | Purpose | Key Payload |
|----------|---------|-------------|
| `load-program.php` | Load client program | email, code, name, 1RMs, profile |
| `load-user-override.php` | Check for trainer override | accessCode, week, day |
| `log-workout.php` | Save completed workout | blocks with actual weights/reps, volume_stats, chatbot_data |
| `submit-questionnaire.php` | Save pain/injury assessment | pain_areas[], responses{} |
| `submit-completion.php` | Program complete feedback | rating, improvements, interests[] |
| `get-weekly-stats.php` | Historical weekly data | email, code -> weeks[] with tonnage/calories/etc |
| `get-travel-workouts.php` | Fetch travel workouts | equipmentType, days[] |

---

## Calorie & Volume Calculation System (DailyTonnage.jsx)

### Exercise Classification (Pattern Matching)

**Core Exercises** -> crunch equivalents (not tonnage):
- Rep-based: `totalReps x qualifierMultiplier`
- Duration-based (planks): `(seconds / 2) x qualifierMultiplier`

**Mobility/Stretch** -> excluded entirely

**Functional/Bodyweight** -> tiered calorie system:
- Low (0.25 kcal/rep): glute bridge, clamshell, dead bug, bird dog, band walks, face pulls
- Moderate (0.5 kcal/rep): push-ups, pull-ups, dips, lunges, planks, rows
- High (1.0 kcal/rep): burpees, box jumps, jump squats, sprints, plyometrics
- Weight scaling: <154 lbs = 0.9x, 154-198 = 1.0x, >198 = 1.1x

**Weighted Exercises** -> tonnage: `weight x reps x qualifierMultiplier` per set
- Supports percentage-based (from baseMax), drop sets, strip sets
- Qualifier multipliers: "each arm/leg/side" = 2x, "x2/x3/x4 combo" = 2/3/4x

### Cardio Machine MET Table (RECENTLY FIXED)

```
Rowing Machine:    MET 7.0,  pace 250 m/min
SkiErg:            MET 7.5,  pace 220 m/min
Assault Bike:      MET 10.5, no distance
Air/Echo Bike:     MET 8.5,  no distance
Treadmill:         MET 8.3,  pace 160 m/min
Elliptical:        MET 5.0,  no distance
Stationary Bike:   MET 6.8,  pace 275 m/min
Stair Climber:     MET 9.0,  no distance
VersaClimber:      MET 10.0, no distance
Jacob's Ladder:    MET 10.0, no distance
Default:           MET 7.0,  pace 200 m/min
```

**Calorie formula:** `MET x weightKg x (minutes / 60)` (always time-based)
**Distance conversion:** If only distance given, estimate time: `(miles x 1609.34) / machine.pace`
**This ensures 1000m and ~4min on a rower give the same calorie estimate.**

### Total Calorie Estimate
```
warmupCal (4 per exercise) + cooldownCal (3 per exercise)
+ strengthCal (MET=6 x weightKg x (completedExercises*3min / 60))
+ tonnageBonus ((tonnage/1000) x 10)
+ bwCalories (tiered system)
+ cardioCal (per-machine MET-based)
```

---

## Tracking Data Structure

Keys follow pattern `blockIndex-exIndex-setIndex-field`:
```
0-1-2-weight: 185        # Block 0, Exercise 1, Set 2, weight
0-1-2-reps: 8            # Block 0, Exercise 1, Set 2, reps
0-1-null-duration: "5"   # Cardio duration
0-1-null-distance: "1.2" # Cardio distance
complete-0-1: true       # Exercise marked complete
block-notes-0: "text"    # Client notes on block
rec-0-1: "up"            # Recommendation (up/same/down)
```

---

## Chatbot System (WorkoutChatbot.jsx)

### Dialog Trees
- **Access screen:** Help with access codes, 1RM explanation
- **Program screen (entry):** 4 branches:
  1. **Pain Management** (53-node tree from painTreeData.js) -> video library links
  2. **Training Coaching** -> mindset, nutrition, tips, recovery
  3. **Travel Workouts** -> equipment type + days -> API call -> loads travel program
  4. **Tracker Help** -> how to use, recommendation arrows

### Video Library (40+ Cloudflare Stream videos)
Categories: Massage Gun (11), Lacrosse Ball (3), Foam Roll (5), Thera Cane (2), Psoas Tool (1), Stretches (11), The Stick (4)
Embedded as expandable iframes in chat messages.

### Chatbot Data Saved with Workout
`getConversationSummary()` returns `{ topicsVisited, messageCount, messages }` -> included in log-workout payload.

---

## Test Your Might (Belt Progression Game)

### Belt System (40+ weeks)
```
White (W1-5):  45 lbs,  30 taps    | Tips: +3 taps, +5 lbs per tip level
Yellow (W6-10): 95 lbs,  40 taps   | Tip order: none, Red, Blue, White, Black
Orange (W11-15): 135 lbs, 50 taps  |
Green (W16-20): 185 lbs, 60 taps   | Beyond W40: Black Belt Stars (1-9)
Blue (W21-25): 225 lbs, 70 taps    | W41-49: 385+(stars*10) lbs, 112+(stars*4) taps
Red (W26-30): 275 lbs, 80 taps     | W50+: 2nd Degree (485 lbs, 162 taps)
Brown (W31-35): 315 lbs, 90 taps   |
Black (W36-40): 365 lbs, 100 taps  |
```

- **Duration:** 5 seconds, **Lives:** 3, **Success:** >= 75% of target taps
- **Sprite animation:** 13 frames (idle, strain_low, strain_med, lockout, fail, success)
- **Triggers:** After weekly summary on last day of week
- **Uses `cumulativeWeeks`** (persists across programs, not just currentWeek)

---

## Travel Mode

- **Entry:** Chatbot travel_intro -> select equipment (bodyweight | hotel_gym | bands_bodyweight) + days
- **API:** `get-travel-workouts.php` returns workouts for each day
- **State:** Saves current program, loads travel workouts, manual day navigation
- **Exit:** Restores saved program state

---

## Post-Workout Flow

1. Log Workout -> calculate volume_stats -> send to API
2. Show CongratulationsModal (2s auto-close)
3. If last day of week: WeeklySummaryModal -> Game prompt -> TestYourMight
4. If program complete: CompletionModal (feedback form)
5. Auto-advance to next day/week

---

## localStorage Keys

```
gwt_saved_credentials              # { email, code } for quick login
gwt_questionnaire_{code}_{email}   # "true" to skip questionnaire re-show
gwt_history_{code}_{email}         # { dayLabel: { logged_at, data, volume_stats } }
```

---

## Important Edge Cases

- **Exercises must be marked complete** before tonnage/calories count
- **Previous week lookup** only if currentWeek > 1 (for recommendations)
- **1RM auto-fill:** DB values only if user didn't provide in form
- **Live stats merge:** Current week = historical API data + real-time input
- **Cumulative weeks:** API increments on log, used for game progression across programs
- **Override detection:** Loads user override for each week/day, shows custom workout badge
- **No weight fallback:** If no tracked/prescribed weight but reps > 0, uses bodyweight calorie tier
