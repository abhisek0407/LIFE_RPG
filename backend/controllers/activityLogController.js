import ActivityLog from "../models/activityLogSchema.js";
import { awardXp, awardGold, updateStreak } from "../services/progressionService.js";

export async function createActivityLog(req, res) {
  try {
    const { actionType, domain, xpGained, goldGained, metadata } = req.body;

    if (!actionType) {
      return res.status(400).json({ error: "actionType is required" });
    }

    const log = await ActivityLog.create({
      userId: req.user._id,
      actionType,
      domain: ["health", "mental", "skill", "global"].includes(domain) ? domain : "global",
      xpGained: Number(xpGained) || 0,
      goldGained: Number(goldGained) || 0,
      metadata: metadata || {},
    });

    return res.status(200).json({ log });
  } catch (err) {
    console.error("createActivityLog error:", err);
    return res.status(500).json({ error: "Failed to create activity log" });
  }
}

export async function checkInStreak(req, res) {
  try {
    const user = req.user;

    const streakResult = updateStreak(user);
    const xpResult = await awardXp(user, "mental", 20);
    awardGold(user, 10);

    await user.save();

    const log = await ActivityLog.create({
      userId: user._id,
      actionType: "streak_checkin",
      domain: "global",
      xpGained: xpResult.xpAwarded,
      goldGained: 10,
      metadata: { source: "frontend_checkin" },
    });

    return res.status(200).json({
      success: true,
      xpAwarded: xpResult.xpAwarded,
      goldAwarded: 10,
      bonusXp: xpResult.xpAwarded - 20,
      streak: {
        currentStreak: user.streak.currentStreak,
        longestStreak: user.streak.longestStreak,
        changed: streakResult.changed,
      },
      updatedUser: user,
      log,
    });
  } catch (err) {
    console.error("checkInStreak error:", err);
    return res.status(500).json({ error: "Failed to check in" });
  }
}
