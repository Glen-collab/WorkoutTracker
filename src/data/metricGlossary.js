// Plain-English explanations for every number the tracker shows a client.
//
// A rookie sees "TONNAGE 12,400 lbs" and has no idea whether that's good, bad,
// or even what it counted. Every stat tile and graph tab is tappable and opens
// one of these. Two layers on purpose:
//   short — 1-2 sentences. What it is, in the words a trainer would actually
//           use on the gym floor. This is what most people read.
//   more  — the "...read more" expansion for the person who wants the why:
//           how it's calculated, what's excluded, and how to read a change.
//
// Voice: Glen talking to a beginner. No hedging, no jargon without unpacking it,
// and honest about what's an estimate. Keep it that way when adding entries.

export const METRIC_INFO = {
  tonnage: {
    emoji: '🏋️',
    title: 'Tonnage',
    short: 'The total pounds you moved — weight times reps, added up across every set. It is the simplest measure of how much work you actually did.',
    more: [
      'Bench 100 lbs for 10 reps and that is 1,000 lbs of tonnage, even though you never had 1,000 lbs on the bar. Do that for 3 sets and it is 3,000.',
      'Only exercises you mark complete count, and moves done "each side" count double — because you really did do both sides.',
      'Never compare your tonnage to somebody else\'s. Squats and deadlifts pile up huge numbers; an arm day never will. Compare it to your own last week. Climbing means you are doing more work than you used to. A planned drop usually means a deload week, which is where the strength actually shows up.',
      'Bodyweight moves, stretching and cardio do not add tonnage — there is no bar to count. They show up in Core, Calories and Cardio instead.',
    ],
  },

  core: {
    emoji: '🔥',
    title: 'Core work',
    short: 'Your ab work converted into "how many crunches would that be?" — so planks, hollow holds and leg raises all land on one scale you can compare week to week.',
    more: [
      'Core is hard to score. A 60-second plank and 20 crunches are both real work but nothing alike, so we translate everything into one currency.',
      'Reps count as reps. Holds count as one crunch for every 2 seconds — so a 60-second plank comes out around 30. Anything done each side counts double.',
      'It is a tracking estimate, not a scientific figure. The point is not the number itself, it is watching it climb over the weeks.',
      'Core work deliberately does not add to Tonnage. If it did, an ab circuit would look like a heavy squat day.',
    ],
  },

  cardio_time: {
    emoji: '⏱️',
    title: 'Cardio time',
    short: 'Total minutes of conditioning work — treadmill, rower, bike, sled, intervals. Only counts what you marked complete.',
    more: [
      'Conditioning is tracked on its own clock because it is a different kind of work than lifting. Twenty hard minutes on a rower does not belong in a tonnage number.',
      'If you enter distance but no time, we estimate the minutes from a normal pace for that machine — so 1,000 m on the rower still shows up even if you never looked at the clock.',
      'Rest between intervals is not subtracted. This is the time you spent on the machine, not pure working time.',
    ],
  },

  distance: {
    emoji: '📏',
    title: 'Distance',
    short: 'How far you traveled on the cardio machines, in miles. Meters get converted automatically — about 1,600 m to a mile.',
    more: [
      'Rowers and skiergs are usually logged in meters, treadmills in miles. Everything is converted to miles here so a whole week reads as one number.',
      'Plenty of machines have no distance at all — assault bike, stair climber, versaclimber. Those give you time and calories but no miles.',
      'That is why a brutal cardio day can show very little distance. Low miles does not mean you went easy.',
    ],
  },

  calories: {
    emoji: '🔥',
    title: 'Estimated calories',
    short: 'A rough estimate of the energy you burned this session, based on your bodyweight, how long you worked, and how hard.',
    more: [
      'It adds up a few pieces: a standard rate for each cardio machine, a base rate for time spent lifting, a bonus that scales with your tonnage, and a per-rep rate for bodyweight moves. All of it is scaled to your bodyweight, which is why filling in your weight makes it more accurate.',
      'The word estimate is doing real work in that sentence. No app, no watch and no cardio machine actually measures your calorie burn — every one of them is running a formula on a handful of inputs. Ours is no different.',
      'Use it to compare your own sessions to each other. Do not use it as a number to eat back at the end of the day.',
    ],
  },

  cns_load: {
    emoji: '⚡',
    title: 'CNS Load',
    short: 'How hard your nervous system got taxed — not your muscles. It is driven by intensity, not volume: only near-max efforts count toward it.',
    more: [
      'Muscles recover in a day or two. Your nervous system takes longer, and it is usually the thing that is fried when you feel flat and slow but nothing is actually sore.',
      'One single at 95% costs more here than five sets at 70%. That is not a quirk — that is the whole idea. Heavy barbell work, max-effort sprints and hard plyos are what drive this number up.',
      'Anything under about 80% of your max reads as zero, and so does steady cardio. That is intentional, not a bug: a rowing session can wreck your lungs while leaving your nervous system totally fresh.',
      'So a flat CNS line is not a lazy week. It means the week was built out of volume and conditioning rather than max effort — which is most weeks, for most people, and exactly how it should be.',
    ],
  },

  acwr: {
    emoji: '⚖️',
    title: 'ACWR — are you ramping up too fast?',
    short: 'Acute:Chronic Workload Ratio. This week\'s hard work divided by your average over the last 4 weeks. It answers one question: am I piling on more than my body has adapted to?',
    more: [
      '1.00 means this week is a completely normal week for you. Everything else is measured against your own recent history, so it means the same thing for a beginner as it does for a college athlete.',
      '🟢 0.8 – 1.3 is the sweet spot. Enough new work to force progress, not enough to outrun your recovery.',
      '🟠 1.3 – 1.5 is elevated. Fine for a week, worth watching.',
      '🔴 Above 1.5 is a spike — over 50% more hard work than you are used to. This is the classic setup for a pulled something, and it is the one number in the app worth acting on.',
      '🔵 Below 0.8 is unloading — a deload. Backing off on purpose is how you cash in the work you already did.',
      'Read it as a story, not a snapshot. Red followed by blue is a planned peak into a recovery week, and that is a good thing. Red that stays red week after week is a load climb nobody planned — that is the one to fix.',
      'It stays hidden until there are at least 2 weeks of real history, because before that the average it compares against does not mean anything yet.',
    ],
  },

  projection: {
    emoji: '📈',
    title: 'Projected vs. logged',
    short: 'The dashed line is the plan your coach built for the whole program. The solid line with dots is what you have actually logged so far.',
    more: [
      'The dashed roadmap comes from the prescribed sets, reps and percentages in your program, run through the same math as your real numbers and scaled to your own maxes and bodyweight. It is what the program expects the week to look like.',
      'The solid line only connects weeks you have logged, so unfinished weeks ahead do not drag it down to zero.',
      'Landing under the dashed line is not a failure — missed days, lighter weights and swapped exercises all move it. It is there so you can see the shape of the plan, especially the deload weeks that are supposed to dip.',
    ],
  },

  workouts: {
    emoji: '✅',
    title: 'Workouts completed',
    short: 'How many of this week\'s scheduled sessions you have logged. Hitting the number consistently beats any single great workout.',
    more: [
      'A session only counts once you hit Log Workout at the end. Marking exercises complete during the session feeds your live stats but does not close out the day.',
      'If your coach hid a day from your week, it is not counted against you here.',
    ],
  },
};

export function getMetricInfo(key) {
  return METRIC_INFO[key] || null;
}
