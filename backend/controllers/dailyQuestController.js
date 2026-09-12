import DailyQuest from "../models/dailyQuestSchema.js";
import { awardXp, awardGold, updateStreak, logActivity } from "../services/progressionService.js";
import { analyzeProofImage } from "./aiController.js";

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
    daily.lastProof = null; // yesterday's AI verdict shouldn't linger into today

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

        // ── Optional proof-of-completion photo ──
        // The image (if any) is a base64 data URL that lives only in this
        // request's memory. We send it to Gemini to check it's plausibly
        // related to this habit and to read any measurable value it shows,
        // keep just that result, and let the buffer be garbage-collected
        // once this function returns — it is never written to disk or saved
        // on the daily quest / user / activity log.
        let proof = null;
        let bonusXp = 0;
        if (req.body?.proofImage) {
            try {
                const result = await analyzeProofImage(req.body.proofImage, daily.title);

                if (!result.matches) {
                    // Reject before anything is mutated or saved — no partial
                    // completion, no reward, nothing written for a rejected photo.
                    // Message = Gemini's own short read of the photo (the "why",
                    // already capped at ~15 words) + a concrete suggestion of
                    // what kind of screenshot WOULD count for this domain.
                    const domainSuggestion = {
                        health: "a Health app or Digital Wellbeing screenshot",
                        mental: "a Screen Time or mindfulness app screenshot",
                        skill: "an app screenshot showing your progress",
                    }[daily.domain] || "a more relevant screenshot";

                    return res.status(400).json({
                        error: `${result.description} — try ${domainSuggestion} instead.`,
                        code: "proof_mismatch",
                        description: result.description,
                        score: result.score,
                    });
                }

                // Bonus XP has two components, summed and capped at +100% of
                // the base reward:
                //  1) A measurable-target bonus (e.g. ran 250m vs a 200m goal).
                //  2) A quality bonus driven by Gemini's 1-10 conviction score
                //     — a 5/10 (an ordinary, adequate photo) earns no extra,
                //     scores above that scale up to +50% at a perfect 10.
                const targetBonusPercent = result.overPerformancePercent;
                const qualityBonusPercent = Math.max(0, result.score - 5) * 10; // 6→10%, 10→50%
                const totalBonusPercent = Math.min(100, targetBonusPercent + qualityBonusPercent);
                bonusXp = Math.round((daily.xpReward * totalBonusPercent) / 100);

                proof = {
                    submitted: true,
                    description: result.description,
                    source: "gemini",
                    score: result.score,
                    targetValue: result.targetValue,
                    achievedValue: result.achievedValue,
                    unit: result.unit,
                    overPerformancePercent: result.overPerformancePercent,
                    bonusXp,
                };
            } catch (err) {
                console.warn("Proof image analysis unavailable:", err.message);
                proof = { submitted: true, description: null, source: "unavailable" };
            }
        }

        const today = todayStr();
        daily.isCompletedToday = true;
        daily.streakDays += 1;
        daily.lastCompletedDate = today;

        // Persist the verdict onto the quest itself (not just the activity
        // log) so it keeps showing under the quest card after a refresh.
        if (proof) {
            daily.lastProof = {
                description: proof.description,
                matches: true,
                score: proof.score ?? null,
                bonusXp: proof.bonusXp || 0,
                overPerformancePercent: proof.overPerformancePercent || 0,
                verifiedAt: new Date(),
            };
        }

        // ── Award progression to the user (streak-multiplied) ──
        const user = req.user;
        const streakResult = updateStreak(user);
        const xpResult = await awardXp(user, daily.domain, daily.xpReward + bonusXp);
        awardGold(user, daily.goldReward);

        await Promise.all([daily.save(), user.save()]);

        await logActivity({
            userId: user._id,
            actionType: "streak_checkin",
            domain: daily.domain,
            xpGained: xpResult.xpAwarded,
            goldGained: daily.goldReward,
            metadata: {
                dailyQuestId: daily._id,
                title: daily.title,
                dailyStreak: daily.streakDays,
                ...(proof ? { proof } : {}),
            },
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
            proof,
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