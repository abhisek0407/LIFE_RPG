// Persona & Character Archetype Calculation Engine
// Dynamically maps user's Mental, Health, and Skill (Personality) levels to iconic characters:
// Famous personalities, Sigma figures, Anime titans, and Cartoon prodigies.

export const AVATAR_PRESETS = [
  {
    id: 'cyber_paladin',
    name: 'Cyber Paladin',
    category: 'Sci-Fi Knight',
    description: 'Armored vanguard pulsing with cyan particle energy.',
    icon: '🛡️',
    gradient: 'from-cyan-500 via-blue-600 to-indigo-700',
    avatarUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'sigma_executive',
    name: 'Thomas Sigma',
    category: 'Sigma Icon',
    description: 'Bespoke charcoal overcoat, focused razor stare, cold composure.',
    icon: '💼',
    gradient: 'from-slate-700 via-zinc-800 to-black',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'shadow_shinobi',
    name: 'Shadow Shinobi',
    category: 'Anime Assassin',
    description: 'Silent midnight assassin moving with ultrasonic discipline.',
    icon: '🗡️',
    gradient: 'from-purple-600 via-violet-800 to-slate-950',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'dark_knight',
    name: 'Dark Knight',
    category: 'Vigilante Titan',
    description: 'Master tactician prepared for every cosmic contingency.',
    icon: '🦇',
    gradient: 'from-amber-600 via-slate-800 to-black',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'ultra_titan',
    name: 'Ultra Saiyan',
    category: 'Anime Titan',
    description: 'Aura ablaze with infinite vitality and martial godhood.',
    icon: '⚡',
    gradient: 'from-amber-400 via-orange-500 to-red-600',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'arcane_scholar',
    name: 'Quantum Genius',
    category: 'Mastermind',
    description: 'Hyper-cerebral intellect calculating 10,000 steps ahead.',
    icon: '🔮',
    gradient: 'from-cyan-400 via-teal-600 to-emerald-800',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'
  }
];

export const FRAME_PRESETS = [
  { id: 'neon_cyan', name: 'Cyber Neon Cyan', borderClass: 'ring-4 ring-cyan-400 ring-offset-2 dark:ring-offset-slate-900', glowColor: '#06b6d4' },
  { id: 'golden_sovereign', name: 'Golden Sovereign', borderClass: 'ring-4 ring-amber-400 ring-offset-2 dark:ring-offset-slate-900 shadow-glow-gold', glowColor: '#f59e0b' },
  { id: 'crimson_berserk', name: 'Crimson Flame', borderClass: 'ring-4 ring-red-500 ring-offset-2 dark:ring-offset-slate-900', glowColor: '#ef4444' },
  { id: 'amethyst_void', name: 'Amethyst Void', borderClass: 'ring-4 ring-purple-500 ring-offset-2 dark:ring-offset-slate-900', glowColor: '#a855f7' },
  { id: 'emerald_titan', name: 'Emerald Vitality', borderClass: 'ring-4 ring-emerald-400 ring-offset-2 dark:ring-offset-slate-900', glowColor: '#10b981' },
];

/**
 * Persona database classified by dominant domain focus and level tier.
 */
const PERSONA_ROSTER = {
  // Dominant Mental (Focus, Strategy, Intellect)
  mental: [
    {
      minLevel: 1,
      name: 'Dexter (Boy Genius)',
      category: 'Cartoon Prodigy',
      title: 'Laboratory Visionary & Early Architect',
      quote: 'What a fine day for science! Every equation bends to my curiosity.',
      badge: 'Cerebral Pioneer',
      color: 'from-cyan-500 to-blue-600',
      textColor: 'text-cyan-400',
      traits: ['Analytical Mindset', 'Quick Study', 'Formula Breaker']
    },
    {
      minLevel: 3,
      name: 'Sherlock Holmes',
      category: 'Legendary Mastermind',
      title: 'Consulting Detective & Master of Deduction',
      quote: 'It is a capital mistake to theorize before one has data. Insensibly one begins to twist facts.',
      badge: 'Apex Deductive Mind',
      color: 'from-cyan-600 to-indigo-700',
      textColor: 'text-cyan-300',
      traits: ['Instant Pattern Recognition', 'Unfiltered Focus', 'Psychological Reading']
    },
    {
      minLevel: 5,
      name: 'Aizen Sōsuke',
      category: 'Anime Mastermind',
      title: 'Architect of Reality & Sovereign Planner',
      quote: 'Since when were you under the impression that I was not in control?',
      badge: '10,000-Step Strategist',
      color: 'from-indigo-600 to-violet-900',
      textColor: 'text-indigo-400',
      traits: ['Infinite Foresight', 'Unfazed Composure', 'Cold Execution']
    },
    {
      minLevel: 8,
      name: 'Dr. Manhattan',
      category: 'Cosmic Transcendent',
      title: 'Quantum Sovereign of Infinite Intellect',
      quote: 'I have walked across the surface of the sun. I have witnessed events so tiny and so fast they can hardly be said to have occurred at all.',
      badge: 'Omniscient Reality Weaver',
      color: 'from-blue-500 via-cyan-400 to-indigo-900',
      textColor: 'text-cyan-200',
      traits: ['Transcendent Awareness', 'Reality Alteration', 'Absolute Detachment']
    }
  ],

  // Dominant Health (Physical Vitality, Discipline, Resilience)
  health: [
    {
      minLevel: 1,
      name: 'Rock Lee (Weights On)',
      category: 'Anime Titan',
      title: 'Indomitable Splendid Ninja',
      quote: 'A dropout will beat a genius through hard work! 100 push-ups, right now!',
      badge: 'Relentless Grit',
      color: 'from-emerald-500 to-teal-700',
      textColor: 'text-emerald-400',
      traits: ['Limitless Energy', 'Zero Excuses', 'Endurance Surge']
    },
    {
      minLevel: 3,
      name: 'David Goggins',
      category: 'Real-Life Legend',
      title: 'The Hardest Man Alive & Mind Callouser',
      quote: 'You are in danger of living a life so comfortable and soft that you will die without ever realizing your true potential. Stay hard!',
      badge: 'Unbreakable Callous',
      color: 'from-amber-600 to-emerald-700',
      textColor: 'text-amber-400',
      traits: ['Soul Taker Protocol', 'Comfort Zone Obliterator', 'Somatic Fortitude']
    },
    {
      minLevel: 5,
      name: 'Guts (The Berserker)',
      category: 'Anime Titan',
      title: 'The Struggler & Unyielding Iron Will',
      quote: 'Even if we painstakingly piece together something lost, it doesn’t mean things will ever go back to how they were. Keep swinging.',
      badge: 'Iron Berserk Will',
      color: 'from-red-600 via-rose-800 to-zinc-900',
      textColor: 'text-rose-400',
      traits: ['Pain Threshold Zero', 'Superhuman Stamina', 'Fate Defier']
    },
    {
      minLevel: 8,
      name: 'Son Goku (Mastered Ultra Instinct)',
      category: 'Anime God',
      title: 'Apex Martial Transcendent',
      quote: 'My body moves on its own without thinking. Every reflex is pure lightning.',
      badge: 'Autonomous Godhood',
      color: 'from-slate-200 via-sky-400 to-indigo-600',
      textColor: 'text-sky-300',
      traits: ['Effortless Reflexes', 'Limit Break Engine', 'Infinite Vitality']
    }
  ],

  // Dominant Skill / Personality (Craft, Execution, Sigma Presence, Social Will)
  skill: [
    {
      minLevel: 1,
      name: 'Miles Morales (Leap of Faith)',
      category: 'Heroic Prodigy',
      title: 'Unorthodox Craft Pioneer',
      quote: "It's a leap of faith. That's all it is, Miles. A leap of faith.",
      badge: 'Creative Flow',
      color: 'from-purple-500 to-pink-600',
      textColor: 'text-purple-400',
      traits: ['Electric Charisma', 'Rapid Craft Mastery', 'Instinctive Improvisation']
    },
    {
      minLevel: 3,
      name: 'Thomas Shelby',
      category: 'Peak Sigma Icon',
      title: 'Cold-Blooded Master of the Real-World Empire',
      quote: "I have no limitations. Intelligence is a very valuable thing, innit, my friend? And usually it comes far too late.",
      badge: 'Apex Sigma Grindset',
      color: 'from-slate-700 via-zinc-800 to-stone-900',
      textColor: 'text-slate-300',
      traits: ['Unshakable Frame', 'Ice-Cold Composure', 'Ruthless Efficiency']
    },
    {
      minLevel: 5,
      name: 'Patrick Bateman / Sigma Aristocrat',
      category: 'Sigma Cult Icon',
      title: 'Hyper-Disciplined Perfectionist & Daily Routine Machine',
      quote: "There is an idea of a Patrick Bateman, some kind of abstraction. But my skincare, diet, and focus routines are immaculate.",
      badge: 'Monastic Protocol',
      color: 'from-zinc-700 to-neutral-900',
      textColor: 'text-zinc-300',
      traits: ['Flawless Aesthetic', 'Relentless Habit Adherence', 'High-Status Presence']
    },
    {
      minLevel: 8,
      name: 'John Wick',
      category: 'Modern Myth',
      title: 'Baba Yaga: Man of Focus, Commitment, and Sheer Will',
      quote: "People keep asking if I'm back. Yeah, I'm thinking I'm back.",
      badge: 'Apex Executioner',
      color: 'from-amber-500 via-neutral-800 to-black',
      textColor: 'text-amber-400',
      traits: ['Unmatched Discipline', 'Singular Focus', 'Unstoppable Momentum']
    }
  ],

  // Balanced / Trinity (All 3 domains high and within 1 level of each other)
  balanced: [
    {
      minLevel: 1,
      name: 'Peter Parker (Spider-Man)',
      category: 'Marvel Icon',
      title: 'The Determined Balanced Hero',
      quote: 'With great power comes great responsibility. Balancing exams, pushups, and neighborhood saving.',
      badge: 'All-Rounder Potential',
      color: 'from-red-500 via-blue-600 to-indigo-700',
      textColor: 'text-red-400',
      traits: ['Agile Mind-Body', 'High Grit Resilience', 'Witty Adaptability']
    },
    {
      minLevel: 3,
      name: 'Marcus Aurelius',
      category: 'Philosopher Emperor',
      title: 'Stoic Sovereign of Mind, Body & Craft',
      quote: 'At dawn, when you have trouble getting out of bed, tell yourself: I have to go to work as a human being.',
      badge: 'Stoic Triad',
      color: 'from-amber-600 via-yellow-700 to-slate-900',
      textColor: 'text-amber-300',
      traits: ['Total Emotional Sovereignty', 'Physical Rigor', 'Duty-Bound Mastery']
    },
    {
      minLevel: 5,
      name: 'Batman (The Dark Knight)',
      category: 'Ultimate Sigma Hero',
      title: 'Master of Contingencies & Peak Human Potential',
      quote: "It's not who I am underneath, but what I do that defines me. With prep time, impossible is merely a word.",
      badge: 'Peak Human Matrix',
      color: 'from-slate-800 via-blue-950 to-black',
      textColor: 'text-cyan-300',
      traits: ['Tactical Omnipresence', 'Peak Physical Conditioning', 'Master Detective']
    },
    {
      minLevel: 8,
      name: 'Saitama (Broken Limiter)',
      category: 'God-Tier Anime Icon',
      title: 'The One-Punch Ascendant',
      quote: '100 pushups, 100 situps, 100 squats, and a 10km run every single day! I broke my limiter.',
      badge: 'Transcendent Godhead',
      color: 'from-yellow-400 via-red-500 to-slate-950',
      textColor: 'text-yellow-400',
      traits: ['Infinite Multiplier', 'Absurd Strength', 'Pure Zen Freedom']
    }
  ]
};

/**
 * Calculates the exact Persona Archetype based on current user domain levels.
 */
export function calculatePersona({ mentalLevel = 1, healthLevel = 1, skillLevel = 1, overallLevel = 1 }) {
  const maxLevel = Math.max(mentalLevel, healthLevel, skillLevel);
  const minLevel = Math.min(mentalLevel, healthLevel, skillLevel);
  const levelSpread = maxLevel - minLevel;

  // Determine dominant domain classification
  let dominant = 'balanced';
  if (levelSpread >= 2) {
    if (mentalLevel > healthLevel && mentalLevel > skillLevel) dominant = 'mental';
    else if (healthLevel > mentalLevel && healthLevel > skillLevel) dominant = 'health';
    else if (skillLevel > mentalLevel && skillLevel > healthLevel) dominant = 'skill';
  } else if (levelSpread === 1 && (mentalLevel >= 4 || healthLevel >= 4 || skillLevel >= 4)) {
    // If high levels and slightly skewed, pick highest
    if (mentalLevel === maxLevel) dominant = 'mental';
    else if (skillLevel === maxLevel) dominant = 'skill';
    else dominant = 'health';
  }

  const roster = PERSONA_ROSTER[dominant] || PERSONA_ROSTER.balanced;

  // Find highest persona unlocked by maxLevel / overallLevel
  const effectiveLevel = Math.max(overallLevel, maxLevel);
  let currentPersona = roster[0];
  let nextPersona = null;

  for (let i = 0; i < roster.length; i++) {
    if (effectiveLevel >= roster[i].minLevel) {
      currentPersona = roster[i];
      nextPersona = roster[i + 1] || null;
    }
  }

  // Domain breakdown percentage
  const totalLevels = mentalLevel + healthLevel + skillLevel;
  const mentalPct = Math.round((mentalLevel / totalLevels) * 100);
  const healthPct = Math.round((healthLevel / totalLevels) * 100);
  const skillPct = Math.round((skillLevel / totalLevels) * 100);

  return {
    ...currentPersona,
    dominantDomain: dominant,
    effectiveLevel,
    mentalPct,
    healthPct,
    skillPct,
    nextPersona,
    levelsRemainingForNext: nextPersona ? Math.max(1, nextPersona.minLevel - effectiveLevel) : 0
  };
}
