import User from "../models/userSchema.js";
import ActivityLog from "../models/activityLogSchema.js";

// ── XP / Level-up engine ─────────────────────────────────────
// Applies streak multiplier, handles multi-level-ups in one call,
// and returns a summary so the controller can log + respond.
export async function awardXp(user, domain, baseXp) {
    const multiplier = User.streakMultiplier(user.streak.currentStreak);
    const xpAwarded = Math.round(baseXp * multiplier);

    const domainState = user.domains[domain];
    domainState.currentXp += xpAwarded;

    let leveledUp = false;
    let levelsGained = 0;

    // Handle possible multiple level-ups from one big XP hit
    while (domainState.currentXp >= domainState.xpToNextLevel) {
        domainState.currentXp -= domainState.xpToNextLevel;
        domainState.level += 1;
        domainState.xpToNextLevel = User.xpRequiredForLevel(domainState.level + 1);
        leveledUp = true;
        levelsGained += 1;
    }

    user.character.totalXpEarned += xpAwarded;

    // overallLevel = sum of the three domain levels (simple, transparent metric)
    user.character.overallLevel =
        user.domains.health.level + user.domains.mental.level + user.domains.skill.level;

    return {
        baseXp,
        multiplier,
        xpAwarded,
        leveledUp,
        levelsGained,
        newDomainLevel: domainState.level,
        newOverallLevel: user.character.overallLevel,
    };
}

// ── Gold ──────────────────────────────────────────────────────
export function awardGold(user, amount) {
    user.character.gold += amount;
    return amount;
}

// ── Streak check (call on any activity completion) ────────────
// Increments streak once per calendar day, uses a freeze if a day
// was missed and one is available, otherwise resets to 1.
export function updateStreak(user) {
    const today = new Date().toISOString().slice(0, 10);
    const lastDate = user.streak.lastActivityDate
        ? new Date(user.streak.lastActivityDate).toISOString().slice(0, 10)
        : null;

    if (lastDate === today) {
        return { changed: false }; // already counted today
    }

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    if (lastDate === yesterday) {
        user.streak.currentStreak += 1;
    } else if (lastDate !== null && user.streak.streakFreezesAvailable > 0) {
        // missed a day but has a freeze — preserve streak, consume freeze
        user.streak.streakFreezesAvailable -= 1;
        user.streak.currentStreak += 1;
    } else if (lastDate !== null) {
        user.streak.currentStreak = 1; // streak broken
    }
    // lastDate === null (first ever activity) → currentStreak stays as-is (1)

    user.streak.longestStreak = Math.max(user.streak.longestStreak, user.streak.currentStreak);
    user.streak.lastActivityDate = new Date();

    return { changed: true, currentStreak: user.streak.currentStreak };
}

// ── Activity log helper ─────────────────────────────────────
export async function logActivity({ userId, actionType, domain, xpGained, goldGained, metadata }) {
    return ActivityLog.create({
        userId,
        actionType,
        domain: domain || "global",
        xpGained: xpGained || 0,
        goldGained: goldGained || 0,
        metadata: metadata || {},
    });
}