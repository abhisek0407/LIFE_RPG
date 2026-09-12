// Advanced Semantic AI Quest & Microtask Decomposition Engine
// Performs cognitive task parsing, friction analysis, and semantic step generation

import { DIFFICULTY_PRESETS, MOTIVATION_PRESETS } from './rpgEngine';

/**
 * Categorizes and extracts semantic entities from the user's task string.
 */
function analyzeTaskSemantics(task, domain) {
  const clean = (task || '').trim();
  const lower = clean.toLowerCase();

  // Keyword intent categories
  const categories = [
    {
      type: 'hydration',
      domain: 'health',
      keywords: ['water', 'hydrate', 'hydration', 'drink', 'fluid', 'liter', 'litres', 'gallon', 'glass'],
      name: 'Hydration & Cellular Energy'
    },
    {
      type: 'sleep_rest',
      domain: 'health',
      keywords: ['sleep', 'bed', 'wake', 'nap', 'insomnia', 'rest', 'bedtime', 'circadian'],
      name: 'Sleep & Nervous System Recovery'
    },
    {
      type: 'nutrition_cooking',
      domain: 'health',
      keywords: ['cook', 'meal', 'dinner', 'lunch', 'breakfast', 'grocery', 'groceries', 'chicken', 'salad', 'food', 'diet', 'protein', 'vegetable', 'prep'],
      name: 'Nutrition & Metabolic Fuel'
    },
    {
      type: 'exercise_cardio',
      domain: 'health',
      keywords: ['run', 'running', 'jog', 'jogging', 'walk', 'walking', 'treadmill', '5k', '10k', 'cycling', 'bike', 'cardio', 'swim', 'steps'],
      name: 'Cardiovascular Endurance'
    },
    {
      type: 'exercise_strength',
      domain: 'health',
      keywords: ['gym', 'workout', 'squat', 'pushup', 'bench', 'dumbbells', 'weights', 'lift', 'lifting', 'leg day', 'bicep', 'deadlift', 'pullup'],
      name: 'Musculoskeletal Strength'
    },
    {
      type: 'mobility_posture',
      domain: 'health',
      keywords: ['stretch', 'stretching', 'mobility', 'yoga', 'foam roll', 'posture', 'neck pain', 'back pain', 'hip'],
      name: 'Flexibility & Joint Mobility'
    },
    {
      type: 'cleaning_home',
      domain: 'health',
      keywords: ['clean', 'cleaning', 'room', 'bedroom', 'desk', 'house', 'apartment', 'dishes', 'laundry', 'garage', 'declutter', 'trash', 'sweep', 'vacuum', 'closet', 'tidy'],
      name: 'Environment Decluttering'
    },
    {
      type: 'reading_books',
      domain: 'mental',
      keywords: ['read', 'reading', 'book', 'novel', 'chapter', 'article', 'paper', 'literature', 'pages'],
      name: 'Focused Reading & Deep Intake'
    },
    {
      type: 'academic_exam',
      domain: 'mental',
      keywords: ['study', 'studying', 'exam', 'midterm', 'final', 'test', 'math', 'physics', 'chemistry', 'biology', 'history', 'quiz', 'homework', 'lecture', 'revision'],
      name: 'Academic Mastery & Recall'
    },
    {
      type: 'programming_tech',
      domain: 'skill',
      keywords: ['code', 'coding', 'program', 'build', 'debug', 'debugging', 'refactor', 'react', 'node', 'python', 'javascript', 'mongodb', 'sql', 'api', 'git', 'frontend', 'backend', 'deploy', 'css', 'bug', 'feature'],
      name: 'Software Craftsmanship'
    },
    {
      type: 'writing_content',
      domain: 'skill',
      keywords: ['write', 'writing', 'essay', 'blog', 'draft', 'document', 'notes', 'report', 'script', 'article', 'proposal'],
      name: 'Written Expression & Synthesis'
    },
    {
      type: 'career_admin',
      domain: 'skill',
      keywords: ['resume', 'cv', 'apply', 'applying', 'job', 'internship', 'interview', 'portfolio', 'taxes', 'bills', 'finance', 'budget', 'email', 'inbox'],
      name: 'Career Capital & Life Logistics'
    },
    {
      type: 'creative_art',
      domain: 'skill',
      keywords: ['draw', 'drawing', 'paint', 'painting', 'design', 'figma', 'music', 'guitar', 'piano', 'video', 'edit', 'editing', 'photo', 'art', 'sketch'],
      name: 'Creative Expression & Design'
    },
    {
      type: 'mindfulness_calm',
      domain: 'mental',
      keywords: ['meditate', 'meditation', 'breathe', 'breathing', 'journal', 'journaling', 'anxiety', 'overwhelmed', 'calm', 'reflect', 'gratitude'],
      name: 'Mindfulness & Mental Clarity'
    }
  ];

  // Detect matching category
  let matched = null;
  let highestScore = 0;

  for (const cat of categories) {
    let score = 0;
    for (const kw of cat.keywords) {
      if (lower.includes(kw)) {
        score += kw.length > 4 ? 2 : 1;
      }
    }
    if (score > highestScore) {
      highestScore = score;
      matched = cat;
    }
  }

  // If no strong keyword match, use user selected domain
  if (!matched) {
    matched = {
      type: 'general_objective',
      domain: domain || 'mental',
      name: `${(domain || 'Focus').toUpperCase()} Objective`
    };
  }

  // Extract numbers or targets (e.g. "3 chapters", "5k", "20 pages", "1 hour")
  const targetMatch = clean.match(/(\d+)\s*(chapters?|pages?|mins?|minutes?|hours?|km|k|miles?|liters?|litres?|items?|reps?|sets?)/i);
  const targetSpec = targetMatch ? targetMatch[0] : null;

  return {
    rawTask: clean,
    matchedType: matched.type,
    categoryName: matched.name,
    inferredDomain: matched.domain,
    targetSpec
  };
}

/**
 * Intelligent microtask decomposition based on task semantics, domain, difficulty, and motivation.
 */
export function generateMicrotasks({ task, domain, difficulty, motivationLevel }) {
  const diff = DIFFICULTY_PRESETS[difficulty] || DIFFICULTY_PRESETS.medium;
  const motiv = MOTIVATION_PRESETS[motivationLevel] || MOTIVATION_PRESETS.medium;

  const analysis = analyzeTaskSemantics(task, domain);
  const clean = analysis.rawTask || 'Conquer the main goal';
  const target = analysis.targetSpec || '';

  const steps = [];

  // Generate tailored steps based on parsed semantic category
  switch (analysis.matchedType) {
    case 'hydration':
      if (motivationLevel === 'low') {
        steps.push(
          'Fill up a clean glass or bottle with cold filtered water right now',
          'Take 5 slow, deep sips to signal your nervous system to wake up',
          `Set up your target container (${target || '1 to 2 Liters'}) within arm's reach of your desk`,
          'Drink your first full 300ml glass before continuing other tasks',
          'Log your hydration streak and set an afternoon checkpoint reminder'
        );
      } else {
        steps.push(
          'Prep a dedicated water container with fresh ice or a slice of lemon',
          'Drink 500ml immediately to kickstart metabolic absorption',
          `Pace your intake: finish half of your ${target || 'daily goal'} before midday`,
          'Reach full target hydration and celebrate with a quick physical stretch'
        );
      }
      break;

    case 'sleep_rest':
      if (motivationLevel === 'low') {
        steps.push(
          'Step away from bright overhead lights and switch to ambient warm light',
          'Plug your phone into a charging spot across the room (away from the bed)',
          'Change into comfortable sleepwear and wash your face with cool water',
          'Lie down flat and do 4 cycles of slow 4-7-8 relaxation breathing',
          'Close your eyes with zero pressure to sleep immediately—just resting counts'
        );
      } else {
        steps.push(
          'Set a digital sunset: close all social media and work notifications',
          'Prep your sleep sanctuary: cool bedroom temperature to ~19°C (66°F) and draw dark curtains',
          'Engage in 10 minutes of light mobility stretching or fiction reading',
          'Hit the pillow at your scheduled target time to optimize deep delta waves'
        );
      }
      break;

    case 'nutrition_cooking':
      if (motivationLevel === 'low') {
        steps.push(
          'Walk into the kitchen and clear 1 clean workstation on the counter',
          'Pull out only the essential 3-4 ingredients from the fridge/pantry',
          'Chop or prep the main protein and vegetables without rushing',
          `Cook ${clean} using the simplest pan or baking sheet with your favorite spices`,
          'Plate your fresh nutritious meal, drink a glass of water, and leave dishes soaking'
        );
      } else {
        steps.push(
          'Review recipe requirements and pull out cookware and ingredients',
          'Efficient mise en place: wash, slice, and season all ingredients upfront',
          `Cook ${clean} with precise timing for optimal taste and nutrient retention`,
          'Serve meal, pack any extra portions for meal-prep containers, and wipe counters'
        );
      }
      break;

    case 'cleaning_home':
      if (motivationLevel === 'low') {
        steps.push(
          'Grab 1 single trash bag and pick up any obvious garbage or wrappers for 2 minutes',
          `Clear off just the top surface of ${clean.includes('desk') ? 'your desk' : 'one section'}`,
          'Put away 5 out-of-place items to their proper homes',
          'Quick wipe-down of the newly cleared surface with a disinfectant cloth',
          'Take out the filled trash bag to the bin and stand back to appreciate the clear space'
        );
      } else {
        steps.push(
          'Put on an energetic focus playlist and gather cleaning supplies (bags, spray, microfiber)',
          `Tackle the biggest visual clutter zone in ${clean}`,
          'Sort remaining items into Keep, Relocate, and Discard categories',
          'Deep clean surfaces: dust shelves, vacuum/sweep floors, and empty trash',
          'Final aesthetic reset: light a candle or open the window for fresh air flow'
        );
      }
      break;

    case 'exercise_cardio':
      if (motivationLevel === 'low') {
        steps.push(
          'Just put on your workout socks and comfortable running/walking shoes',
          'Drink 200ml of water and step outside the door (or onto the treadmill)',
          'Commit to only 5 minutes of gentle walking—you have permission to stop after',
          `Transition into your ${clean} at an easy conversational rhythm`,
          'Cool down with a 2-minute relaxed walk, stretch calves, and log your distance'
        );
      } else {
        steps.push(
          'Lace up shoes, set up running watch or GPS tracker, and drink hydration',
          '3-minute dynamic warmup: high knees, leg swings, and ankle rotations',
          `Execute main cardio session: ${clean}`,
          'Post-cardio cooldown walk, quad/hamstring stretches, and hydration recovery'
        );
      }
      break;

    case 'exercise_strength':
      if (motivationLevel === 'low') {
        steps.push(
          'Change into gym clothes and fill your water bottle with cold water',
          'Do 3 minutes of gentle joint mobility (arm circles, hip openers, bodyweight squats)',
          'Perform 1 warm-up set with very light weight or bodyweight just to feel the movement',
          `Complete your primary core exercise for ${clean} with good form over heavy weight`,
          'Finish with 1 cool-down set, re-rack weights, and hydrate'
        );
      } else {
        steps.push(
          'Dynamic warmup & mobility drills to activate target muscle groups',
          `Primary compound lift session for ${clean} with progressive overload`,
          'Accessory hypertrophy sets focusing on mind-muscle contraction and tempo',
          'Cool-down stretch, record weights/reps in logbook, and consume post-workout nutrition'
        );
      }
      break;

    case 'academic_exam':
    case 'reading_books':
      if (motivationLevel === 'low') {
        steps.push(
          'Clear your desk of everything except the book/notes and a pen',
          'Turn phone on airplane mode or place it in another room for 20 minutes',
          `Open to the first section of "${clean}" and skim only headlines and diagrams for 3 minutes`,
          'Read or study just the first 2 pages or 1 core concept without testing yourself yet',
          'Write down 2 bullet point insights in your own words to cement the milestone'
        );
      } else {
        steps.push(
          'Set a 25-minute Pomodoro focus timer and define the exact target chapter/notes',
          `Deep focus study block: active reading and formula breakdown for "${clean}"`,
          'Active recall challenge: close the material and solve 3 practice questions from memory',
          'Review mistakes, synthesize summary flashcards, and review key formulas'
        );
      }
      break;

    case 'programming_tech':
      if (motivationLevel === 'low') {
        steps.push(
          'Open code editor and navigate directly to the single file that needs work',
          'Write a quick 2-line comment outline describing the simplest first requirement',
          `Implement the bare minimum scaffold for: ${clean}`,
          'Run tests or console logs to verify that the first small piece works without errors',
          'Stage changes with a clean git commit message and take a quick 1-minute stretch'
        );
      } else {
        steps.push(
          'Review architecture requirements, API contracts, and edge cases',
          `Core coding sprint: Implement functional logic for "${clean}"`,
          'Verify edge cases, error handling, performance bottlenecks, and write unit tests',
          'Refactor code for clean readability, verify build, and commit to branch'
        );
      }
      break;

    case 'career_admin':
      if (motivationLevel === 'low') {
        steps.push(
          'Open your document / application portal and do NOT write yet—just review the prompt',
          'Bullet point your 3 strongest relevant skills or bullet points on scrap paper',
          `Draft the first rough section of: ${clean} without editing your grammar`,
          'Polish and format the draft: check spelling, layout, and contact details',
          'Hit send / submit or save the file as PDF and log the progress'
        );
      } else {
        steps.push(
          'Gather target job description or administrative requirements and highlight keywords',
          `Draft and tailor content specifically for "${clean}"`,
          'Refine formatting, verify compliance criteria, and double-check key metrics',
          'Submit application / deliverable and log confirmation into tracker'
        );
      }
      break;

    default:
      // High quality contextual fallback that extracts actual verb & subject
      if (motivationLevel === 'low') {
        steps.push(
          'Take 1 full grounding breath and sit down at your workspace without pressure',
          `Write down the single smallest 60-second physical starter action for "${clean}"`,
          'Complete that tiny starter action with zero judgment on speed or perfection',
          `Keep the momentum going for 10 minutes on: ${clean}`,
          'Check off your progress, record XP gained, and give yourself credit for breaking inertia'
        );
      } else {
        steps.push(
          'Eliminate nearby distractions and outline the exact finished criteria',
          `Phase 1 Execution: Build out the foundation of "${clean}"`,
          `Phase 2 Execution: Complete the core deliverable and refine details`,
          'Final review, verify completeness, and wrap up with clean documentation'
        );
      }
      break;
  }

  // Distribute XP and Gold
  const totalBaseXp = diff.xp;
  const totalBaseGold = diff.gold;
  const count = steps.length;

  const xpPerStep = Math.max(10, Math.floor(totalBaseXp / count));
  const goldPerStep = Math.max(3, Math.floor(totalBaseGold / count));

  return {
    task: clean,
    domain: analysis.inferredDomain || domain,
    difficulty,
    motivationLevel,
    totalXp: totalBaseXp,
    totalGold: totalBaseGold,
    analysis: {
      categoryName: analysis.categoryName,
      strategy: motivationLevel === 'low'
        ? 'Ultra-gentle momentum ramp (bypasses paralysis with zero initial friction)'
        : motivationLevel === 'high'
        ? 'High-impact focus sprint (direct execution)'
        : 'Structured progressive milestones',
      detectedTarget: target || 'Standard Scope'
    },
    microtasks: steps.map((title, idx) => ({
      id: `mt_${Date.now()}_${idx}`,
      title,
      order: idx + 1,
      xpReward: idx === count - 1 ? (totalBaseXp - xpPerStep * (count - 1)) : xpPerStep,
      goldReward: idx === count - 1 ? (totalBaseGold - goldPerStep * (count - 1)) : goldPerStep,
      isCompleted: false,
      completedAt: null
    }))
  };
}

/**
 * Emergency grounding microtasks for when user clicks "Feel Stuck"
 */
export function generateFeelStuckRescue() {
  return {
    reassurance: "Overwhelm is just your nervous system asking for a moment to reboot. You don't have to conquer everything right now—just take these 3 microscopic restorative actions.",
    breathingPacer: {
      type: 'Box Breathing (4-4-4-4)',
      instructions: 'Inhale 4s • Hold 4s • Exhale 4s • Hold 4s',
      cycleSeconds: 16
    },
    groundingMicrotasks: [
      {
        id: 'stuck_breathe',
        title: 'Complete 1 cycle of 4-4-4-4 Box Breathing to drop cortisol',
        domain: 'mental',
        xpReward: 20,
        goldReward: 5,
        icon: 'Wind'
      },
      {
        id: 'stuck_water',
        title: 'Drink a cold glass of water and roll your shoulders 5 times',
        domain: 'health',
        xpReward: 15,
        goldReward: 5,
        icon: 'Droplets'
      },
      {
        id: 'stuck_action',
        title: 'Write down the single next 60-second physical step on paper',
        domain: 'skill',
        xpReward: 25,
        goldReward: 10,
        icon: 'Edit3'
      }
    ]
  };
}
