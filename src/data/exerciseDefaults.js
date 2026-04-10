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
  'Farmers Carry': { setsCount: '4', weight: '70', distance: '40', distanceUnit: 'yd', duration: '60', durationUnit: 'sec' },
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
