import DailyQuest from "../models/dailyQuestSchema.js";
import { awardXp, awardGold, updateStreak, logActivity } from "../services/progressionService.js";

// Helper: "YYYY-MM-DD" for today / yesterday
function todayStr() {
    return new Date().toISOString().slice(0, 10);
}
function yesterdayStr() {
    return new Date(Date.now() - 86400000).toISOString().slice(0, 10);
}

// Resets isCompletedToday on a new day, and breaks streakDays back to 0
// if the user missed a day entirely (didn't complete yesterday either).
function applyDailyReset(daily) {
    const today = todayStr();
    if (daily.lastCompletedDate === today) {
        return false; // already up to date, nothing changed
    }

    daily.isCompletedToday = false;

    // If the last completion wasn't yesterday (or ever), the streak is broken
    if (daily.lastCompletedDate !== yesterdayStr()) {
        daily.streakDays = 0;
    }

    return true; // changed, caller should save
}

// ── GET /api/daily-quests ────────────────────────────────────
export async function getDailyQuests(req, res) {
    try {
        const dailies = await DailyQuest.find({ userId: req.user._id }).sort({ createdAt: -1 });

        // Auto-reset any dailies that have rolled over into a new day
        const toSave = [];
        for (const daily of dailies) {
            if (applyDailyReset(daily)) {
                toSave.push(daily.save());
            }
        }
        if (toSave.length > 0) {
            await Promise.all(toSave);
        }

        return res.status(200).json({ dailyQuests: dailies });
    } catch (err) {
        console.error("getDailyQuests error:", err);
        return res.status(500).json({ error: "Failed to fetch daily quests" });
    }
}

// ── POST /api/daily-quests ───────────────────────────────────
export async function createDailyQuest(req, res) {
    try {
        const { title, description, domain, xpReward, goldReward } = req.body;

        if (!title?.trim()) {
            return res.status(400).json({ error: "Title is required" });
        }
        if (!["health", "mental", "skill"].includes(domain)) {
            return res.status(400).json({ error: "Domain must be health, mental, or skill" });
        }
        if (xpReward !== undefined && (typeof xpReward !== "number" || xpReward <= 0)) {
            return res.status(400).json({ error: "xpReward must be a positive number" });
        }
        if (goldReward !== undefined && (typeof goldReward !== "number" || goldReward < 0)) {
            return res.status(400).json({ error: "goldReward must be a non-negative number" });
        }

        const daily = await DailyQuest.create({
            userId: req.user._id,
            title: title.trim(),
            description: description?.trim() || "",
            domain,
            xpReward: xpReward ?? 25,
            goldReward: goldReward ?? 10,
        });

        return res.status(201).json({ dailyQuest: daily });
    } catch (err) {
        console.error("createDailyQuest error:", err);
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        return res.status(500).json({ error: "Failed to create daily quest" });
    }
}

// ── PATCH /api/daily-quests/:id/complete ─────────────────────
export async function completeDailyQuest(req, res) {
    try {
        const daily = await DailyQuest.findOne({ _id: req.params.id, userId: req.user._id });
        if (!daily) {
            return res.status(404).json({ error: "Daily quest not found" });
        }

        // Make sure we're evaluating against today, not stale state
        applyDailyReset(daily);

        if (daily.isCompletedToday) {
            return res.status(400).json({ error: "Daily quest already completed today" });
        }

        const today = todayStr();
        daily.isCompletedToday = true;
        daily.streakDays += 1;
        daily.lastCompletedDate = today;

        // ── Award progression to the user (streak-multiplied) ──
        const user = req.user;
        const streakResult = updateStreak(user);
        const xpResult = await awardXp(user, daily.domain, daily.xpReward);
        awardGold(user, daily.goldReward);

        await Promise.all([daily.save(), user.save()]);

        await logActivity({
            userId: user._id,
            actionType: "streak_checkin",
            domain: daily.domain,
            xpGained: xpResult.xpAwarded,
            goldGained: daily.goldReward,
            metadata: { dailyQuestId: daily._id, title: daily.title, dailyStreak: daily.streakDays },
        });

        if (xpResult.leveledUp) {
            await logActivity({
                userId: user._id,
                actionType: "level_up",
                domain: daily.domain,
                metadata: {
                    domain: daily.domain,
                    newDomainLevel: xpResult.newDomainLevel,
                    newOverallLevel: xpResult.newOverallLevel,
                    levelsGained: xpResult.levelsGained,
                },
            });
        }

        return res.status(200).json({
            dailyQuest: daily,
            progression: xpResult,
            streak: {
                currentStreak: user.streak.currentStreak,
                longestStreak: user.streak.longestStreak,
                changed: streakResult.changed,
            },
            user,
        });
    } catch (err) {
        console.error("completeDailyQuest error:", err);
        return res.status(500).json({ error: "Failed to complete daily quest" });
    }
}

// ── DELETE /api/daily-quests/:id ─────────────────────────────
export async function deleteDailyQuest(req, res) {
    try {
        const daily = await DailyQuest.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!daily) {
            return res.status(404).json({ error: "Daily quest not found" });
        }
        return res.status(200).json({ message: "Daily quest deleted successfully" });
    } catch (err) {
        console.error("deleteDailyQuest error:", err);
        return res.status(500).json({ error: "Failed to delete daily quest" });
    }
}