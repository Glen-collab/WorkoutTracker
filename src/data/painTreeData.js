// Pain Management Tree Data - Ported from workout-helper-chatbot.js
// Video URLs are Cloudflare Stream iframe embed URLs

// =============================================
// VIDEO LIBRARY - Maps video display names to Cloudflare Stream URLs
// =============================================
export const VIDEO_LIBRARY = {
  // Massage Gun
  "Massage Gun Pec": "https://iframe.videodelivery.net/e2984ec7c5d33279c2311625ca5a41ba",
  "Massage Gun Biceps Anterior Delt": "https://iframe.videodelivery.net/1d218a538d07fb11755fe05cd5a35a2a",
  "Massage Gun Upper Trap Rhomboids": "https://iframe.videodelivery.net/0d561bde3a7b09c4eb8ff8c3e9c95879",
  "Massage Gun Triceps Long Head": "https://iframe.videodelivery.net/c3b8c30c15ad426469109ddcf6931ecb",
  "Massage Gun Serratus Teres Minor": "https://iframe.videodelivery.net/f330857f436433768d82b6d0db2e3ea0",
  "Massage Gun Lats Mid Back": "https://iframe.videodelivery.net/75397826368e57c87682cdfa3679dff6",
  "Massage Gun Lats Lying Side": "https://iframe.videodelivery.net/ed0cca997e893e2db2577ff139cde835",
  "Massage Gun IT Band Glutes": "https://iframe.videodelivery.net/168a7be4f088c3167fba8bb08ddd3c64",
  "Massage Gun IT Band VMO": "https://iframe.videodelivery.net/69350b0d6ca6e97d32831d838b5b57c4",
  "Massage Gun IT Band Calf": "https://iframe.videodelivery.net/cece0d804dd411194bea43fa6df1b387",
  "Massage Gun Groin": "https://iframe.videodelivery.net/8f906a15a112e12a2ecf12e302b50c0c",
  "Massage Gun Forearm": "https://iframe.videodelivery.net/821567a7a073eb592f81fb9379228c1e",

  // Lacrosse Ball
  "Lacrosse Ball Pecs": "https://iframe.videodelivery.net/057652a0d35358d80d29daacc0db1cf8",
  "Lax Ball Rhomboid Rollout": "https://iframe.videodelivery.net/bd74569b0df24b5e96ac4209e95250ae",
  "Lax Ball Rear Delt": "https://iframe.videodelivery.net/03b8879866882f65a77de036005553c4",

  // Foam Roll
  "Foam Roll Upper Back": "https://iframe.videodelivery.net/7911d9deffdfc1f387fbf4cbde74799f",
  "Foam Roll Lats": "https://iframe.videodelivery.net/60195c8bdf6f3b2aac10dd73ef79376f",
  "Foam Roll IT Band": "",
  "Foam Roll Quads": "https://iframe.videodelivery.net/1f6822f3fb1fbd73fba6521bd344bcb0",
  "Foam Roll Glutes": "https://iframe.videodelivery.net/8c3eea5bad9281fcc026c8d5d9e35cdf",
  "Foam Roll Groin": "https://iframe.videodelivery.net/84121021ff6994f987d6075354f26030",

  // Thera Cane
  "Thera Cane Shoulder Blade Rollout": "https://iframe.videodelivery.net/fd5ef25e5d6c58e41a65e2a414f0cfa7",
  "Thera Cane Upper Trap Release": "https://iframe.videodelivery.net/b81fb40f928d9e00c4440f0925583c50",

  // Psoas Tool
  "Psoas Tool Hip Flexor Release": "https://iframe.videodelivery.net/fd4b91c0e011c472f8600b65c3619b1b",

  // Stretches & Mobility
  "Shoulder Dislocations (Band)": "https://iframe.videodelivery.net/210d4937269e8c06ff0816e553f73ef8",
  "Shoulder Dislocate w/Ball": "https://iframe.videodelivery.net/6e564111fd16c2e7e24df293bbf6c380",
  "Doorway Pec Stretch": "https://iframe.videodelivery.net/0dc5a7ad69cadf1bb7b929ebce285b7f",
  "Black Birds": "https://iframe.videodelivery.net/6619689a27e2e2223ecace831e92ab88",
  "One Fist Cobra Stretch": "https://iframe.videodelivery.net/4f77b00820eae10decb75a7de7442435",
  "Couch Stretch": "https://iframe.videodelivery.net/4785a76eae5933fa8e746be8b71633d1",
  "Dynamic Pigeon Stretch": "https://iframe.videodelivery.net/622b7b4cf543878bb22526aa2a9419b7",
  "Groin Rockbacks": "https://iframe.videodelivery.net/edceeaa11a60b649425ab476d1e5b982",
  "Frog Stretch": "https://iframe.videodelivery.net/253c73bfc85d17e580ab2fd15ae0d664",
  "Door Jam Hamstring Stretch": "https://iframe.videodelivery.net/9c526c9159e588b5ec7dcfce64e0eea9",
  "T-Spine Rotations": "https://iframe.videodelivery.net/53c0550d70d7535d5c8d325ed812c71d",
  "Pigeon Pose + Grab Back Foot": "https://iframe.videodelivery.net/6433b2bb526fb3df312278fba14c46d2",

  // The Stick
  "The Stick Biceps Rollout": "https://iframe.videodelivery.net/115df49cfd266c7140e109e26b6308af",
  "The Stick Lat Rollout": "https://iframe.videodelivery.net/ae32ac541387d640db749e24e3127386",
  "The Stick Low Lats/Back Rollout": "https://iframe.videodelivery.net/330a4ab11ac2b3bed3d3d27c483ae9c9",
  "The Stick Standing IT Band": "https://iframe.videodelivery.net/de3c38b5d14a6208505af413b5048b0c",
};

export const MASSAGE_TIP = "<br><br><strong>💡 Pro tip:</strong> I would usually spend 2-3 minutes working on these areas. The key is how often you do it, not how long you do it.";

export const DISCLAIMER = "<br><br><em>⚠️ I'm sharing what I've learned through 25+ years of coaching. This is NOT medical advice. Always consult a medical professional for persistent pain.</em>";

// =============================================
// PAIN TREE - 53 nodes ported from old chatbot
// =============================================
export const PAIN_TREE = {
  // PAIN INTRO - Glen's Philosophy
  pain_intro: {
    message: "<strong>🎯 Let me share what I've learned:</strong><br><br>If there's any pain happening, from my experience it's most likely an overuse injury and lack of mobility work. That's the sciency version, but it usually comes down to sitting at a desk 8+ hours a day or grinding in the field while trying to balance life, kids, and adult responsibilities.<br><br>So check your ego at the door and let's focus on getting better, not proving something.<br><br>Where are you feeling it?",
    options: [
      { label: "Neck/Stress tension", next: "neck_stress" },
      { label: "Shoulder area", next: "shoulder_location" },
      { label: "Chest/Pec area", next: "chest_type" },
      { label: "Back (upper or lower)", next: "back_type" },
      { label: "Hip/Glute area", next: "hip_type" },
      { label: "Knee area", next: "knee_location" },
      { label: "Elbow/Forearm/Wrist", next: "elbow_location" },
      { label: "Something else", next: "pain_general" }
    ]
  },

  // NECK
  neck_stress: {
    message: "<strong>Neck & Stress Tension:</strong><br><br>In my experience with some of my clients who carry stress in their shoulders and neck, or have headaches due to being stressed or overwhelmed, I have done these massages and they've found relief.<br><br>The neck, shoulders, and upper back are all connected - tension in one area pulls on the others. A lot of times what feels like neck tightness is actually coming from the traps, rhomboids, or even the muscles along your ribs.<br><br><strong>What I've seen help:</strong><br>Take your time with these areas. Don't rush it. Breathe deep and let the muscle relax under the pressure." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Massage Gun Upper Trap Rhomboids", "Massage Gun Serratus Teres Minor", "Massage Gun Triceps Long Head", "Shoulder Dislocations (Band)", "Shoulder Dislocate w/Ball"],
    options: [
      { label: "I'll try these!", next: "pain_followup" },
      { label: "What about my shoulders?", next: "shoulder_location" },
      { label: "Go back", next: "pain_intro" }
    ]
  },

  pain_general: {
    message: "<strong>General advice from my experience:</strong><br><br>1. If one side is hurting, don't force double arm or leg movements like bar bench or back squat. Time to reassess. Be smart - you don't have to force the square peg in the round hole.<br><br>2. Muscle activation is key. Do your mobility work and warm-ups. You get way more results warming up properly than just grinding. I've been there - it works until it doesn't and sets you back months.<br><br>3. Focus on posture. 'Big chest' and 'stay tight' is what you'll hear at my gym. If you lose posture, you lose your core strength.<br><br>4. Do NOT force range of motion. Focus on where you're at, check the ego." + DISCLAIMER,
    options: [
      { label: "Let me pick a body part", next: "pain_intro" },
      { label: "Thanks, that helps!", next: "entry" }
    ]
  },

  // SHOULDER BRANCH
  shoulder_location: {
    message: "Got it - shoulder area. Can you point to where exactly?",
    options: [
      { label: "Front of shoulder", next: "shoulder_front" },
      { label: "Top (AC joint area)", next: "shoulder_top" },
      { label: "Side of shoulder", next: "shoulder_side" },
      { label: "Deep inside the joint", next: "shoulder_deep" },
      { label: "Shoulder blade area", next: "shoulder_blade" },
      { label: "Go back", next: "pain_intro" }
    ]
  },

  shoulder_front: {
    message: "Front of shoulder pain - is this happening during pressing movements?",
    options: [
      { label: "During bench press", next: "shoulder_front_bench" },
      { label: "During overhead press", next: "shoulder_front_overhead" },
      { label: "General front shoulder pain", next: "shoulder_front_general" },
      { label: "Go back", next: "shoulder_location" }
    ]
  },

  shoulder_front_bench: {
    message: "<strong>Front shoulder pain during bench press:</strong><br><br>Whenever I feel the front of my shoulder hurting, I know the backside is just as bad. It's like a game of tug of war - the rhomboid and trap take over the scapula so it puts pressure on the AC joint, and the pinpoint pressure goes to the anterior deltoid.<br><br><strong>What I've seen work:</strong><br>Make sure you roll out the backside as well as the front... and the biceps (those are hidden culprits)." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Massage Gun Pec", "Massage Gun Biceps Anterior Delt", "Massage Gun Upper Trap Rhomboids", "Massage Gun Triceps Long Head", "Lacrosse Ball Pecs", "Lax Ball Rhomboid Rollout", "Shoulder Dislocations (Band)", "Shoulder Dislocate w/Ball"],
    options: [
      { label: "That makes sense!", next: "pain_followup" },
      { label: "What about deep shoulder pain?", next: "shoulder_deep" },
      { label: "Go back", next: "shoulder_front" }
    ]
  },

  shoulder_front_overhead: {
    message: "<strong>Anterior delt pain during overhead press:</strong><br><br>Anytime I do an overhead press, I always try to stay a little bit lighter load and focus on full range of motion, sticking my head forward as I press above my head.<br><br><strong>What I've seen work:</strong><br>Lighten the load and roll out your rhomboid, trapezius, and your serratus anterior." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Massage Gun Serratus Teres Minor", "Massage Gun Upper Trap Rhomboids", "Massage Gun Triceps Long Head", "Thera Cane Shoulder Blade Rollout", "Shoulder Dislocations (Band)", "Shoulder Dislocate w/Ball"],
    options: [
      { label: "I'll try lighter weight", next: "pain_followup" },
      { label: "Go back", next: "shoulder_front" }
    ]
  },

  shoulder_front_general: {
    message: "<strong>General front shoulder pain:</strong><br><br>When powerlifters blow a pec doing bench press, it usually follows with a bicep issue as well. If you're having pain in the biceps tendon at your shoulder (front of shoulder), stop and roll out.<br><br><strong>What I've seen work:</strong><br>I have found a lot of success with a massage gun right in the middle of the biceps. Also roll out your pec and anterior delt." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Massage Gun Biceps Anterior Delt", "Massage Gun Pec", "Massage Gun Upper Trap Rhomboids", "Massage Gun Serratus Teres Minor", "Lacrosse Ball Pecs", "Shoulder Dislocations (Band)", "Shoulder Dislocate w/Ball"],
    options: [
      { label: "Thanks!", next: "pain_followup" },
      { label: "Go back", next: "shoulder_front" }
    ]
  },

  shoulder_top: {
    message: "<strong>AC Joint area (top of shoulder):</strong><br><br>Welcome to your AC joint - the acromioclavicular joint. If you have sharp pain here, there's dysfunction going on in your rotator cuff.<br><br>Is this during a specific movement?",
    options: [
      { label: "During bench press", next: "shoulder_top_bench" },
      { label: "During dips", next: "shoulder_top_dips" },
      { label: "During overhead press", next: "shoulder_top_overhead" },
      { label: "General AC joint pain", next: "shoulder_top_general" },
      { label: "Go back", next: "shoulder_location" }
    ]
  },

  shoulder_top_bench: {
    message: "<strong>Pain at top of shoulder during bench press:</strong><br><br>My suggestion is to roll out your upper back to increase range of motion, and roll out your biceps to help with that range of motion.<br><br>If you need to, lighten the weight and don't touch your chest all the way down. If that feels better, you're definitely too tight to go full range of motion.<br><br><strong>Key point:</strong> Range of motion and posture are the key - make sure you have that flexibility to do it safely." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Massage Gun Upper Trap Rhomboids", "Massage Gun Biceps Anterior Delt", "Massage Gun Pec", "Foam Roll Upper Back", "Shoulder Dislocations (Band)"],
    options: [
      { label: "I'll work on mobility", next: "pain_followup" },
      { label: "Go back", next: "shoulder_top" }
    ]
  },

  shoulder_top_dips: {
    message: "<strong>AC joint pain from dips:</strong><br><br>Dips are an animal that needs a lot of warm-up in my book as I get older. Some phases of life I loved dips and could add a lot of weight, otherwise they pretty much just hurt unless I warm up a lot.<br><br><strong>What I've seen work:</strong><br>Put your feet on a box or bench behind you and do assisted dips just to get warmed up. Don't go for big gains unless you're used to it and your shoulders don't hurt." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Massage Gun Pec", "Massage Gun Triceps Long Head", "Massage Gun Serratus Teres Minor", "Lacrosse Ball Pecs"],
    options: [
      { label: "Good advice!", next: "pain_followup" },
      { label: "Go back", next: "shoulder_top" }
    ]
  },

  shoulder_top_overhead: {
    message: "<strong>AC joint pain from overhead pressing:</strong><br><br>You need to go lighter and focus on full range of motion. Do more of a Z press: neutral to rotating your palms away, and stay light.<br><br>Anytime I would try to press heavy with my ego, I would only come down to 90° and anything below that would hurt. Did it help? I doubt it." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Massage Gun Upper Trap Rhomboids", "Massage Gun Triceps Long Head", "Massage Gun Serratus Teres Minor", "Thera Cane Upper Trap Release"],
    options: [
      { label: "I'll go lighter", next: "pain_followup" },
      { label: "Go back", next: "shoulder_top" }
    ]
  },

  shoulder_top_general: {
    message: "<strong>Sharp pain where collarbone meets shoulder:</strong><br><br>Welcome to your AC joint. If you have sharp pain here, there's dysfunction going on in your rotator cuff.<br><br><strong>What I've seen work:</strong><br>Use that lacrosse ball and look up a map of what your rotator is. My suggestion would be it's your Teres minor, Serratus (which isn't a rotator), Supraspinatus and Infraspinatus. Try to hit those with a lacrosse ball on the door or wall." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Massage Gun Serratus Teres Minor", "Massage Gun Upper Trap Rhomboids", "Lax Ball Rear Delt", "Thera Cane Shoulder Blade Rollout"],
    options: [
      { label: "I'll try the lacrosse ball", next: "pain_followup" },
      { label: "Go back", next: "shoulder_top" }
    ]
  },

  shoulder_side: {
    message: "<strong>Side delt pain during lateral raises:</strong><br><br>Whenever I have this issue, I have to roll out my lats quite a bit and my rear delt.<br><br><strong>What I've seen work:</strong><br>Use a foam roller and a lacrosse ball for those areas. Also try leading with your pinky finger during lateral raises." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Massage Gun Lats Mid Back", "Massage Gun Serratus Teres Minor", "Foam Roll Lats", "Lax Ball Rear Delt"],
    options: [
      { label: "Thanks!", next: "pain_followup" },
      { label: "Go back", next: "shoulder_location" }
    ]
  },

  shoulder_deep: {
    message: "<strong>Deep shoulder pain during bench press:</strong><br><br>Sometimes when it feels like the pain is inside the joint, it's most likely a muscle imbalance due to the rotators doing too much work.<br><br><strong>What I've seen work:</strong><br>Do some light stretching like a door jam pec stretch, or rolling out with a lacrosse ball. If you have a massage gun handy, lay on the bench and gun your ribs on your Serratus and your teres minor. Heck, while you're there hit your biceps and triceps.<br><br>That has always helped me with my shoulder pain and balance when I bench. Also, you could do some dumbbell pullovers - if you feel it in your AC joint or deep in your shoulder, you know your lats are extremely tight." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Massage Gun Serratus Teres Minor", "Massage Gun Biceps Anterior Delt", "Massage Gun Triceps Long Head", "Massage Gun Lats Mid Back", "Lacrosse Ball Pecs"],
    options: [
      { label: "That's really helpful!", next: "pain_followup" },
      { label: "I can't sleep on it", next: "shoulder_sleep" },
      { label: "Go back", next: "shoulder_location" }
    ]
  },

  shoulder_sleep: {
    message: "<strong>Can't sleep on shoulder after chest day:</strong><br><br>Sometimes sleep is the worst position you can have for eight straight hours. If it's so uncomfortable - and trust me, I've been there without sleep because of a shoulder issue - you need to check your ego and start rolling out your pec, your shoulders, everything that involves that shoulder joint.<br><br><strong>What I've seen work:</strong><br>Seek professional help - get a massage therapist, acupuncture therapist, or find a PT person that's awesome. A lot of it though, they're the guide and point you in the right direction, but you need to do the work yourself.<br><br>I've found with my own self if I roll out right before bed just to help loosen those muscles up, it helps me sleep a lot better." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Massage Gun Pec", "Massage Gun Upper Trap Rhomboids", "Massage Gun Serratus Teres Minor", "Massage Gun Biceps Anterior Delt", "Lacrosse Ball Pecs"],
    options: [
      { label: "I'll try rolling before bed", next: "pain_followup" },
      { label: "Go back", next: "shoulder_deep" }
    ]
  },

  shoulder_blade: {
    message: "Shoulder blade area - what's going on?",
    options: [
      { label: "Pain during bench press", next: "scapular_bench" },
      { label: "Can't keep blades retracted", next: "scapular_retract" },
      { label: "Scapular winging", next: "scapular_winging" },
      { label: "Knot between shoulder blades", next: "rhomboid_knot" },
      { label: "Go back", next: "shoulder_location" }
    ]
  },

  scapular_bench: {
    message: "<strong>Shoulder blade pain during bench press:</strong><br><br>If you have shoulder blade pain during pressing, you probably have shoulder pain in general. You need to really focus on rolling out your rhomboids in the center of your back and focus on squeezing that bench behind you while puffing your chest way up.<br><br><strong>What I've seen work:</strong><br>Lighten the load and focus on that posture." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Massage Gun Upper Trap Rhomboids", "Massage Gun Lats Mid Back", "Lax Ball Rhomboid Rollout", "Thera Cane Shoulder Blade Rollout"],
    options: [
      { label: "I'll work on posture", next: "pain_followup" },
      { label: "Go back", next: "shoulder_blade" }
    ]
  },

  scapular_retract: {
    message: "<strong>Can't keep shoulder blades retracted during press:</strong><br><br>Time to go back to the basics and start out lighter. This is fundamental number one exercise.<br><br><strong>What you need to do:</strong><br>You need to arch your back and squeeze and retract those shoulder blades. This keeps you safe and functional." + DISCLAIMER,
    options: [
      { label: "Back to basics!", next: "pain_followup" },
      { label: "Go back", next: "shoulder_blade" }
    ]
  },

  scapular_winging: {
    message: "<strong>Scapular winging noticed in mirror:</strong><br><br>We need to focus a lot more on reverse flies with a band and cables to activate. Do some isometric holds and try to relax your neck at the same time so you don't activate those upper traps.<br><br><strong>Key focus:</strong><br>We need to focus on your rhomboids." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Lax Ball Rhomboid Rollout", "Thera Cane Shoulder Blade Rollout"],
    options: [
      { label: "I'll work on reverse flies", next: "pain_followup" },
      { label: "Go back", next: "shoulder_blade" }
    ]
  },

  rhomboid_knot: {
    message: "<strong>Upper back knot/trigger point:</strong><br><br>Usually using a lacrosse ball against the wall with crossing my arm over and hitting that knot directly helps relieve some pain.<br><br><strong>Fair warning:</strong><br>If it's super painful, it will be tender for the next few days, but usually subsides and then feels a lot better in my experience." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Lax Ball Rhomboid Rollout", "Thera Cane Shoulder Blade Rollout"],
    options: [
      { label: "I'll try the lacrosse ball", next: "pain_followup" },
      { label: "Go back", next: "shoulder_blade" }
    ]
  },

  // CHEST/PEC BRANCH
  chest_type: {
    message: "Chest/pec pain - what's happening?",
    options: [
      { label: "Sharp pain during bench", next: "chest_sharp" },
      { label: "Pain near sternum", next: "chest_sternum" },
      { label: "Tightness/pulling sensation", next: "chest_tight" },
      { label: "One side weaker than other", next: "chest_imbalance" },
      { label: "Go back", next: "pain_intro" }
    ]
  },

  chest_sharp: {
    message: "<strong>Sharp pain in pec during/after bench press:</strong><br><br>This may happen when you push too hard. I would suggest stopping here, as the main focus.<br><br><strong>What I've seen work:</strong><br>The next time, adjust the weight accordingly and maybe even do some light cable flies or band flies to get some blood in there without putting extra strain on that pec like pressing does.<br><br><strong>🚫 RED FLAG:</strong><br>If you feel a muscle getting warm as you're lifting - a localized warm feeling - I have strained both a pec and a groin having that same feeling come over me while on my last few sets. Stop immediately." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Massage Gun Pec", "Massage Gun Serratus Teres Minor", "Massage Gun Biceps Anterior Delt", "Massage Gun Triceps Long Head", "Lacrosse Ball Pecs", "Black Birds"],
    options: [
      { label: "I'll back off the weight", next: "pain_followup" },
      { label: "Go back", next: "chest_type" }
    ]
  },

  chest_sternum: {
    message: "<strong>Pec strain near sternum attachment:</strong><br><br>I've had this, and a few of my clients throughout the years had this where it was actually like a rib head on your sternum that was out - that may be the cause. But first you should seek professional help.<br><br><strong>What I've seen work:</strong><br>I would use a lacrosse ball to do the pec rollout on the door jam. Or figure out how to roll out that sternum where it's more isolated while taking your time with light pressure. A massage gun at low speed and super soft touch may help. It should feel pretty pinpoint where it is." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Massage Gun Pec", "Massage Gun Serratus Teres Minor", "Lacrosse Ball Pecs"],
    options: [
      { label: "I'll try the lacrosse ball", next: "pain_followup" },
      { label: "Go back", next: "chest_type" }
    ]
  },

  chest_tight: {
    message: "<strong>Pec tightness/pulling sensation:</strong><br><br>If you feel that dull, achy pain, you need to roll out that pec right away with either a massage gun or a lacrosse ball or something that you can dig in there like your thumb.<br><br><strong>Why this matters:</strong><br>Making that muscle pliable and getting a lot of blood flow helps reduce injury in the long run." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Massage Gun Pec", "Massage Gun Biceps Anterior Delt", "Massage Gun Serratus Teres Minor", "Lacrosse Ball Pecs", "Black Birds"],
    options: [
      { label: "I'll roll it out!", next: "pain_followup" },
      { label: "Go back", next: "chest_type" }
    ]
  },

  chest_imbalance: {
    message: "<strong>One pec feels weaker/smaller than the other:</strong><br><br>I jacked my neck up doing behind-the-head military press and shut down my whole left side. The way I came back from that was doing a lot of shoulder mobility and flexibility work, and using acupuncture from a certified professional with STIM.<br><br>I finally realized it was Serratus along my ribs and my long head of the tricep that I needed a massage gun or roll out more to help at least produce power and help grow my pec.<br><br>I am still off balance, but it's way better and pain-free, which was helpful." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Massage Gun Serratus Teres Minor", "Massage Gun Triceps Long Head", "Massage Gun Pec", "Massage Gun Biceps Anterior Delt"],
    options: [
      { label: "Good to know I'm not alone", next: "pain_followup" },
      { label: "Go back", next: "chest_type" }
    ]
  },

  // BACK PAIN BRANCH
  back_type: {
    message: "Back pain - upper or lower?",
    options: [
      { label: "Upper back", next: "upper_back_type" },
      { label: "Lower back", next: "lower_back_type" },
      { label: "Go back", next: "pain_intro" }
    ]
  },

  upper_back_type: {
    message: "Upper back - what's happening?",
    options: [
      { label: "Pain during rows", next: "upper_back_rows" },
      { label: "Strain from deadlifts", next: "upper_back_deadlift" },
      { label: "General tightness", next: "upper_back_tight" },
      { label: "Go back", next: "back_type" }
    ]
  },

  upper_back_rows: {
    message: "<strong>Pain between shoulder blades during rows:</strong><br><br>It seems no matter how healthy or how much you can lift, the rhomboids always have a knot in there. The shoulder joint is one of the most complex joints in the body, so pain there during rows means you need to roll out more and focus on squeezing your shoulder blades together." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Lax Ball Rhomboid Rollout", "Thera Cane Shoulder Blade Rollout"],
    options: [
      { label: "Makes sense", next: "pain_followup" },
      { label: "Go back", next: "upper_back_type" }
    ]
  },

  upper_back_deadlift: {
    message: "<strong>Rhomboid strain from heavy deadlifts:</strong><br><br>Usually if your rhomboid is straining from heavy deadlifts, your posture is not strong enough.<br><br><strong>Warning:</strong><br>Do not overdo it on those weights, otherwise your low back will be next." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Foam Roll Upper Back", "Lax Ball Rhomboid Rollout"],
    options: [
      { label: "I'll work on posture", next: "pain_followup" },
      { label: "Go back", next: "upper_back_type" }
    ]
  },

  upper_back_tight: {
    message: "<strong>Upper back tightness:</strong><br><br>I like rolling on the foam roller with my arms across my chest and butt in the air, then going side to side for my upper back tightness. And doing a lot of mobility exercises like cat cow and thread the needle." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Foam Roll Upper Back"],
    options: [
      { label: "I'll try that!", next: "pain_followup" },
      { label: "Go back", next: "upper_back_type" }
    ]
  },

  lower_back_type: {
    message: "Lower back - when does it hurt?",
    options: [
      { label: "During squats", next: "lower_back_squat" },
      { label: "During deadlifts", next: "lower_back_deadlift" },
      { label: "SI joint (sacroiliac)", next: "lower_back_si" },
      { label: "Spasms", next: "lower_back_spasm" },
      { label: "Go back", next: "back_type" }
    ]
  },

  lower_back_squat: {
    message: "<strong>Low back pain during squats:</strong><br><br>I've had kids strain their low back from thinking they're stronger than they are while doing front squats. This to me was a psoas/hip flexor issue. I've also seen kids, including myself, go way too heavy and end up twisting trying to stand up with the weight and tweak the back. I've also seen kids squat down and completely fold over like a piece of paper because they went way too heavy.<br><br><strong>What I've seen work:</strong><br>Focus on form. Keep your chest big and roll out those glutes and warm up properly before you attempt squatting.<br><br>Any time I hurt my back while squatting with weights on my back, I disregard all heavy weights and just do body weight until I can remedy it by rolling out, massage, or seeing a therapist." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Massage Gun Lats Mid Back", "Massage Gun Lats Lying Side", "Massage Gun IT Band Glutes", "Massage Gun Groin", "Psoas Tool Hip Flexor Release", "Foam Roll Glutes", "Dynamic Pigeon Stretch", "Frog Stretch", "Door Jam Hamstring Stretch", "T-Spine Rotations"],
    options: [
      { label: "I'll focus on form", next: "pain_followup" },
      { label: "Go back", next: "lower_back_type" }
    ]
  },

  lower_back_deadlift: {
    message: "<strong>Low back pain during deadlifts:</strong><br><br>Whenever I tweak my back during deadlifts, it's because I'm doing it too many weeks in a row and too heavy. One hip is always tighter than the other and that's what pulls on the back - it's muscle imbalance.<br><br><strong>What I've seen work:</strong><br>Make sure you take your time, don't overdo it, and pull with good control.<br><br><strong>Form check:</strong><br>Go lighter and get your core stronger. By getting your core stronger, I mean stay tighter in your upper back and really arch your back and puff your chest out. You should see yourself in the mirror the whole time through your deadlift." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Massage Gun Lats Mid Back", "Massage Gun IT Band Glutes", "Massage Gun Groin", "Foam Roll Glutes", "Psoas Tool Hip Flexor Release", "Dynamic Pigeon Stretch", "Frog Stretch", "Door Jam Hamstring Stretch", "T-Spine Rotations"],
    options: [
      { label: "Good advice", next: "pain_followup" },
      { label: "Go back", next: "lower_back_type" }
    ]
  },

  lower_back_si: {
    message: "<strong>SI joint pain (sacroiliac):</strong><br><br>This is the pain that hurts when you bend over. It's like that hinging feeling when you can't bend over properly and have to bend your knees to bend over.<br><br><strong>What I've seen work:</strong><br>One key is to lift one leg up, grab something with your other hand to stabilize, and bend over using one leg. This has always helped me relieve pressure on my SI joint.<br><br>The other remedy when I tweak my SI is to roll out at least 5-6 times a day for a few minutes each time to get my glutes to relax on the one side that is super tight. This has always helped." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Massage Gun IT Band Glutes", "Massage Gun Lats Lying Side", "Massage Gun Groin", "Foam Roll Glutes", "Psoas Tool Hip Flexor Release", "Dynamic Pigeon Stretch", "Frog Stretch", "Door Jam Hamstring Stretch", "T-Spine Rotations"],
    options: [
      { label: "I'll try that single leg thing", next: "pain_followup" },
      { label: "Go back", next: "lower_back_type" }
    ]
  },

  lower_back_spasm: {
    message: "<strong>Lower back spasms:</strong><br><br>I've trained some athletes that have always had some low back spasms while running or doing squats. You really need to see yourself from a video perspective so you can see your leg length compared to your torso length compared to your bend.<br><br><strong>Body type matters:</strong><br>People with longer legs and a shorter torso, like me, do better squatting wide - it puts less pressure on the low back. People with a long torso and short legs often do better with heels elevated and keeping their chest more upright.<br><br><strong>The key:</strong><br>The anterior side is probably pretty tight, so take your time, roll out, and don't go too heavy." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Massage Gun Lats Mid Back", "Massage Gun Lats Lying Side", "Massage Gun IT Band Glutes", "Massage Gun Groin", "Psoas Tool Hip Flexor Release", "Foam Roll Glutes", "Dynamic Pigeon Stretch", "Frog Stretch", "Door Jam Hamstring Stretch", "T-Spine Rotations"],
    options: [
      { label: "Good insight on body type", next: "pain_followup" },
      { label: "Go back", next: "lower_back_type" }
    ]
  },

  // KNEE PAIN BRANCH
  knee_location: {
    message: "Knee pain - where exactly?",
    options: [
      { label: "General knee pain", next: "knee_general" },
      { label: "Front of knee (patella)", next: "knee_front" },
      { label: "Inside of knee", next: "knee_inside" },
      { label: "Outside of knee", next: "knee_outside" },
      { label: "Go back", next: "pain_intro" }
    ]
  },

  knee_general: {
    message: "<strong>Knee pain during squats (general):</strong><br><br>If you're doing back squats or any type of front squat, you should elevate your heels if you have knee pain. If you're having knee pain during other exercises, you need to focus on form and using your hip to bend, not your knee.<br><br><strong>Key cues:</strong><br>Push through your heels and not your toes. Focus on the weight on the outside of your shoes. For an athlete, this is imperative to activate your glute muscles and not put pressure on your knees - this is ACL prevention." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Massage Gun IT Band VMO", "Massage Gun IT Band Glutes", "Massage Gun IT Band Calf", "Massage Gun Groin", "Foam Roll IT Band", "Foam Roll Quads", "Dynamic Pigeon Stretch"],
    options: [
      { label: "I'll try heel elevation", next: "pain_followup" },
      { label: "Go back", next: "knee_location" }
    ]
  },

  knee_front: {
    message: "<strong>Patella tendinitis (front of knee):</strong><br><br>Foam roller, massage gun, the stick - use all of these modalities to soften up your leg muscles.<br><br><strong>Key insight:</strong><br>Your knee is only supposed to bend, so a lot of the tendinitis and inflammation is caused from those muscles being too tight and putting pressure on that joint." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Massage Gun IT Band VMO", "Massage Gun IT Band Calf", "Massage Gun Groin", "Foam Roll Quads", "Foam Roll IT Band", "Dynamic Pigeon Stretch"],
    options: [
      { label: "I'll foam roll more", next: "pain_followup" },
      { label: "Go back", next: "knee_location" }
    ]
  },

  knee_inside: {
    message: "<strong>Medial knee pain (inside):</strong><br><br>Call me crazy, but this is mostly due to your IT band on the outside of your thigh. You'll say 'no, but the pain is here on the inside' - but my reaction to that in my 25 years of experience showed me your IT band caused that knee pain because it's pulling on the outside of the knee to hurt the inside.<br><br>So humor me and try it out. If pain still persists, see a professional." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Massage Gun IT Band VMO", "Massage Gun IT Band Glutes", "Massage Gun Groin", "Foam Roll IT Band", "Dynamic Pigeon Stretch"],
    options: [
      { label: "I'll try rolling IT band", next: "pain_followup" },
      { label: "Go back", next: "knee_location" }
    ]
  },

  knee_outside: {
    message: "<strong>Lateral knee pain (outside) / IT Band Syndrome:</strong><br><br>Take your time and roll out the IT band and possibly even the shin for your lateral knee pain. Know the difference between knee pain from moving or actually having knee pain from getting hit from sport.<br><br>I've seen people with IT band syndrome that are mostly runners. This is caused from overuse. You need to relax that muscle on your hips." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Massage Gun IT Band VMO", "Massage Gun IT Band Glutes", "Massage Gun IT Band Calf", "Foam Roll IT Band", "Dynamic Pigeon Stretch", "Pigeon Pose + Grab Back Foot"],
    options: [
      { label: "I'll work on IT band", next: "pain_followup" },
      { label: "Go back", next: "knee_location" }
    ]
  },

  // HIP/GLUTE BRANCH
  hip_type: {
    message: "Hip/glute area - what's happening?",
    options: [
      { label: "Hip flexor pain", next: "hip_flexor" },
      { label: "Glute pain during squats/deadlifts", next: "hip_glute" },
      { label: "Deep glute/sciatic pain", next: "hip_piriformis" },
      { label: "Groin strain", next: "hip_groin" },
      { label: "Go back", next: "pain_intro" }
    ]
  },

  hip_flexor: {
    message: "<strong>Hip flexor pain during squats:</strong><br><br>Do NOT disregard this. You do not want to pop your groin or hip flexor during squats.<br><br><strong>My story:</strong><br>My first bodybuilding show, I was on my last set feeling really good and going deep and had that warm feeling in my groin. The next thing I knew my hip flexor or groin popped and my knee caved. Barely standing up, I had to figure out how to squat the next three weeks. The only way I was able to squat was to elevate my heels and stay super narrow to focus on quads.<br><br><strong>Bottom line:</strong><br>Do NOT push through that pain." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Massage Gun Groin", "Massage Gun IT Band Glutes", "Psoas Tool Hip Flexor Release"],
    options: [
      { label: "I won't push through it", next: "pain_followup" },
      { label: "Go back", next: "hip_type" }
    ]
  },

  hip_glute: {
    message: "<strong>Glute pain during squats/deadlifts:</strong><br><br>Feel the burn baby! Your glutes should be active during squats and deadlifts, but it shouldn't hurt. That usually comes out in the hip or the upper hamstring.<br><br><strong>What I've seen work:</strong><br>If you do have some issues going on in your glute, I actually use a shotput to roll out my butt cheek, and I've recently used medicine balls to get more pressure into the glute to help loosen that whole hip out." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Massage Gun IT Band Glutes", "Massage Gun Groin", "Foam Roll Glutes"],
    options: [
      { label: "Shotput - good idea!", next: "pain_followup" },
      { label: "Go back", next: "hip_type" }
    ]
  },

  hip_piriformis: {
    message: "<strong>Piriformis syndrome / Glute-sciatic pain shooting down leg:</strong><br><br>Welcome to piriformis syndrome. You need to really take your time and go through the mobility drills and not push it with hard exercises like double leg squats or deadlifts.<br><br><strong>What I've seen work:</strong><br>Focus more on single leg movements and easier exercises like glute extensions and hip thrusts. The foam roller works wonders for this area, and so does any type of medicine ball or shotput. Stay light on it and focus on small circles, as well as dropping that knee down and staying relaxed." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Massage Gun IT Band Glutes", "Massage Gun Lats Lying Side", "Foam Roll Glutes"],
    options: [
      { label: "I'll focus on single leg work", next: "pain_followup" },
      { label: "Go back", next: "hip_type" }
    ]
  },

  hip_groin: {
    message: "<strong>Groin strain from squats:</strong><br><br>I have pulled my groin once from squatting heavy. It was my last set of five with heavier weight and it felt warm and then pop! I had to do the next few remaining weeks narrow stance, heels elevated because I'm a blockhead.<br><br><strong>What I know now:</strong><br>Now being older and wiser, I would have stuck with body weight holds and doing single leg exercises on my good leg. Focus more on rolling out and getting fresh blood to that area to help it heal.<br><br>I didn't figure this out until recently, but I need to roll my groin out a lot more. This is helping with my taekwondo as well as feeling better when I squat. It was one of those muscles I kind of forgot about." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Massage Gun Groin", "Massage Gun IT Band Glutes", "Foam Roll Groin"],
    options: [
      { label: "I'll roll the groin out", next: "pain_followup" },
      { label: "Go back", next: "hip_type" }
    ]
  },

  // ELBOW/FOREARM/WRIST BRANCH
  elbow_location: {
    message: "Elbow, forearm, or wrist - which area?",
    options: [
      { label: "Elbow pain from pressing", next: "elbow_pressing" },
      { label: "Elbow pain from curls", next: "elbow_curls" },
      { label: "Golfer's elbow (inside)", next: "elbow_golfer" },
      { label: "Wrist pain", next: "wrist_pain" },
      { label: "Forearm pump/pain", next: "forearm_pain" },
      { label: "Go back", next: "pain_intro" }
    ]
  },

  elbow_pressing: {
    message: "<strong>Elbow pain from pressing movements:</strong><br><br>Your body needs to be in balance, so make sure you roll out and take care of your triceps, your biceps, and your forearm. All of those muscles cross your elbow joint.<br><br><strong>Real example:</strong><br>In one instance with one of my clients, she could not hammer curl much weight because of elbow pain on the crook of her arm. I actually massaged the inside of her arm right on the radial head of the forearm, and that helped tremendously with her elbow pain." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Massage Gun Forearm"],
    options: [
      { label: "I'll roll out more", next: "pain_followup" },
      { label: "Go back", next: "elbow_location" }
    ]
  },

  elbow_curls: {
    message: "<strong>Elbow pain from curls (biceps tendinitis):</strong><br><br>I would often get elbow pain after I set the bar down and let go of the bar. It felt like I couldn't un-grip the bar because of the pain in my forearms and elbows.<br><br><strong>What I learned:</strong><br>This would usually be because I was going too heavy and using a straight bar, which is throwing my elbows out of position. So change your grip if you need to, but stay lighter." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Massage Gun Forearm"],
    options: [
      { label: "I'll try a different grip", next: "pain_followup" },
      { label: "Go back", next: "elbow_location" }
    ]
  },

  elbow_golfer: {
    message: "<strong>Golfer's elbow (medial epicondylitis):</strong><br><br>Golfer's elbow is one of the harder ones to help fix because if you know a golfer, they love to golf. Same with tennis.<br><br><strong>What I've seen work:</strong><br>The only thing I've found successful with my clients is to roll out the forearm and dig into the crease of the elbow with my thumb to try to create blood flow in those sensitive areas that are tightening up on them. And make sure you roll out the bicep, the tricep, and the forearm. All of those muscles support that joint." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Massage Gun Forearm"],
    options: [
      { label: "I'll dig into it", next: "pain_followup" },
      { label: "Go back", next: "elbow_location" }
    ]
  },

  wrist_pain: {
    message: "<strong>Wrist pain during bench press:</strong><br><br>It's always fun to go heavy, isn't it? Try to reduce the load or, if you have wrist wraps, you can try those to help secure that joint like a powerlifter does.<br><br><strong>Key insight:</strong><br>Otherwise, check your ego and come back another day to fight. Make sure you massage all your forearm muscles out as all those muscles' tendons cover your wrist. Usually pain is deferred, so it might not be the wrist at all - it might be the forearm muscles causing that pain." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Massage Gun Forearm"],
    options: [
      { label: "I'll try wrist wraps", next: "pain_followup" },
      { label: "Go back", next: "elbow_location" }
    ]
  },

  forearm_pain: {
    message: "<strong>Forearm pump/pain during pressing:</strong><br><br>I just did a hanging challenge in Wisconsin Dells to try to win a $100 gift card. The bar rolls and was a little wider than I'm used to, so my forearms were pumped up big time.<br><br><strong>Know the difference:</strong><br>If you're getting that forearm pump during your workout, that's fine - you're probably using bigger bars. But forearm PAIN in your elbows and wrists is not good. You need to know the difference between pain in your joints and pain in your muscles.<br><br>One of the guys I train is a plumber so he has forearm pain in certain movements, so we just avoid them. His job is very hands-on, so you don't want to overwork muscles he's using every single day." + MASSAGE_TIP + DISCLAIMER,
    videos: ["Massage Gun Forearm"],
    options: [
      { label: "Good distinction", next: "pain_followup" },
      { label: "Go back", next: "elbow_location" }
    ]
  },

  // FOLLOWUP AND COMMITMENT
  pain_followup: {
    message: "That's really common. I've seen this pattern many times over my 25 years of coaching.<br><br>Does this advice match what you're experiencing?",
    options: [
      { label: "Yes, this helps!", next: "commitment" },
      { label: "I have a different issue", next: "pain_intro" },
      { label: "Thanks, I'm good!", next: "entry" }
    ]
  },

  commitment: {
    message: "Awesome! Will you commit to trying the release work for the next week?<br><br>Remember: small consistent effort beats occasional big effort every time. Even 2-5 minutes a day makes a difference.",
    options: [
      { label: "Yes, I'm on it!", next: "commitment_positive" },
      { label: "I'll try", next: "commitment_positive" }
    ]
  },

  commitment_positive: {
    message: "That's what I like to hear!<br><br>Check back with me next week and let me know how it's going. You've got this!<br><br><em>Remember: check your ego at the door and focus on getting better, not proving something.</em>",
    options: [
      { label: "Thanks!", next: "entry" },
      { label: "I have another question", next: "entry" }
    ]
  },
};
