/**
 * Exercise Defaults — fallback values when a trainer doesn't fill in a field.
 * Keyed by exercise name (case-insensitive lookup via getExerciseDefaults).
 * Only non-empty values are included.
 */

const EXERCISE_DEFAULTS = {
  // === CARDIO MACHINES ===
  'Rowing Machine': { distance: '1000', distanceUnit: 'm' },
  'Ski Erg': { distance: '1000', distanceUnit: 'm' },
  'Assault Bike': { calories: '15' },
  'Treadmill Walk or Jog': { distance: '3', distanceUnit: 'mi' },
  'Treadmill Incline Walk': { distance: '2', distanceUnit: 'mi', notes: 'Incline 10-15%' },
  'Stationary Bike': { duration: '15', durationUnit: 'min' },
  'Elliptical': { duration: '15', durationUnit: 'min' },
  'Echo Bike': { calories: '15' },
  'Spin Bike': { duration: '15', durationUnit: 'min' },
  'Stair Climber': { duration: '15', durationUnit: 'min' },
  'StairMaster': { duration: '15', durationUnit: 'min' },
  'VersaClimber': { duration: '10', durationUnit: 'min' },
  "Jacob's Ladder": { duration: '10', durationUnit: 'min' },
  'Concept2 BikeErg': { duration: '10', durationUnit: 'min' },

  // === CARRIES ===
  'Farmers Carry': { setsCount: '4', weight: '70', distance: '40', distanceUnit: 'yd' },
  'Suitcase Carry': { setsCount: '3', weight: '35', distance: '40', distanceUnit: 'yd', duration: '30', durationUnit: 'sec', qualifier: 'each' },
  'Barbell Front Rack Carry': { setsCount: '3', weight: '95', distance: '40', distanceUnit: 'yd' },
  'Barbell Overhead Carry': { setsCount: '3', weight: '65', distance: '30', distanceUnit: 'yd' },
  'Barbell Zercher Carry': { setsCount: '3', weight: '95', distance: '40', distanceUnit: 'yd' },
  'Dumbbell Farmer Carry': { setsCount: '4', weight: '50', distance: '40', distanceUnit: 'yd', duration: '60', durationUnit: 'sec' },
  'Dumbbell Suitcase Carry': { setsCount: '3', weight: '35', distance: '30', distanceUnit: 'yd', qualifier: 'each' },
  'Dumbbell Front Rack Carry': { setsCount: '3', weight: '35', distance: '30', distanceUnit: 'yd' },
  'Dumbbell Goblet Carry': { setsCount: '3', weight: '40', distance: '30', distanceUnit: 'yd' },
  'Dumbbell Offset Carry': { setsCount: '3', weight: '40', distance: '30', distanceUnit: 'yd', qualifier: 'each side' },
  'Overhead Plate Carry': { setsCount: '3', weight: '25', distance: '30', distanceUnit: 'yd' },
  'Waiter Carry': { setsCount: '3', weight: '25', distance: '30', distanceUnit: 'yd', qualifier: 'each' },
  'Sandbag Clean and Carry': { setsCount: '3', weight: '80', distance: '40', distanceUnit: 'yd' },

  // === SLED WORK ===
  'Forward Sled Push': { setsCount: '4', weight: '90', distance: '40', distanceUnit: 'yd', rest: '60s' },
  'Forward Sled Drag': { setsCount: '4', weight: '90', distance: '40', distanceUnit: 'yd', rest: '60s' },
  'Forward Sled Pull': { setsCount: '4', weight: '70', distance: '40', distanceUnit: 'yd', rest: '60s' },
  'Backward Sled Drag': { setsCount: '4', weight: '70', distance: '40', distanceUnit: 'yd', rest: '60s' },
  'Sled Push': { setsCount: '4', weight: '90', distance: '40', distanceUnit: 'yd', rest: '60s' },
  'Sled Push + Sprint': { setsCount: '3', weight: '90', distance: '40', distanceUnit: 'yd', rest: '90s' },

  // === JUMPS & PLYOMETRICS ===
  'Box Jumps': { setsCount: '3', reps: '5' },
  'Box Jump + Step Down': { setsCount: '3', reps: '5' },
  'Squat Jump': { setsCount: '3', reps: '8' },
  'Star Jumps': { setsCount: '3', reps: '8' },
  'Tuck Jumps': { setsCount: '3', reps: '6' },
  'Vertical Jumps': { setsCount: '3', reps: '5' },
  'Repeat Broad Jumps': { setsCount: '3', reps: '5' },
  'Depth Jumps': { setsCount: '3', reps: '4', rest: '90s' },
  'Butt Kicker Jumps': { setsCount: '3', reps: '10' },

  // === BURPEES & BODYWEIGHT CONDITIONING ===
  'Burpees': { setsCount: '3', reps: '10' },
  '8 Count Burpee': { setsCount: '3', reps: '8' },
  'Burpee Pull-Ups': { setsCount: '3', reps: '6' },
  'Burpee Box Jump Overs': { setsCount: '3', reps: '6' },
  'Burpee + Box Jump': { setsCount: '3', reps: '6' },
  'Bear Crawl': { setsCount: '3', distance: '30', distanceUnit: 'yd' },
  'Mountain Climbers': { setsCount: '3', reps: '20', qualifier: 'each leg' },

  // === BATTLE ROPES ===
  'Battle Rope Slams': { setsCount: '3', duration: '30', durationUnit: 'sec', rest: '30s' },
  'Battle Rope + Squat Combo': { setsCount: '3', duration: '30', durationUnit: 'sec', rest: '30s' },

  // === MEDICINE BALL ===
  'Med Ball Slams': { setsCount: '3', reps: '10', weight: '20' },
  'Med Ball Chest Pass': { setsCount: '3', reps: '10', weight: '14' },
  'Med Ball Rotational Throws': { setsCount: '3', reps: '8', weight: '14', qualifier: 'each side' },
  'Med Ball Overhead Throws': { setsCount: '3', reps: '8', weight: '14' },
  'Med Ball Squat to Press': { setsCount: '3', reps: '10', weight: '14' },
  'Med Ball Wood Chops': { setsCount: '3', reps: '10', weight: '10', qualifier: 'each side' },
  'Med Ball Russian Twists': { setsCount: '3', reps: '20', weight: '10', qualifier: 'total' },
  'Med Ball Rainbow Slams': { setsCount: '3', reps: '10', weight: '10', qualifier: 'each side' },

  // === AGILITY & LADDER ===
  'Ladder Quick Feet': { setsCount: '3' },
  'Ladder Icky Shuffle': { setsCount: '3' },
  'Lateral Shuffle': { setsCount: '3', distance: '20', distanceUnit: 'yd', qualifier: 'each side' },
  'Carioca/Grapevine': { setsCount: '3', distance: '20', distanceUnit: 'yd', qualifier: 'each side' },
  'Cone Weave': { setsCount: '3' },

  // === SPRINTS ===
  'Stair Sprint Intervals': { setsCount: '4', rest: '60s' },
  'Shuttle Sprint + Push-Ups': { setsCount: '4', distance: '20', distanceUnit: 'yd', rest: '60s' },
  'Bear Crawl + Sprint': { setsCount: '3', distance: '20', distanceUnit: 'yd', rest: '60s' },
  'Jog': { distance: '200', distanceUnit: 'yd' },
  'Slow Sprint/Fast Jog': { distance: '400', distanceUnit: 'yd' },

  // === CORE ===
  'Plank': { setsCount: '3', duration: '30', durationUnit: 'sec' },
  'Side Plank': { setsCount: '3', duration: '20', durationUnit: 'sec', qualifier: 'each side' },
  'Dead Bug': { setsCount: '3', reps: '10' },
  'Bird Dog': { setsCount: '3', reps: '10', qualifier: 'each side' },
  'Hollow Body Hold': { setsCount: '3', duration: '20', durationUnit: 'sec' },
  'Russian Twists': { setsCount: '3', reps: '20', qualifier: 'total' },
  'V-Ups': { setsCount: '3', reps: '12' },
  'Bicycle Crunches': { setsCount: '3', reps: '20', qualifier: 'total' },
  'Leg Raises': { setsCount: '3', reps: '12' },
  'Flutter Kicks': { setsCount: '3', reps: '20', qualifier: 'each leg' },
  'Ab Rollout': { setsCount: '3', reps: '10' },
  'Pallof Press': { setsCount: '3', reps: '10', qualifier: 'each side' },

  // === WARMUP / MOBILITY ===
  'Foam Roll IT Band': { setsCount: '1', duration: '60', durationUnit: 'sec', qualifier: 'each side' },
  'Foam Roll Quads': { setsCount: '1', duration: '60', durationUnit: 'sec', qualifier: 'each side' },
  'Foam Roll Upper Back': { setsCount: '1', duration: '60', durationUnit: 'sec' },
  'Foam Roll Lats': { setsCount: '1', duration: '60', durationUnit: 'sec', qualifier: 'each side' },
  'Foam Roll Glutes': { setsCount: '1', duration: '60', durationUnit: 'sec', qualifier: 'each side' },
  'Lacrosse Ball Pecs': { setsCount: '1', duration: '60', durationUnit: 'sec', qualifier: 'each side' },
  'Lacrosse Ball Glutes': { setsCount: '1', duration: '60', durationUnit: 'sec', qualifier: 'each side' },
  'Hip CARs': { setsCount: '1', reps: '5', qualifier: 'each' },
  'Pigeon Pose': { setsCount: '1', duration: '30', durationUnit: 'sec', qualifier: 'each side' },
  'Couch Stretch': { setsCount: '1', duration: '30', durationUnit: 'sec', qualifier: 'each side' },
  '90/90 Hip Stretch': { setsCount: '1', duration: '30', durationUnit: 'sec', qualifier: 'each side' },
  'Ankle Circles': { setsCount: '1', reps: '10', qualifier: 'each' },
  'Shoulder Dislocations': { setsCount: '1', reps: '10' },
  'Wall Slides': { setsCount: '1', reps: '10' },
  'Cat-Cow Stretch': { setsCount: '1', reps: '10' },
  'T-Spine Rotations': { setsCount: '1', reps: '8', qualifier: 'each side' },
  'Walking Knee Hugs': { setsCount: '1', reps: '10', qualifier: 'each leg' },
  'Walking Quad Pulls': { setsCount: '1', reps: '10', qualifier: 'each leg' },
  'Inchworms': { setsCount: '1', reps: '6' },
  "World's Greatest Stretch": { setsCount: '1', reps: '5', qualifier: 'each side' },
  'Jumping Jacks': { setsCount: '1', reps: '20' },
  'High Knees': { setsCount: '1', reps: '20', qualifier: 'each leg' },
  'Butt Kicks': { setsCount: '1', reps: '20', qualifier: 'each leg' },
  'Jump Rope': { setsCount: '1', duration: '60', durationUnit: 'sec' },

  // Additional warmup exercises from Glen's programs
  'Cat Cow': { setsCount: '1', reps: '10' },
  'Bird Dogs': { setsCount: '1', reps: '10', qualifier: 'each side' },
  'Glute Extensions': { setsCount: '1', reps: '20' },
  'Arm Circles': { setsCount: '1', reps: '10', qualifier: 'each arm' },
  'Arm Across Chest Stretch': { setsCount: '1', duration: '30', durationUnit: 'sec', qualifier: 'each side' },
  '90/90 Hip Switch': { setsCount: '1', reps: '10', qualifier: 'each' },
  'Band Walk Forward and Lateral': { setsCount: '1', reps: '10', qualifier: 'each' },
  'Band Shoulder Dislocates': { setsCount: '1', reps: '10' },
  'Band Up and Overs': { setsCount: '1', reps: '10' },
  'Blackbirds': { setsCount: '1', reps: '15' },
  'Broom Handle Rotations': { setsCount: '1', reps: '10', qualifier: 'each' },
  'Clam Shells': { setsCount: '1', reps: '15', qualifier: 'each side' },
  'Clam Shell Leg Slides on Wall': { setsCount: '1', reps: '20', qualifier: 'each' },
  'Doorway Pec Stretch': { setsCount: '1', duration: '30', durationUnit: 'sec', qualifier: 'each' },
  'Figure 4 Stretch (Supine)': { setsCount: '1', duration: '60', durationUnit: 'sec', qualifier: 'each' },
  'Flag Stretch': { setsCount: '1', duration: '30', durationUnit: 'sec', qualifier: 'each side' },
  'Foam Roller Preset': { setsCount: '1', duration: '5', durationUnit: 'min' },
  'Foam Roller Chest Stretch': { setsCount: '1', duration: '30', durationUnit: 'sec' },
  'Foam Roller Relax on Spine': { setsCount: '1', duration: '3', durationUnit: 'min' },
  'Frog Pose': { setsCount: '1', duration: '60', durationUnit: 'sec' },
  'Glute Extension on Med Ball': { setsCount: '1', reps: '15', qualifier: 'each leg' },
  'Glute Stretch (Seated)': { setsCount: '1', duration: '30', durationUnit: 'sec', qualifier: 'each side' },
  'Hamstring Rollout': { setsCount: '1', duration: '60', durationUnit: 'sec', qualifier: 'each side' },
  'Hands & Knees Hip Circles': { setsCount: '1', reps: '10', qualifier: 'each leg' },
  'Hang from Bar': { setsCount: '1', duration: '30', durationUnit: 'sec' },
  'Hip CARs (Controlled Articular Rotations)': { setsCount: '1', reps: '5', qualifier: 'each' },
  'Hip Flexor Stretch (Kneeling)': { setsCount: '1', duration: '60', durationUnit: 'sec', qualifier: 'each' },
  'Hip Mobility Sequence': { setsCount: '1', duration: '5', durationUnit: 'min' },
  'Hip Openers': { setsCount: '1', duration: '15', durationUnit: 'sec', qualifier: 'each' },
  'Kneeling Spiderman Stretch': { setsCount: '1', reps: '5', qualifier: 'each side' },
  'Lacrosse Ball Door Jam Pec': { setsCount: '1', duration: '30', durationUnit: 'sec', qualifier: 'each side' },
  'Lat Rollout': { setsCount: '1', duration: '30', durationUnit: 'sec', qualifier: 'each side' },
  'Massage Gun Biceps and Serratus and Teres Minor': { setsCount: '1', duration: '2', durationUnit: 'min', qualifier: 'each side' },
  'Massage Gun Biceps Anterior Delt': { setsCount: '1', duration: '2', durationUnit: 'min', qualifier: 'each side' },
  'Massage Gun Groin': { setsCount: '1', duration: '2', durationUnit: 'min', qualifier: 'each side' },
  'Massage Gun IT Band and VMO': { setsCount: '1', duration: '2', durationUnit: 'min', qualifier: 'each side' },
  'Massage Gun Lats Lying on Side': { setsCount: '1', duration: '2', durationUnit: 'min', qualifier: 'each side' },
  'Med Ball 3 Way RDL': { setsCount: '1', reps: '5', qualifier: 'each' },
  'Med Ball Around the Worlds': { setsCount: '1', reps: '10' },
  'Quadruped Hip Circles': { setsCount: '1', reps: '10', qualifier: 'each side' },
  'Quadruped Pigeon Variation': { setsCount: '1', duration: '30', durationUnit: 'sec', qualifier: 'each side' },
  'Quadruped Wrist Mobility': { setsCount: '1', duration: '30', durationUnit: 'sec' },
  'Scapular Wall Slides': { setsCount: '1', reps: '10' },
  'Shoulder Dislocations (Band/PVC)': { setsCount: '1', reps: '10' },
  'Shoulder Stretch on Bench': { setsCount: '1', reps: '5' },
  'Spiderman Kneeling Stretch': { setsCount: '1', reps: '5', qualifier: 'each' },
  'Spiderman Lunge with Rotation': { setsCount: '1', reps: '5', qualifier: 'each' },
  'Spiderman Stretch': { setsCount: '1', reps: '5', qualifier: 'each' },
  'Standing Hip Circles': { setsCount: '1', reps: '10', qualifier: 'each leg' },
  'Stretching Preset 1': { setsCount: '1', duration: '30', durationUnit: 'sec' },
  'Theracane Neck': { setsCount: '1', duration: '30', durationUnit: 'sec' },
  'The Stick Standing IT Band': { setsCount: '1', duration: '30', durationUnit: 'sec', qualifier: 'each side' },
  'Thoracic Extensions (Foam Roller)': { setsCount: '1', reps: '5' },
  'T Spine Back-Bend': { setsCount: '1', duration: '30', durationUnit: 'sec' },
  'T Spine Back-Bend on Roller': { setsCount: '1', reps: '5' },
  'T Spine Rotation with Roller': { setsCount: '1', reps: '5', qualifier: 'each side' },
  'Walking Cradles (Hip)': { setsCount: '1', reps: '10', qualifier: 'each' },
  'Walking Lunge with knee hug': { setsCount: '1', reps: '10', qualifier: 'each' },
  'Wall Hip Circles': { setsCount: '1', reps: '10', qualifier: 'each leg' },
  'Bench-Assisted Pigeon Stretch': { setsCount: '1', duration: '60', durationUnit: 'sec', qualifier: 'each side' },
  'Calf Rollout': { setsCount: '1', duration: '30', durationUnit: 'sec', qualifier: 'each' },
  'Calf Stretches': { setsCount: '1', duration: '30', durationUnit: 'sec', qualifier: 'each' },
  'Backward Scoop Toss': { setsCount: '1', reps: '20' },
  'Yoga Stretches - Pyramid, Triangle, Low Lunge, Extended Angle': { setsCount: '1', duration: '30', durationUnit: 'sec' },
};


// Case-insensitive lookup
const LOOKUP = {};
for (const [name, defaults] of Object.entries(EXERCISE_DEFAULTS)) {
  LOOKUP[name.toLowerCase()] = defaults;
}

/**
 * Get default values for an exercise by name.
 * Returns an object with fallback values, or empty object if no defaults exist.
 */
export function getExerciseDefaults(exerciseName) {
  if (!exerciseName) return {};
  return LOOKUP[exerciseName.toLowerCase()] || {};
}

/**
 * Merge defaults into an exercise object — only fills in fields that are
 * empty/undefined. Never overwrites what the trainer already set.
 */
export function applyExerciseDefaults(exercise) {
  const defaults = getExerciseDefaults(exercise.name);
  if (!defaults || Object.keys(defaults).length === 0) return exercise;

  const merged = { ...exercise };
  for (const [key, val] of Object.entries(defaults)) {
    if (!merged[key] && merged[key] !== 0) {
      merged[key] = val;
    }
  }
  return merged;
}
