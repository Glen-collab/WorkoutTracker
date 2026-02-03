/**
 * Exercise-Specific Motivational Messages
 *
 * Smart message picker that uses exercise name + equipment detection to serve
 * contextual encouragement. Tones:
 *   - Barbell / Machine: hardcore, beast mode, famous lifter references
 *   - Dumbbell: solid motivation for general lifters
 *   - Functional / Corrective: supportive, educational
 *   - Warmup / Mobility: light, encouraging
 */

// ──────────────────────────────────────────────
//  EXERCISE-SPECIFIC messages (matched by name)
// ──────────────────────────────────────────────
const exerciseSpecific = {
  // ── BENCH PRESS ──
  'bench press': [
    "The only lift where lying down is encouraged — and you crushed it! 🛋️💪",
    "Arnold would nod at that set. Chest gains incoming! 🏋️",
    "That bench didn't stand a chance against you! 😤",
    "Everybody's favorite lift because you get to lay down — but you still put in WORK! 🔥",
    "Bench day is best day, and you just proved why! 💎",
    "Pressing like Ronnie Coleman on a Monday! Lightweight baby! 🦁",
    "Chest pump activated. That shirt's gonna fit different tomorrow! 👕",
    "You just made gravity your warm-up! 🚀",
    "Larry Wheels would be proud of that pressing! ⚡",
    "That bench set had championship energy! 🏆",
  ],
  'incline bench': [
    "Upper chest is the hardest to build — you're doing the work others skip! 💪",
    "Incline pressing like a pro. That upper shelf is filling in! 🔥",
    "The angle makes it harder. That's what makes you stronger! ⚡",
  ],
  'decline bench': [
    "Decline bench: the forgotten chest builder. Not by you though! 💎",
    "Blood rushing to the head, weight going up — legend behavior! 🦁",
  ],
  'close grip bench': [
    "Close grip for the tricep gains — smart AND strong! 🧠💪",
    "That close grip just built triceps AND pressing power! ⚡",
  ],
  'floor press': [
    "Floor press eliminates leg drive — that was all upper body power! 😤",
    "Raw pressing strength off the floor. Pure. Power. 🔥",
  ],

  // ── SQUAT ──
  'squat': [
    "Squat day separates the committed from the casual — you showed up! 🦵🔥",
    "Tom Platz would respect those legs! Quad city! 🏆",
    "The king of all lifts, and you just wore the crown! 👑",
    "Nobody WANTS to squat. Everybody NEEDS to squat. You did what was necessary! 💪",
    "Deep squats, deep character. That set built both! 💎",
    "Legs are shaking? Good. That means they're growing! 🌱",
    "You squatted when you could've skipped. That's champion DNA! 🧬",
    "That squat rack is your throne now! 🦁",
    "Ed Coan didn't skip squat day. Neither did you! ⚡",
    "Walking out of the gym is gonna feel different after those! 🚶‍♂️💀",
  ],
  'front squat': [
    "Front squats are humbling and you handled them like a boss! 💪",
    "Front rack position + heavy weight = real athlete stuff! 🏋️",
    "The most honest squat variation — no hiding from depth here! 🔥",
  ],
  'box squat': [
    "Sit down, stand up, get stronger. Box squats keep it simple and effective! 📦💪",
  ],
  'goblet squat': [
    "Goblet squats build legs AND technique. Two for one! 🏆",
    "That goblet squat was clean! Great form, great gains! ✨",
  ],
  'bulgarian split squat': [
    "Bulgarian split squats are BRUTAL and you survived. Respect! 😤🇧🇬",
    "Single leg work is where real athletes are made. That was tough — and you did it! 💪",
    "BSS: the exercise everyone loves to hate. You just conquered it! 🏔️",
    "Your legs are gonna thank you tomorrow... or maybe Thursday 😅🔥",
  ],

  // ── DEADLIFT ──
  'deadlift': [
    "You picked heavy things up and put them down. Primal. Powerful. 🦍",
    "Eddie Hall pulled 500kg. You pulled your weight today — that's what matters! 🔥",
    "The deadlift doesn't lie. You either lift it or you don't — and you DID! 💪",
    "Nothing builds mental toughness like deadlift day. Iron therapy! 🧠⚡",
    "From the floor to lockout — every inch was earned! 💎",
    "That pull had some serious intent behind it! 😤",
    "Deadlifts: the great equalizer. And you just leveled up! 📈",
    "Jamal Browner energy on that pull! 🦁",
    "Your posterior chain just got a PhD in getting stronger! 🎓",
    "Grip it, rip it, done. That's how champions pull! 🏆",
  ],
  'romanian deadlift': [
    "RDLs are where hamstrings are forged. Slow and controlled — perfect! 🔥",
    "That stretch at the bottom? That's where the magic happens! ✨",
    "Romanian deadlifts done right. Your hammies will thank you! 🙏",
  ],
  'sumo deadlift': [
    "Sumo or conventional — a pull is a pull, and that one was solid! 💪",
    "Wide stance, big pull. Yusuf Dikeç couldn't aim better than that! 🎯",
  ],

  // ── OVERHEAD PRESS ──
  'overhead press': [
    "Pressing weight overhead like a Viking hoisting a shield! ⚔️🛡️",
    "The strict press doesn't lie — that was pure shoulder strength! 💪",
    "OHP is the true test of upper body power. You passed! 🏆",
  ],
  'shoulder press': [
    "Shoulders of steel in the making! Boulder shoulders loading... 🪨💪",
    "Pressing overhead takes guts. You delivered! 🔥",
    "Cannonball delts don't build themselves — great work! 💎",
  ],
  'military press': [
    "Standing at attention and pressing with authority! 🎖️💪",
    "Military press: strict, no cheating, all strength. That was textbook! 📖",
  ],
  'arnold press': [
    "The Arnold Press — named after the GOAT for a reason. Respect the rotation! 🏆",
    "Arnold invented this for a reason. Your shoulders just found out why! 🦁",
  ],
  'lateral raise': [
    "Lateral raises: small weight, BIG burn. That pump is real! 🔥",
    "Side delts are the secret to looking wide. You're on your way! 📐",
    "Nobody said lateral raises were fun. But the shoulder caps say thank you! 💪",
  ],

  // ── ROW ──
  'row': [
    "Strong back, strong everything. That row was money! 💰",
    "Dorian Yates built the biggest back ever with rows. You're on the path! 🦁",
    "Pull that weight like you mean it — and you DID! 🔥",
    "A thick back doesn't build itself. One row at a time! 💪",
    "Rows are the unsung hero of upper body training. Not today — today they're the STAR! ⭐",
  ],
  'barbell row': [
    "Pendlay or bent-over — that barbell row was pure back power! 🦍",
    "Ronnie Coleman rowed 315 for reps. Keep pulling, you're getting there! 🏆",
  ],
  'dumbbell row': [
    "Single arm, full focus. That dumbbell row hit different! 💪",
    "One arm at a time, building a back that speaks for itself! 🗣️🔥",
  ],

  // ── PULL-UP / CHIN-UP ──
  'pull-up': [
    "Pull-ups are the ultimate test of relative strength — you passed! 💪",
    "Bodyweight pulling is king. Long live the king! 👑",
    "Every rep against gravity is a rep toward greatness! 🚀",
  ],
  'chin-up': [
    "Chin-ups: back AND biceps in one move. Efficient AND impressive! 💪🧠",
    "Underhand grip, overhead gains. Nice work! 🔥",
  ],
  'lat pulldown': [
    "Lat pulldown bringing that V-taper closer one rep at a time! 📐💪",
    "Pulling that stack down with authority! 🔥",
  ],

  // ── CURL ──
  'curl': [
    "Sun's out, guns out! Those curls are building something special! 💪☀️",
    "Curls get the girls? Nah — curls build the confidence! 😎",
    "Bicep peak loading... keep curling! 🏔️",
    "The pump from that set is gonna look GREAT! 🔥",
  ],
  'barbell curl': [
    "Standing barbell curls like Arnold in Gold's Gym! 🏆💪",
    "Heavy barbell curls = serious arm development. Get after it! 🦁",
  ],
  'hammer curl': [
    "Hammer curls for the brachialis — the secret to arm thickness! 🔨💪",
    "Neutral grip, massive forearms. Smart training! 🧠",
  ],
  'preacher curl': [
    "Preacher curls: no cheating, no swinging, ALL bicep! That's honest work! ⛪💪",
  ],

  // ── TRICEP ──
  'tricep': [
    "Triceps make up 2/3 of your arm — and yours just grew! 📏💪",
    "Tricep work done! Horseshoe gains coming in hot! 🐴🔥",
  ],
  'skull crusher': [
    "Skull crushers: the name is metal and so are you! 💀🤘",
    "That set was dangerously good! Skull crushers for the win! 🏆",
  ],
  'tricep pushdown': [
    "Pushdowns for the pump! Those triceps are filling out! 💪",
    "Cable tricep work hits different. Nice squeeze at the bottom! 🔥",
  ],
  'dip': [
    "Dips: the upper body squat. Chest, triceps, shoulders — all in one! 💎",
    "Bodyweight dips build real-world pressing power! 🔥",
  ],

  // ── LUNGE ──
  'lunge': [
    "Lunges: the exercise that makes your glutes write thank-you letters! 🍑✉️",
    "Nobody LIKES lunges but everybody NEEDS them. You did what others won't! 💪",
    "Lunge butt is REAL and you're earning it! 🔥🍑",
    "Walking lunges are basically a trust fall with your legs — and you nailed it! 🚶‍♂️💎",
    "Your legs are gonna feel this tomorrow. That means it worked! 😅💪",
  ],
  'reverse lunge': [
    "Reverse lunges: easier on the knees, still tough on the quads! Smart move! 🧠🔥",
    "Stepping backward to move forward. That's the lunge way! 💪",
  ],
  'walking lunge': [
    "Walking lunges across the gym floor — that took grit! 🚶‍♂️🔥",
    "Every step was a rep, and every rep was earned! 💪",
  ],

  // ── LEG PRESS / LEG EXTENSION / LEG CURL ──
  'leg press': [
    "Leg press loaded up! That sled didn't stand a chance! 🏋️🔥",
    "Pushing that leg press like you're moving a car! Quad power! 🚗💪",
  ],
  'leg extension': [
    "Quad squeeze at the top — that's how you build the teardrop! 💧💪",
    "Leg extensions isolate the quads perfectly. Feel that burn! 🔥",
  ],
  'leg curl': [
    "Hamstring curls keeping those hammies balanced and strong! 🦵💪",
    "Don't skip the curls! Hamstrings are the engine of athleticism! 🏃‍♂️🔥",
  ],
  'calf raise': [
    "Calves: the most stubborn muscle. You showed up anyway — that's dedication! 🦵😤",
    "Arnold trained calves every day. One set at a time! 🐄💪",
  ],

  // ── HIP THRUST / GLUTE ──
  'hip thrust': [
    "Hip thrusts: the #1 glute builder in the game. Earned those gains! 🍑🔥",
    "Bret Contreras would approve that hip thrust form! 🏆",
  ],
  'glute bridge': [
    "Glute bridges fire up the posterior chain! Foundation work! 🌉💪",
    "Bridge up, squeeze, hold — textbook glute activation! 🔥",
  ],

  // ── CLEAN / SNATCH / OLYMPIC ──
  'clean': [
    "Power clean executed! That's EXPLOSIVE athlete training! ⚡🏋️",
    "Cleans build the kind of power you can't get any other way! 🔥",
    "Dmitry Klokov would tip his hat. That clean was CRISP! 🇷🇺🏆",
    "Bar speed, hip extension, catch — all dialed in! 💪",
  ],
  'snatch': [
    "The snatch: most technical lift in the gym. And you just did it! 🏋️‍♂️⚡",
    "From floor to overhead in one motion — that's athleticism! 🔥",
    "Pyrros Dimas energy on that snatch! Olympic-level effort! 🥇",
  ],
  'jerk': [
    "Jerk it overhead with authority! That was powerful! ⚡💪",
    "Split jerk, push jerk — doesn't matter. Weight went UP! 🔥",
  ],
  'thruster': [
    "Thrusters: the exercise that humbles CrossFitters and bodybuilders alike! 😤🔥",
    "Squat + press = full body punishment. And you took it! 💪",
  ],

  // ── PLANK / CORE ──
  'plank': [
    "Planks look easy until minute two. You held strong! ⏱️💪",
    "Core stability is the foundation of everything. Solid work! 🧱",
  ],
  'crunch': [
    "Crunches done! Abs are made in the gym and revealed in the kitchen! 🍽️💪",
  ],
  'russian twist': [
    "Russian twists for the obliques! Rotational power unlocked! 🔄🔥",
  ],
  'dead bug': [
    "Dead bugs look silly and work incredibly well. Smart training! 🐛💪",
  ],
  'hanging leg raise': [
    "Hanging leg raises: the advanced core move. Your abs are elite! 🏆",
  ],
  'ab rollout': [
    "Ab rollouts stretch and crush the core. That was brutal — and effective! 💀💪",
  ],
  'farmers walk': [
    "Farmers walks: grip, core, traps, everything. Walking strength! 🚜💪",
    "Carry heavy stuff, get strong. It really is that simple! 🔥",
  ],

  // ── PUSH-UP ──
  'push-up': [
    "Push-ups: the OG exercise. Simple, effective, and you crushed them! 💪",
    "Bodyweight mastery starts with the push-up. Solid set! 🔥",
    "No equipment needed, just effort. And you brought PLENTY! 💎",
  ],

  // ── CONDITIONING ──
  'burpee': [
    "Burpees: the exercise everyone loves to hate. You survived! 😅🔥",
    "If burpees were easy they'd be called something else! 💪",
  ],
  'box jump': [
    "Explosive power off the ground! Box jumps build athletes! 📦⚡",
  ],
  'battle rope': [
    "Battle ropes: making waves and burning calories! 🌊🔥",
  ],
  'sled': [
    "Sled work: pure conditioning, zero excuses! Push or pull, you did the work! 💪",
  ],
  'sprint': [
    "Sprints are the king of conditioning. You ran like you meant it! 🏃‍♂️💨",
  ],
  'bike': [
    "Pedal power! Heart rate up, lungs burning — that's fitness! 🚴‍♂️🔥",
  ],
  'rower': [
    "Row after row, meter after meter — you put in the work! 🚣💪",
  ],
  'rowing machine': [
    "Row after row, meter after meter — you put in the work! 🚣💪",
  ],
  'row': [
    "Building a big back — go muscles over show muscles! 💪🔥",
    "Strong back, strong posture! You're building the foundation! 🏋️",
    "Rows build the back that carries you through life! Keep pulling! 💪",
  ],
  'dumbbell row': [
    "One arm at a time, building that thick back! Go muscles activated! 💪",
    "Dumbbell rows: the secret to a powerful, balanced back! 🔥",
  ],
  'barbell row': [
    "Heavy rows for a heavy back! Posture gains incoming! 🏋️💪",
  ],
  'cable row': [
    "Constant tension, constant gains! Your back is thanking you! 💪",
  ],

  // ── WARMUP / MOBILITY / CORRECTIVE ──
  'foam roll': [
    "Taking care of your body is just as important as pushing it. Good work! 🧘",
  ],
  'band pull-apart': [
    "Band pull-aparts: small move, big shoulder health! Prehab pays off! 🛡️",
  ],
  'face pull': [
    "Face pulls: the exercise your shoulders didn't know they needed! 🔥",
  ],
  'stretch': [
    "Flexibility is strength you haven't unlocked yet. Keep stretching! 🧘‍♂️",
  ],

  // ── CORE / ABS ──
  'crunch': [
    "Strong core, strong everything! Those abs are earning their six-pack! 💪🔥",
    "Crunch time — and you delivered! Lean and mean! 🎯",
    "Every crunch is a step toward that washboard! Keep going! ✨",
    "Core strength is the foundation of everything. Building that foundation! 🏗️",
  ],
  'sit-up': [
    "Sit-ups done right build a bulletproof core! Strong and functional! 💪",
    "Old school, new results! That core is getting STRONG! 🔥",
    "Posture starts with core strength — you're building both! 📐",
  ],
  'plank': [
    "Time under tension builds iron abs! You held strong! 🔥💪",
    "Planks don't lie — that core is getting SOLID! 💎",
    "Stability, posture, strength — planks build it all! ⚡",
    "The longer you hold, the stronger you get! Beast mode core! 🦁",
  ],
  'russian twist': [
    "Obliques on fire! Rotational power unlocked! 🔥",
    "Twisting your way to a lean, athletic waist! 💪",
  ],
  'leg raise': [
    "Lower abs are the hardest to hit — and you just nailed them! 🎯",
    "Leg raises build that V-cut everyone wants! Keep going! ✨",
  ],
  'mountain climber': [
    "Cardio AND core in one move! Efficient and effective! 🏔️🔥",
    "Climbing your way to a shredded midsection! 💪",
  ],
  'hollow': [
    "Gymnast-level core work! That hollow hold builds REAL stability! 🤸",
    "Core engaged, body aligned — textbook hollow position! 💎",
  ],
  'dead bug': [
    "Dead bugs build the core stability athletes need! Smart training! 🧠💪",
    "Controlled movement, engaged core — that's how champions train! 🏆",
  ],
  'bird dog': [
    "Balance and core working together! Functional strength at its finest! 🐕",
    "Posture, stability, strength — bird dogs deliver all three! ✨",
  ],
  'ab': [
    "That core work is building a strong, lean midsection! 🔥💪",
    "Abs are made in the gym and revealed in the kitchen — you did YOUR part! 🍽️",
    "Strong core = strong everything. Foundation work done! 🏗️",
    "Every rep bringing you closer to that lean, athletic look! ✨",
    "Core strength improves EVERYTHING — posture, lifting, life! 💎",
  ],
  'core': [
    "Core crushed! Strong midsection, strong body! 💪🔥",
    "The core is your powerhouse — and yours just got stronger! ⚡",
    "Lean, mean, core machine! Great work! 🎯",
    "Posture improves, back pain decreases — that's what core work does! 🙌",
    "Building the foundation that supports every other lift! 🏗️",
  ],
};

// ──────────────────────────────────────────────
//  EQUIPMENT / CATEGORY fallback messages
// ──────────────────────────────────────────────
const equipmentMessages = {
  barbell: [
    "That barbell just met its match! Heavy metal therapy! 🤘🏋️",
    "Barbell work builds a different kind of strong. REAL strong! 🦍",
    "Steel bar, iron plates, raw power — that's what training is about! 🔥",
    "Under the bar is where legends are made! 💪",
    "You moved that barbell like it owed you money! 😤💰",
    "Chalk up, belt on, bar loaded — you came to WORK! 🏋️‍♂️",
    "That's how you handle a barbell. Controlled aggression! 🦁",
    "Somewhere, Mark Rippetoe just smiled. Barbell training done right! 📖💪",
    "Barbells don't care about your feelings — and you showed it who's boss! 💎",
    "The barbell is the great equalizer. Today you were greater! ⚡",
  ],
  machine: [
    "Machines let you push to the limit safely — and you just DID! 🏋️🔥",
    "Lock in, load up, and GO. Machine work done right! 💪",
    "That machine just got a workout from YOU! Stack crushed! 😤",
    "Plate-loaded perfection. Controlled power! 🎯",
    "Machines isolate the muscle. Your focus isolates the gains! 🧠🔥",
    "That pin was set HIGH and you moved it like nothing! 💎",
    "Machine work lets you go to failure safely. Beast mode: ON! 🦁",
    "Smooth reps, full range, max effort — textbook machine work! 📖",
    "Cable stack didn't stand a chance! 🔥",
    "Isolation is the name of the game and you just won! 🏆",
  ],
  dumbbell: [
    "Dumbbells demand balance AND strength. You delivered both! ⚖️💪",
    "Free weights, free gains. Nothing holding you back! 🔥",
    "Each arm pulling its own weight — that's real strength! 💎",
    "Dumbbell work builds the stabilizers machines can't reach! 🎯",
    "Controlled, balanced, powerful — that's quality dumbbell training! ✨",
    "One dumbbell at a time, building something great! 💪",
    "Dumbbells don't lie — every imbalance shows. And you handled it! 🔥",
    "That set showed real control. Strength AND coordination! 🧠💪",
    "Free weight mastery in progress. Keep building! 📈",
    "Grip it tight, lift it right. Solid dumbbell work! 💎",
  ],
  cable: [
    "Cables keep tension the ENTIRE rep. Your muscles noticed! 🔥",
    "Constant tension, constant gains. Cable work pays off! 💪",
    "The cable machine is the most versatile tool in the gym — and you just proved it! 🎯",
    "Smooth reps on the cables! That's quality training! ✨",
  ],
  functional: [
    "Functional fitness is REAL fitness. You're building a body that WORKS! 🏃‍♂️💪",
    "No machines needed — just your body and determination! 🔥",
    "Movement quality over everything. That was clean! ✨",
    "Bodyweight mastery is the ultimate flex. Keep progressing! 💎",
    "Real-world strength built right here! 💪",
    "Your body is the machine. And it's running perfectly! ⚙️",
    "Functional movement done right — that transfers to LIFE! 🌟",
    "Balance, coordination, strength — you checked all the boxes! ✅",
  ],
  corrective: [
    "The smartest athletes prioritize corrective work. Longevity over ego! 🧠✨",
    "Prehab > rehab. You're investing in your future! 📈",
    "Taking care of the little things now prevents the big problems later! 🛡️",
    "Mobility work is the unsexy hero of fitness. Respect! 🙏",
    "Your joints just sent you a thank-you card! 💌",
    "Corrective exercise shows wisdom. Train smart, train long! 🧘",
  ],
  kettlebell: [
    "Kettlebells build a different kind of tough! Grip, core, everything! 🔔💪",
    "Kettlebell training: old school, always effective! 🔥",
    "Swinging iron like a warrior! Kettlebell gains! ⚔️",
  ],
};

// ──────────────────────────────────────────────
//  BLOCK TYPE fallback messages
// ──────────────────────────────────────────────
const blockTypeMessages = {
  warmup: [
    "Warm-up complete! Your body is primed and ready to GO! 🔥",
    "Smart athletes warm up. You're a smart athlete! 🧠💪",
    "Prep work done — now let's get after the real stuff! 🚀",
    "Blood flowing, muscles activated. Time to dominate! ⚡",
  ],
  mobility: [
    "Mobility work done! Move better, lift better, FEEL better! 🧘‍♂️✨",
    "Flexibility is the foundation of performance. Well done! 💪",
    "Your joints and muscles are thanking you right now! 🙏",
    "Range of motion is range of GAINS! Keep it up! 📈",
  ],
  conditioning: [
    "Heart rate UP, excuses DOWN! Conditioning crushed! 🫀🔥",
    "That conditioning work just added years to your life! 📈💪",
    "Sweat is just your body crying tears of joy! 💦😤",
    "Cardio is hardio — but you showed up anyway! 🏃‍♂️🔥",
    "Engine built. Recovery improved. You're a machine! ⚙️",
  ],
  circuit: [
    "Circuit complete! That's how you keep the heart rate elevated! 🫀🔥",
    "Station to station, no rest for the dedicated! 💪",
    "Circuits build work capacity AND mental toughness! 🧠⚡",
    "Round after round — you kept pushing! 🔄🔥",
  ],
  movement: [
    "Movement quality is everything! You moved with purpose! 🎯",
    "Every rep was intentional. That's how athletes train! 💪",
  ],
};

// ──────────────────────────────────────────────
//  GENERIC fallbacks (always available)
// ──────────────────────────────────────────────
const genericMessages = [
  "Crushed it! 💪",
  "That's how it's done! 🔥",
  "Beast mode activated! 🦁",
  "Strength earned, not given! ⚡",
  "One step closer to greatness! 🏆",
  "You showed up and delivered! 👊",
  "Your future self thanks you! 🎯",
  "Iron sharpens iron! ⚔️",
  "Nothing can stop you today! 🚀",
  "Respect the process — you just did! 💎",
  "That weight didn't stand a chance! 😤",
  "Consistency builds champions! 🥇",
  "You didn't come this far to only come this far! 🏔️",
  "Another set in the bank. Compound interest of gains! 📈",
  "The only bad workout is the one that didn't happen! ✅",
];

// ──────────────────────────────────────────────
//  SMART PICKER
// ──────────────────────────────────────────────

function pickRandom(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Detect equipment type from exercise name.
 */
function detectEquipment(name) {
  const n = name.toLowerCase();
  if (/\bbarbell\b|\bbar\b|\bez[- ]?bar\b|\bt[- ]?bar\b/.test(n)) return 'barbell';
  if (/\bmachine\b|\bsmith\b|\bleg press\b|\bleg extension\b|\bleg curl\b|\bhack squat\b|\bcable\b|\bpulldown\b|\bpec\s?deck\b|\bchest fly machine\b/.test(n)) {
    if (/\bcable\b/.test(n)) return 'cable';
    return 'machine';
  }
  if (/\bdumbbell\b|\bdb\b/.test(n)) return 'dumbbell';
  if (/\bkettlebell\b|\bkb\b/.test(n)) return 'kettlebell';
  if (/\bband\b|\btrx\b|\bbodyweight\b|\bpush[- ]?up\b|\bpull[- ]?up\b|\bchin[- ]?up\b|\bplank\b|\bburpee\b/.test(n)) return 'functional';
  if (/\bfoam\b|\bstretch\b|\bmobility\b|\bcorrective\b|\bscapular\b|\bclam\b|\bglute bridge\b|\bbird dog\b|\bdead bug\b/.test(n)) return 'corrective';
  return null;
}

/**
 * Get a contextual motivational message for the given exercise.
 *
 * @param {string} exerciseName - The exercise name from the program
 * @param {string} blockType - Block type: straight-set, superset, warmup, conditioning, etc.
 * @returns {string} A motivational message
 */
export function getMotivationalMessage(exerciseName, blockType) {
  const name = (exerciseName || '').toLowerCase();

  // 1. Try exercise-specific first (best match)
  for (const [key, messages] of Object.entries(exerciseSpecific)) {
    if (name.includes(key)) {
      const msg = pickRandom(messages);
      if (msg) return msg;
    }
  }

  // 2. Try equipment-based
  const equip = detectEquipment(name);
  if (equip && equipmentMessages[equip]) {
    const msg = pickRandom(equipmentMessages[equip]);
    if (msg) return msg;
  }

  // 3. Try block type
  if (blockType && blockTypeMessages[blockType]) {
    const msg = pickRandom(blockTypeMessages[blockType]);
    if (msg) return msg;
  }

  // 4. Generic fallback
  return pickRandom(genericMessages);
}
