import Quest from "../models/questSchema.js";
import mongoose from "mongoose";
import { awardXp, awardGold, updateStreak, logActivity } from "../services/progressionService.js";

// ── GET /api/quests?status=active ────────────────────────────
export async function getQuests(req, res) {
    try {
        const filter = { userId: req.user._id };
        const statusQuery = req.query.status;
        const domainQuery = req.query.domain;

        // Optional ?domain=health|mental|skill
        if (domainQuery && domainQuery !== "all") {
            if (["health", "mental", "skill"].includes(domainQuery)) {
                filter.domain = domainQuery;
            } else {
                return res.status(400).json({ error: "Invalid domain filter" });
            }
        }

        // Optional ?status filter
        if (statusQuery === "active") { filter.status = "active"; }
        else if (statusQuery === "completed" || statusQuery === "conquered") { filter.status = "completed"; }
        else if (statusQuery === "archived") { filter.status = "archived"; }
        else if (statusQuery === "not_started" || statusQuery === "partially_conquered") { filter.status = "active"; }
        // "all" or no status → no filter (return active + completed together)

        let quests = await Quest.find(filter).sort({ createdAt: -1 });

        // Apply in-memory filter for partially_conquered / not_started
        if (statusQuery === "not_started") {
            quests = quests.filter((q) => (q.microtasks || []).every((m) => !m.isCompleted));
        } else if (statusQuery === "partially_conquered") {
            quests = quests.filter((q) => {
                const tasks = q.microtasks || [];
                const done = tasks.filter((m) => m.isCompleted).length;
                return done > 0 && done < tasks.length;
            });
        }

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

        // Coerce and sanitize microtask rewards (client may send strings or omit values)
        const sanitizedMicrotasks = [];
        for (let i = 0; i < microtasks.length; i++) {
            const mt = microtasks[i];
            if (!mt.title?.trim()) {
                return res.status(400).json({ error: `Microtask #${i + 1} is missing a title` });
            }
            const xpReward = Number(mt.xpReward);
            const goldReward = Number(mt.goldReward);
            sanitizedMicrotasks.push({
                title: mt.title.trim(),
                order: mt.order ?? i + 1,
                xpReward: (isFinite(xpReward) && xpReward > 0) ? Math.round(xpReward) : 20,
                goldReward: (isFinite(goldReward) && goldReward >= 0) ? Math.round(goldReward) : 5,
            });
        }

        // ── Compute totals from sanitized microtasks ──
        const totalXp = sanitizedMicrotasks.reduce((sum, mt) => sum + mt.xpReward, 0);
        const totalGold = sanitizedMicrotasks.reduce((sum, mt) => sum + mt.goldReward, 0);

        const quest = await Quest.create({
            userId: req.user._id,
            title: title.trim(),
            domain,
            difficulty: difficulty || "medium",
            motivationLevel: motivationLevel || "medium",
            totalXp,
            totalGold,
            microtasks: sanitizedMicrotasks,
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
// Handles BOTH real DB quests (valid ObjectId) and grounding/seed quests
// (client-generated IDs like q_1234567890 or grounding_session).
// XP + Gold is ALWAYS persisted to MongoDB user document regardless of quest type.
export async function completeMicrotask(req, res) {
    try {
        const { questId, microtaskId } = req.params;
        const user = req.user;

        // Determine if questId is a real MongoDB ObjectId
        const isValidObjectId =
            mongoose.Types.ObjectId.isValid(questId) &&
            String(questId).length === 24;

        // ── Path A: Non-DB quest (grounding, seed, client-generated ID) ──
        if (!isValidObjectId) {
            const xp = Number(req.body?.xp) || 20;
            const gold = Number(req.body?.gold) || 5;
            const domain = ["health", "mental", "skill"].includes(req.body?.domain)
                ? req.body.domain
                : "mental";

            const streakResult = updateStreak(user);
            const xpResult = await awardXp(user, domain, xp);
            awardGold(user, gold);
            await user.save();

            logActivity({
                userId: user._id,
                actionType: "microtask_completed",
                domain,
                xpGained: xpResult.xpAwarded,
                goldGained: gold,
                metadata: { questId, microtaskId, isGrounding: true },
            }).catch(() => {});

            return res.status(200).json({
                success: true,
                isGrounding: true,
                xpAwarded: xpResult.xpAwarded,
                bonusXp: Math.max(0, xpResult.xpAwarded - xp),
                goldAwarded: gold,
                streak: {
                    currentStreak: user.streak.currentStreak,
                    longestStreak: user.streak.longestStreak,
                    changed: streakResult.changed,
                },
                progression: xpResult,
                user,
            });
        }

        // ── Path B: Valid ObjectId — look up quest in DB ──
        let quest = null;
        try {
            quest = await Quest.findOne({ _id: questId, userId: user._id });
        } catch (_) {}

        if (!quest) {
            // Quest not found in DB — still award progression to user
            const xp = Number(req.body?.xp) || 20;
            const gold = Number(req.body?.gold) || 5;
            const domain = ["health", "mental", "skill"].includes(req.body?.domain)
                ? req.body.domain
                : "mental";

            const streakResult = updateStreak(user);
            const xpResult = await awardXp(user, domain, xp);
            awardGold(user, gold);
            await user.save();

            logActivity({
                userId: user._id,
                actionType: "microtask_completed",
                domain,
                xpGained: xpResult.xpAwarded,
                goldGained: gold,
                metadata: { questId, microtaskId, notFound: true },
            }).catch(() => {});

            return res.status(200).json({
                success: true,
                xpAwarded: xpResult.xpAwarded,
                bonusXp: Math.max(0, xpResult.xpAwarded - xp),
                goldAwarded: gold,
                streak: {
                    currentStreak: user.streak.currentStreak,
                    longestStreak: user.streak.longestStreak,
                    changed: streakResult.changed,
                },
                progression: xpResult,
                user,
            });
        }

        // ── Quest found — look up microtask ──
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
        const streakResult = updateStreak(user);
        const xpResult = await awardXp(user, quest.domain, microtask.xpReward);
        awardGold(user, microtask.goldReward);

        // ── Check if the whole quest is now complete ──
        const questCompleted = quest.checkAndMarkCompleted();

        await Promise.all([quest.save(), user.save()]);

        // ── Fire-and-forget activity logs ──
        logActivity({
            userId: user._id,
            actionType: "microtask_completed",
            domain: quest.domain,
            xpGained: xpResult.xpAwarded,
            goldGained: microtask.goldReward,
            metadata: { questId: quest._id, microtaskId: microtask._id, title: microtask.title },
        }).catch(() => {});

        if (xpResult.leveledUp) {
            logActivity({
                userId: user._id,
                actionType: "level_up",
                domain: quest.domain,
                metadata: {
                    domain: quest.domain,
                    newDomainLevel: xpResult.newDomainLevel,
                    newOverallLevel: xpResult.newOverallLevel,
                    levelsGained: xpResult.levelsGained,
                },
            }).catch(() => {});
        }

        if (questCompleted) {
            logActivity({
                userId: user._id,
                actionType: "quest_completed",
                domain: quest.domain,
                xpGained: 0,
                goldGained: 0,
                metadata: { questId: quest._id, title: quest.title },
            }).catch(() => {});
        }

        return res.status(200).json({
            success: true,
            quest,
            progression: xpResult,
            streak: {
                currentStreak: user.streak.currentStreak,
                longestStreak: user.streak.longestStreak,
                changed: streakResult.changed,
            },
            xpAwarded: xpResult.xpAwarded,
            bonusXp: Math.max(0, xpResult.xpAwarded - microtask.xpReward),
            goldAwarded: microtask.goldReward,
            questCompleted,
            user,
        });
    } catch (err) {
        console.error("completeMicrotask error:", err);
        return res.status(500).json({ error: "Failed to complete microtask" });
    }
}