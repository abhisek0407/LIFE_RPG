// RPG Progression Engine
// Non-linear leveling, domain math, streak multipliers, and rank titles

export const DOMAINS = {
  mental: {
    id: 'mental',
    name: 'Mental XP',
    subtitle: 'Intellect & Focus',
    color: '#06B6D4',
    glowClass: 'shadow-glow-mental',
    borderClass: 'border-cyan-500/40',
    bgClass: 'bg-cyan-500/10',
    textClass: 'text-cyan-400',
    icon: 'Brain',
    description: 'Brain is filled by amount of intellectual tasks, studying, deep work, and mindfulness done.'
  },
  health: {
    id: 'health',
    name: 'Health XP',
    subtitle: 'Vitality & Body',
    color: '#10B981',
    glowClass: 'shadow-glow-health',
    borderClass: 'border-emerald-500/40',
    bgClass: 'bg-emerald-500/10',
    textClass: 'text-emerald-400',
    icon: 'HeartPulse',
    description: 'Increases health constitution, physical strength, hydration, nutrition, and body endurance.'
  },
  skill: {
    id: 'skill',
    name: 'Skill / Personality XP',
    subtitle: 'Craft & Charisma',
    color: '#8B5CF6',
    glowClass: 'shadow-glow-skill',
    borderClass: 'border-purple-500/40',
    bgClass: 'bg-purple-500/10',
    textClass: 'text-purple-400',
    icon: 'Sparkles',
    description: 'Sharpens self-care habits, programming mastery, social confidence, and creative craftsmanship.'
  }
};

export const DIFFICULTY_PRESETS = {
  easy: { id: 'easy', label: 'Easy', xp: 50, gold: 15, tag: '🌱 Breeze' },
  medium: { id: 'medium', label: 'Medium', xp: 120, gold: 35, tag: '⚔️ Standard' },
  hard: { id: 'hard', label: 'Hard', xp: 300, gold: 80, tag: '🐉 Boss' }
};

export const MOTIVATION_PRESETS = {
  low: {
    id: 'low',
    label: 'Low / Paralyzed',
    subtext: '5–6 micro-steps with almost zero friction',
    emoji: '🪫',
    multiplier: 1.15 // Bonus resilience multiplier!
  },
  medium: {
    id: 'medium',
    label: 'Medium / Steady',
    subtext: '3–4 pragmatic, clear milestone steps',
    emoji: '⚡',
    multiplier: 1.0
  },
  high: {
    id: 'high',
    label: 'High / Energized',
    subtext: '2–3 high-tempo blitz steps',
    emoji: '🔥',
    multiplier: 1.05
  }
};

/**
 * Non-linear leveling curve:
 * XP required for level L = floor(100 * L^1.5)
 */
export function getXpRequiredForLevel(level) {
  return Math.floor(100 * Math.pow(Math.max(1, level), 1.5));
}

/**
 * Calculates current streak bonus multiplier.
 * 1 day = 1.05x, 5 days = 1.25x, capped at 1.50x (10+ days).
 */
export function getStreakMultiplier(streakDays) {
  const days = Math.max(0, streakDays || 1);
  return Number((1.0 + Math.min(days * 0.05, 0.50)).toFixed(2));
}

/**
 * Get dynamic player title based on overall level.
 */
export function getPlayerTitle(overallLevel) {
  if (overallLevel >= 15) return 'Transcendent Archon';
  if (overallLevel >= 12) return 'Legendary Ascendant';
  if (overallLevel >= 9) return 'Grand Sovereign of Focus';
  if (overallLevel >= 6) return 'Arcane Mind-Weaver';
  if (overallLevel >= 4) return 'Adept Pathfinder';
  if (overallLevel >= 2) return 'Apprentice of Will';
  return 'Novice Seeker';
}

export function getEffectiveOverallLevel(userData) {
  if (!userData?.domains) {
    return Math.max(1, Number(userData?.character?.overallLevel) || 1);
  }

  const domains = userData.domains;
  const domainLevels = [
    Number(domains.mental?.level) || 1,
    Number(domains.health?.level) || 1,
    Number(domains.skill?.level) || 1,
  ];

  const derivedLevel = Math.max(1, Math.floor(domainLevels.reduce((sum, level) => sum + level, 0) / domainLevels.length));
  return Number.isFinite(derivedLevel) ? derivedLevel : Math.max(1, Number(userData?.character?.overallLevel) || 1);
}

/**
 * Processes an XP gain for a domain and user stats.
 * Handles level-ups with carry-over XP.
 */
export function applyProgression({ userData, domainKey, xpAmount, goldAmount }) {
  const multiplier = getStreakMultiplier(userData.streak?.currentStreak || 1);
  const adjustedXp = Math.round(xpAmount * multiplier);
  const adjustedGold = Math.round(goldAmount);

  // Clone user data
  const updated = JSON.parse(JSON.stringify(userData));

  // Update domain stats
  const domain = updated.domains[domainKey];
  domain.currentXp += adjustedXp;

  let domainLeveledUp = false;
  let newDomainLevel = domain.level;

  let needed = getXpRequiredForLevel(newDomainLevel);
  while (domain.currentXp >= needed) {
    domain.currentXp -= needed;
    newDomainLevel += 1;
    domainLeveledUp = true;
    needed = getXpRequiredForLevel(newDomainLevel);
  }
  domain.level = newDomainLevel;
  domain.xpToNextLevel = needed;

  const newOverallLevel = getEffectiveOverallLevel(updated);
  const overallLeveledUp = newOverallLevel > (updated.character.overallLevel || 1);

  updated.character.overallLevel = newOverallLevel;
  updated.character.title = getPlayerTitle(newOverallLevel);
  updated.character.totalXpEarned = (updated.character.totalXpEarned || 0) + adjustedXp;
  updated.character.gold = (updated.character.gold || 0) + adjustedGold;

  return {
    updatedUser: updated,
    rawXp: xpAmount,
    adjustedXp,
    bonusXp: adjustedXp - xpAmount,
    goldGained: adjustedGold,
    domainLeveledUp,
    overallLeveledUp,
    newDomainLevel,
    newOverallLevel,
    domainKey
  };
}
