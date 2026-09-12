// Storage & API Client Service
// Implements client persistence and API abstractions matching api_contracts_and_schema.json

const STORAGE_KEY_USER        = 'lrpg_user_profile';
const STORAGE_KEY_QUESTS      = 'lrpg_active_quests';
const STORAGE_KEY_DAILIES     = 'lrpg_daily_quests';
const STORAGE_KEY_STORE       = 'lrpg_store_items';
const STORAGE_KEY_STREAK      = 'lrpg_streak_log';
const STORAGE_KEY_DAILY_RESET = 'lrpg_daily_reset_date'; // tracks last midnight reset

// Returns a stable "YYYY-MM-DD" string for today in local time
const todayDateString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Initial default seed user
const DEFAULT_USER = {
  id: 'usr_default_hero_01',
  username: 'Alex V.',
  character: {
    title: 'Novice Seeker',
    avatar: 'cyber_paladin',
    overallLevel: 1,
    totalXpEarned: 0,
    gold: 50,
    gems: 5
  },
  domains: {
    mental: {
      level: 1,
      currentXp: 0,
      xpToNextLevel: 100
    },
    health: {
      level: 1,
      currentXp: 0,
      xpToNextLevel: 100
    },
    skill: {
      level: 1,
      currentXp: 0,
      xpToNextLevel: 100
    }
  },
  streak: {
    currentStreak: 5,
    longestStreak: 12,
    lastActivityDate: new Date().toISOString(),
    streakFreezesAvailable: 1
  },
  inventory: [
    { itemId: 'potion_focus', name: 'Elixir of Deep Mind', type: 'potion', quantity: 1, equipped: false }
  ]
};

// Initial default sample quests to demonstrate decomposition immediately
const DEFAULT_QUESTS = [
  {
    id: 'q_seed_1',
    title: 'Master Modern Asynchronous JavaScript & Event Loop',
    domain: 'skill',
    difficulty: 'medium',
    motivationLevel: 'medium',
    status: 'active',
    totalXp: 120,
    totalGold: 35,
    earnedXp: 30,
    earnedGold: 10,
    createdAt: new Date().toISOString(),
    microtasks: [
      { id: 'mt_seed_1', title: 'Open Node.js REPL and inspect microtask vs macrotask execution order', order: 1, xpReward: 30, goldReward: 10, isCompleted: true, completedAt: new Date().toISOString() },
      { id: 'mt_seed_2', title: 'Code custom Promise.allSettled polyfill from scratch', order: 2, xpReward: 30, goldReward: 10, isCompleted: false, completedAt: null },
      { id: 'mt_seed_3', title: 'Trace asynchronous error handling in Express middleware chain', order: 3, xpReward: 30, goldReward: 5, isCompleted: false, completedAt: null },
      { id: 'mt_seed_4', title: 'Summarize async/await performance & memory implications', order: 4, xpReward: 30, goldReward: 10, isCompleted: false, completedAt: null }
    ]
  },
  {
    id: 'q_seed_2',
    title: 'Post-Work 30-Minute Spine & Core Mobility Reset',
    domain: 'health',
    difficulty: 'easy',
    motivationLevel: 'low',
    status: 'active',
    totalXp: 50,
    totalGold: 15,
    earnedXp: 12,
    earnedGold: 4,
    createdAt: new Date().toISOString(),
    microtasks: [
      { id: 'mt_seed_h1', title: 'Lay flat on yoga mat and take 5 deep diaphragmatic breaths', order: 1, xpReward: 12, goldReward: 4, isCompleted: true, completedAt: new Date().toISOString() },
      { id: 'mt_seed_h2', title: 'Do 10 Cat-Cow fluid spinal flexions', order: 2, xpReward: 12, goldReward: 4, isCompleted: false, completedAt: null },
      { id: 'mt_seed_h3', title: 'Hold Child’s Pose with side lat stretch for 90 seconds', order: 3, xpReward: 12, goldReward: 3, isCompleted: false, completedAt: null },
      { id: 'mt_seed_h4', title: 'Drink 400ml cold electrolyte water and stand tall', order: 4, xpReward: 14, goldReward: 4, isCompleted: false, completedAt: null }
    ]
  }
];

// Initial default daily habits
const DEFAULT_DAILIES = [
  { id: 'd1', title: '500ml Morning Hydration + Sunlight',          domain: 'health',  xpReward: 25, goldReward: 10, isCompletedToday: false, streakDays: 5, createdDate: todayDateString() },
  { id: 'd2', title: 'Read 15 Pages of Non-Fiction / Research',     domain: 'mental',  xpReward: 30, goldReward: 10, isCompletedToday: false, streakDays: 3, createdDate: todayDateString() },
  { id: 'd3', title: 'Write Clean Code / Commit 1 Refactor',        domain: 'skill',   xpReward: 35, goldReward: 15, isCompletedToday: false, streakDays: 7, createdDate: todayDateString() },
  { id: 'd4', title: '5-Minute Posture Reset & Neck Release',       domain: 'health',  xpReward: 20, goldReward: 8,  isCompletedToday: false, streakDays: 2, createdDate: todayDateString() }
];

// Store Catalog
const DEFAULT_STORE_ITEMS = [
  {
    id: 'potion_focus',
    name: 'Elixir of Deep Mind',
    description: 'Ancient brew of nootropic botanicals. Imbues mental clarity.',
    type: 'potion',
    costGold: 60,
    icon: 'BrainCircuit',
    rarity: 'rare',
    effectText: '+25% Mental XP for 2 Quests'
  },
  {
    id: 'phoenix_feather',
    name: 'Phoenix Feather (Streak Freeze)',
    description: 'Mythical talisman that shields your streak fire if life gets chaotic.',
    type: 'freeze',
    costGold: 120,
    icon: 'Flame',
    rarity: 'epic',
    effectText: 'Saves 1 missed day of streak'
  },
  {
    id: 'tome_architect',
    name: 'Tome of the Grand Architect',
    description: 'Grants the title "Master Architect" and legendary golden aura badge.',
    type: 'badge',
    costGold: 250,
    icon: 'Award',
    rarity: 'legendary',
    effectText: 'Cosmetic title & Profile Badge'
  },
  {
    id: 'vitality_elixir',
    name: 'Titan’s Vitality Tonic',
    description: 'A surge of pure cellular energy for health and physical quests.',
    type: 'potion',
    costGold: 60,
    icon: 'Heart',
    rarity: 'rare',
    effectText: '+25% Health XP for 2 Quests'
  },
  {
    id: 'cyber_avatar_frame',
    name: 'Cyberpunk Neon Crest',
    description: 'Luminescent cyberpunk avatar border with reactive sound effect.',
    type: 'theme',
    costGold: 180,
    icon: 'Sparkles',
    rarity: 'epic',
    effectText: 'Exclusive Avatar Border'
  }
];

class StorageService {
  getUser() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_USER);
      return data ? JSON.parse(data) : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  }

  saveUser(user) {
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to persist user profile', e);
    }
  }

  getQuests() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_QUESTS);
      return data ? JSON.parse(data) : DEFAULT_QUESTS;
    } catch {
      return DEFAULT_QUESTS;
    }
  }

  saveQuests(quests) {
    try {
      localStorage.setItem(STORAGE_KEY_QUESTS, JSON.stringify(quests));
    } catch (e) {
      console.error('Failed to persist quests', e);
    }
  }

  getDailies() {
    try {
      const today = todayDateString();
      const lastReset = localStorage.getItem(STORAGE_KEY_DAILY_RESET);
      const raw = localStorage.getItem(STORAGE_KEY_DAILIES);
      let dailies = raw ? JSON.parse(raw) : DEFAULT_DAILIES;

      // Midnight crossed → reset every daily's completion flag for the new day
      if (lastReset !== today) {
        dailies = dailies.map((d) => ({ ...d, isCompletedToday: false }));
        localStorage.setItem(STORAGE_KEY_DAILIES, JSON.stringify(dailies));
        localStorage.setItem(STORAGE_KEY_DAILY_RESET, today);
      }

      // Only surface dailies that were created today
      return dailies.filter((d) => !d.createdDate || d.createdDate === today);
    } catch {
      return DEFAULT_DAILIES;
    }
  }

  saveDailies(dailies) {
    try {
      localStorage.setItem(STORAGE_KEY_DAILIES, JSON.stringify(dailies));
    } catch (e) {
      console.error('Failed to persist dailies', e);
    }
  }

  getStoreItems() {
    return DEFAULT_STORE_ITEMS;
  }

  // Reset demo state if needed
  resetToDemo() {
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_QUESTS);
    localStorage.removeItem(STORAGE_KEY_DAILIES);
    return {
      user: DEFAULT_USER,
      quests: DEFAULT_QUESTS,
      dailies: DEFAULT_DAILIES
    };
  }
}

export const storageService = new StorageService();
