import Quest from "../models/questSchema.js";
import { awardXp, awardGold, updateStreak, logActivity } from "../services/progressionService.js";

// ── GET /api/quests?status=active ────────────────────────────
export async function getQuests(req, res) {
    try {
        const filter = { userId: req.user._id };

        // Optional ?status=active|completed|archived
        if (req.query.status) {
            if (!["active", "completed", "archived"].includes(req.query.status)) {
                return res.status(400).json({ error: "Invalid status filter" });
            }
            filter.status = req.query.status;
        }

        const quests = await Quest.find(filter).sort({ createdAt: -1 });
        return res.status(200).json({ quests });
    } catch (err) {
        console.error("getQuests error:", err);
        return res.status(500).json({ error: "Failed to fetch quests" });
    }
}

// ── GET /api/quests/:id ──────────────────────────────────────
export async function getQuestById(req, res) {
    try {
        const quest = await Quest.findOne({
            _id: req.params.id,
            userId: req.user._id, // ownership check — 404 if not yours
        });

        if (!quest) {
            return res.status(404).json({ error: "Quest not found" });
        }

        return res.status(200).json({ quest });
    } catch (err) {
        console.error("getQuestById error:", err);
        return res.status(500).json({ error: "Failed to fetch quest" });
    }
}

// ── POST /api/quests ─────────────────────────────────────────
export async function createQuest(req, res) {
    try {
        const { title, domain, difficulty, motivationLevel, microtasks } = req.body;

        // ── Validation ──
        if (!title?.trim()) {
            return res.status(400).json({ error: "Title is required" });
        }
        if (!["health", "mental", "skill"].includes(domain)) {
            return res.status(400).json({ error: "Domain must be health, mental, or skill" });
        }
        if (!microtasks || !Array.isArray(microtasks) || microtasks.length === 0) {
            return res.status(400).json({ error: "At least one microtask is required" });
        }

        for (const [i, mt] of microtasks.entries()) {
            if (!mt.title?.trim()) {
                return res.status(400).json({ error: `Microtask #${i + 1} is missing a title` });
            }
            if (typeof mt.xpReward !== "number" || mt.xpReward <= 0) {
                return res.status(400).json({ error: `Microtask #${i + 1} needs a valid xpReward` });
            }
            if (typeof mt.goldReward !== "number" || mt.goldReward < 0) {
                return res.status(400).json({ error: `Microtask #${i + 1} needs a valid goldReward` });
            }
        }

        // ── Compute totals from microtasks (never trust client totals) ──
        const totalXp = microtasks.reduce((sum, mt) => sum + mt.xpReward, 0);
        const totalGold = microtasks.reduce((sum, mt) => sum + mt.goldReward, 0);

        const quest = await Quest.create({
            userId: req.user._id,
            title: title.trim(),
            domain,
            difficulty: difficulty || "medium",
            motivationLevel: motivationLevel || "medium",
            totalXp,
            totalGold,
            microtasks: microtasks.map((mt, i) => ({
                title: mt.title.trim(),
                order: mt.order ?? i + 1,          // auto-assign order if missing
                xpReward: mt.xpReward,
                goldReward: mt.goldReward,
            })),
        });

        return res.status(201).json({ quest });
    } catch (err) {
        console.error("createQuest error:", err);
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        return res.status(500).json({ error: "Failed to create quest" });
    }
}

// ── PATCH /api/quests/:id ────────────────────────────────────
export async function updateQuest(req, res) {
    try {
        const quest = await Quest.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!quest) {
            return res.status(404).json({ error: "Quest not found" });
        }

        // Only these fields are editable on the quest itself
        const { title, difficulty, motivationLevel, status } = req.body;

        if (title !== undefined) {
            if (!title.trim()) return res.status(400).json({ error: "Title cannot be empty" });
            quest.title = title.trim();
        }
        if (difficulty !== undefined) {
            if (!["easy", "medium", "hard"].includes(difficulty)) {
                return res.status(400).json({ error: "Invalid difficulty" });
            }
            quest.difficulty = difficulty;
        }
        if (motivationLevel !== undefined) {
            if (!["low", "medium", "high"].includes(motivationLevel)) {
                return res.status(400).json({ error: "Invalid motivationLevel" });
            }
            quest.motivationLevel = motivationLevel;
        }
        if (status !== undefined) {
            if (!["active", "completed", "archived"].includes(status)) {
                return res.status(400).json({ error: "Invalid status" });
            }
            quest.status = status;
            if (status === "completed") quest.completedAt = new Date();
        }

        await quest.save();
        return res.status(200).json({ quest });
    } catch (err) {
        console.error("updateQuest error:", err);
        return res.status(500).json({ error: "Failed to update quest" });
    }
}

// ── DELETE /api/quests/:id ───────────────────────────────────
export async function deleteQuest(req, res) {
    try {
        const quest = await Quest.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!quest) {
            return res.status(404).json({ error: "Quest not found" });
        }

        return res.status(200).json({ message: "Quest deleted successfully" });
    } catch (err) {
        console.error("deleteQuest error:", err);
        return res.status(500).json({ error: "Failed to delete quest" });
    }
}

// ── PATCH /api/quests/:questId/microtasks/:microtaskId/complete ──
export async function completeMicrotask(req, res) {
    try {
        const { questId, microtaskId } = req.params;

        const quest = await Quest.findOne({ _id: questId, userId: req.user._id });
        if (!quest) {
            return res.status(404).json({ error: "Quest not found" });
        }

        const microtask = quest.microtasks.id(microtaskId);
        if (!microtask) {
            return res.status(404).json({ error: "Microtask not found" });
        }
        if (microtask.isCompleted) {
            return res.status(400).json({ error: "Microtask already completed" });
        }
        if (quest.status !== "active") {
            return res.status(400).json({ error: "Cannot complete tasks on a non-active quest" });
        }

        // ── Mark microtask done ──
        microtask.isCompleted = true;
        microtask.completedAt = new Date();
        quest.earnedXp += microtask.xpReward;
        quest.earnedGold += microtask.goldReward;

        // ── Award progression to the user (streak-multiplied) ──
        const user = req.user;
        const streakResult = updateStreak(user);
        const xpResult = await awardXp(user, quest.domain, microtask.xpReward);
        awardGold(user, microtask.goldReward);

        // ── Check if the whole quest is now complete ──
        const questCompleted = quest.checkAndMarkCompleted();

        await Promise.all([quest.save(), user.save()]);

        // ── Activity logs ──
        await logActivity({
            userId: user._id,
            actionType: "microtask_completed",
            domain: quest.domain,
            xpGained: xpResult.xpAwarded,
            goldGained: microtask.goldReward,
            metadata: { questId: quest._id, microtaskId: microtask._id, title: microtask.title },
        });

        if (xpResult.leveledUp) {
            await logActivity({
                userId: user._id,
                actionType: "level_up",
                domain: quest.domain,
                metadata: {
                    domain: quest.domain,
                    newDomainLevel: xpResult.newDomainLevel,
                    newOverallLevel: xpResult.newOverallLevel,
                    levelsGained: xpResult.levelsGained,
                },
            });
        }

        if (questCompleted) {
            await logActivity({
                userId: user._id,
                actionType: "quest_completed",
                domain: quest.domain,
                xpGained: 0,
                goldGained: 0,
                metadata: { questId: quest._id, title: quest.title },
            });
        }

        return res.status(200).json({
            quest,
            progression: xpResult,
            streak: {
                currentStreak: user.streak.currentStreak,
                longestStreak: user.streak.longestStreak,
                changed: streakResult.changed,
            },
            questCompleted,
            user, // updated character/domains/gold (passwordHash stripped by toJSON)
        });
    } catch (err) {
        console.error("completeMicrotask error:", err);
        return res.status(500).json({ error: "Failed to complete microtask" });
    }
}