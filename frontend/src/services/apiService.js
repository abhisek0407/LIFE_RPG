// Unified API Client Service
// 100% synchronized with api_contracts_and_schema.json
// Direct HTTP fetch client targeting Node.js + Express backend with seamless offline/development fallback

import { storageService } from './storageService';
import { generateMicrotasks, generateFeelStuckRescue } from './aiGenerator';
import { applyProgression, DOMAINS, getStreakMultiplier } from './rpgEngine';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.token = typeof window !== 'undefined' ? localStorage.getItem('lrpg_jwt_token') : null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('lrpg_jwt_token', token);
    } else {
      localStorage.removeItem('lrpg_jwt_token');
    }
  }

  getToken() {
    return this.token;
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  /**
   * Central HTTP requester:
   * Communicates with Express server. If backend is not started or returns an error,
   * returns null so the calling method gracefully executes local persistence.
   */
  async request(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers
      }
    });

    let data = null;

    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      console.warn(
        `[API] ${options.method || 'GET'} ${endpoint} responded with status ${res.status}`,
        data
      );

      return {
        success: false,
        status: res.status,
        error: data?.error || data?.message || 'Request failed'
      };
    }

    return data;
  } catch (err) {
    console.error(`[API] ${options.method || 'GET'} ${endpoint} failed`, err);

    return {
      success: false,
      error: 'Unable to connect to the server'
    };
  }
}

  /* ==================== 1. AUTHENTICATION ==================== */

  // POST /api/auth/register
async register({
  name,
  username,
  email,
  gender,
  age,
  profilePic = null,
  password
}) {
  const res = await this.request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name,
      username,
      email,
      gender,
      age: Number(age),
      profilePic,
      password
    })
  });

  if (res?.token && res?.user) {
    this.setToken(res.token);

    return {
      success: true,
      user: res.user
    };
  }

  return {
    success: false,
    error: res?.error || 'Registration failed'
  };
}

// POST /api/auth/login
async login(email, password) {
  const res = await this.request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password
    })
  });

  if (res?.token && res?.user) {
    this.setToken(res.token);

    return {
      success: true,
      user: res.user
    };
  }

  return {
    success: false,
    error: res?.error || 'Invalid email or password'
  };
}
// POST /api/auth/forgot-password
async forgotPassword(email) {
  const res = await this.request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({
      email: email.trim().toLowerCase()
    })
  });

  if (res?.message) {
    return {
      success: true,
      message: res.message,
      resetToken: res.resetToken || null
    };
  }

  return {
    success: false,
    error: res?.error || 'Unable to process password reset request'
  };
}
// POST /api/auth/reset-password
async resetPassword(token, password) {
  const res = await this.request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({
      token,
      password
    })
  });

  if (res?.token && res?.user) {
    this.setToken(res.token);

    return {
      success: true,
      message: res.message || 'Password reset successfully',
      user: res.user
    };
  }

  return {
    success: false,
    error: res?.error || 'Unable to reset password'
  };
}
// POST /api/auth/logout
async logout() {
  try {
    await this.request('/auth/logout', {
      method: 'POST'
    });
  } finally {
    // Always remove the frontend JWT
    this.setToken(null);

    // Clear local fallback data
    try {
      localStorage.removeItem('lrpg_user');
      localStorage.removeItem('lrpg_quests');
      localStorage.removeItem('lrpg_dailies');
    } catch (e) {
      console.warn('Unable to clear local storage data');
    }
  }

  return {
    success: true
  };
}

  // GET /api/auth/me
  async getCurrentUser() {
    const res = await this.request('/auth/me');
    if (res?.user) {
      return res.user;
    }
    return storageService.getUser();
  }

  // PATCH /api/auth/profile
  async updateUserProfile(updates) {
    const res = await this.request('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });

    if (res?.user) {
      return res.user;
    }

    const current = storageService.getUser();
    const merged = { ...current, ...updates };
    storageService.saveUser(merged);
    return merged;
  }

  /* ==================== 2. QUESTS & MICROTASKS ==================== */

  // GET /api/quests?status=active
  async getQuests(status = 'active') {
    const res = await this.request(`/quests?status=${status}`);
    if (res?.quests) {
      return res.quests;
    }
    return storageService.getQuests();
  }

  // POST /api/quests
  async createQuest(questData) {
    const res = await this.request('/quests', {
      method: 'POST',
      body: JSON.stringify(questData)
    });

    if (res?.quest) {
      return res.quest;
    }

    // Local fallback
    const quests = storageService.getQuests();
    const updated = [questData, ...quests];
    storageService.saveQuests(updated);
    return questData;
  }

  // PATCH /api/quests/:questId/microtasks/:microtaskId/complete
  async completeMicrotask({ questId, microtaskId, domain, xp, gold, user, isQuestFinished }) {
    const res = await this.request(`/quests/${questId}/microtasks/${microtaskId}/complete`, {
      method: 'PATCH'
    });

    if (res?.domainState) {
      return res;
    }

    // Server offline -> Run RPG leveling formula on client
    const prog = applyProgression({
      userData: user,
      domainKey: domain,
      xpAmount: xp,
      goldAmount: gold
    });

    // Update local quests
    const quests = storageService.getQuests();
    const updatedQuests = quests.map((q) => {
      if (q.id !== questId) return q;
      const updatedTasks = q.microtasks.map((m) =>
        m.id === microtaskId ? { ...m, isCompleted: true, completedAt: new Date().toISOString() } : m
      );
      return {
        ...q,
        microtasks: updatedTasks,
        earnedXp: (q.earnedXp || 0) + xp,
        earnedGold: (q.earnedGold || 0) + gold,
        status: isQuestFinished ? 'completed' : 'active'
      };
    });
    storageService.saveQuests(updatedQuests);
    storageService.saveUser(prog.updatedUser);

    return {
      isCompleted: true,
      xpAwarded: prog.adjustedXp,
      bonusXp: prog.bonusXp,
      goldAwarded: prog.goldGained,
      streakMultiplier: getStreakMultiplier(user.streak?.currentStreak || 1),
      domain,
      domainState: prog.updatedUser.domains[domain],
      updatedUser: prog.updatedUser,
      domainLeveledUp: prog.domainLeveledUp,
      overallLeveledUp: prog.overallLeveledUp,
      newDomainLevel: prog.newDomainLevel,
      newOverallLevel: prog.newOverallLevel,
      questCompleted: isQuestFinished
    };
  }

  // DELETE /api/quests/:id
  async deleteQuest(questId) {
    const res = await this.request(`/quests/${questId}`, { method: 'DELETE' });
    const quests = storageService.getQuests().filter((q) => q.id !== questId);
    storageService.saveQuests(quests);
    return res || { success: true };
  }

  /* ==================== 3. AI SERVICES ==================== */

  // POST /api/ai/decompose
  async decomposeTask({ task, domain, difficulty, motivationLevel }) {
    const res = await this.request('/ai/decompose', {
      method: 'POST',
      body: JSON.stringify({ task, domain, difficulty, motivationLevel })
    });

    if (res?.microtasks) {
      return res;
    }

    // Local AI decomposition engine fallback
    return generateMicrotasks({ task, domain, difficulty, motivationLevel });
  }

  // POST /api/ai/feel-stuck
  async feelStuckRescue(feelingContext = 'paralyzed') {
    const res = await this.request('/ai/feel-stuck', {
      method: 'POST',
      body: JSON.stringify({ feelingContext })
    });

    if (res?.groundingMicrotasks) {
      return res;
    }

    // Local AI grounding generator fallback
    return generateFeelStuckRescue();
  }

  /* ==================== 4. DAILY HABITS ==================== */

  // GET /api/daily-quests
  async getDailies() {
    const res = await this.request('/daily-quests');
    if (res?.dailyQuests) {
      return res.dailyQuests;
    }
    return storageService.getDailies();
  }

  // POST /api/daily-quests
  async createDaily(dailyData) {
    const res = await this.request('/daily-quests', {
      method: 'POST',
      body: JSON.stringify(dailyData)
    });

    if (res?.dailyQuest) {
      return res.dailyQuest;
    }

    const dailies = storageService.getDailies();
    const updated = [...dailies, dailyData];
    storageService.saveDailies(updated);
    return dailyData;
  }

  // PATCH /api/daily-quests/:id/complete
  async completeDaily(dailyId, user) {
    const res = await this.request(`/daily-quests/${dailyId}/complete`, {
      method: 'PATCH'
    });

    if (res?.xpAwarded) {
      return res;
    }

    // Fallback
    const dailies = storageService.getDailies();
    const target = dailies.find((d) => d.id === dailyId);
    if (!target) return null;

    target.isCompletedToday = true;
    target.streakDays = (target.streakDays || 0) + 1;
    storageService.saveDailies(dailies);

    const prog = applyProgression({
      userData: user,
      domainKey: target.domain,
      xpAmount: target.xpReward || 25,
      goldAmount: target.goldReward || 10
    });
    storageService.saveUser(prog.updatedUser);

    return {
      success: true,
      xpAwarded: prog.adjustedXp,
      bonusXp: prog.bonusXp,
      goldAwarded: prog.goldGained,
      updatedUser: prog.updatedUser,
      domainLeveledUp: prog.domainLeveledUp,
      overallLeveledUp: prog.overallLeveledUp
    };
  }

  /* ==================== 5. STORE & INVENTORY ==================== */

  // GET /api/store/items
  async getStoreItems() {
    const res = await this.request('/store/items');
    if (res?.items) {
      return res.items;
    }
    return storageService.getStoreItems();
  }

  // POST /api/store/buy
  async buyStoreItem(item, user) {
    const res = await this.request('/store/buy', {
      method: 'POST',
      body: JSON.stringify({ itemId: item.id })
    });

    if (res?.success) {
      return res;
    }

    // Local fallback
    const currentGold = user.character?.gold || 0;
    if (currentGold < item.costGold) return { success: false, message: 'Insufficient gold' };

    const updatedUser = JSON.parse(JSON.stringify(user));
    updatedUser.character.gold = currentGold - item.costGold;

    const existingIndex = updatedUser.inventory.findIndex((inv) => inv.itemId === item.id);
    if (existingIndex >= 0) {
      updatedUser.inventory[existingIndex].quantity = (updatedUser.inventory[existingIndex].quantity || 1) + 1;
    } else {
      updatedUser.inventory.push({
        itemId: item.id,
        name: item.name,
        type: item.type,
        quantity: 1,
        equipped: false
      });
    }

    if (item.type === 'freeze') {
      updatedUser.streak.streakFreezesAvailable = (updatedUser.streak.streakFreezesAvailable || 0) + 1;
    }

    storageService.saveUser(updatedUser);

    return {
      success: true,
      remainingGold: updatedUser.character.gold,
      updatedUser
    };
  }

  /* ==================== 6. STREAKS & ACTIVITY LOGS ==================== */

  // GET /api/streaks
  async getStreakData() {
    const res = await this.request('/streaks');
    if (res?.currentStreak !== undefined) {
      return res;
    }

    const user = storageService.getUser();
    return {
      currentStreak: user.streak?.currentStreak || 1,
      longestStreak: user.streak?.longestStreak || 1,
      multiplier: getStreakMultiplier(user.streak?.currentStreak || 1),
      freezesAvailable: user.streak?.streakFreezesAvailable || 1
    };
  }

  // POST /api/streaks/checkin
  async claimStreakCheckin(user) {
    const res = await this.request('/streaks/checkin', { method: 'POST' });
    if (res?.success) {
      return res;
    }

    // Local fallback
    const updatedUser = JSON.parse(JSON.stringify(user));
    updatedUser.streak.currentStreak = (updatedUser.streak.currentStreak || 0) + 1;
    if (updatedUser.streak.currentStreak > updatedUser.streak.longestStreak) {
      updatedUser.streak.longestStreak = updatedUser.streak.currentStreak;
    }
    updatedUser.character.gold = (updatedUser.character.gold || 0) + 10;
    storageService.saveUser(updatedUser);

    return {
      success: true,
      currentStreak: updatedUser.streak.currentStreak,
      goldAwarded: 10,
      xpAwarded: 20,
      bonusXp: 5,
      updatedUser
    };
  }

  // POST /api/activity-logs (Audit trail)
  async logActivity(actionType, domain, xpGained, goldGained, metadata = {}) {
    return await this.request('/activity-logs', {
      method: 'POST',
      body: JSON.stringify({ actionType, domain, xpGained, goldGained, metadata })
    });
  }
}

export const apiService = new ApiService();
