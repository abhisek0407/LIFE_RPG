import ActivityLog from "../models/activityLogSchema.js";
import User from "../models/userSchema.js";

// ── GET /api/streaks ───────────────────────────────────────────
// Returns the user's current streak state plus a 30-day activity
// heatmap (one entry per day, zero-filled for days with no activity)
// built from ActivityLog via an aggregation pipeline.
export async function getStreaks(req, res) {
    try {
        const userId = req.user._id;

        // Start of the 30-day window (today counts as day 30, so go back 29).
        // Built entirely in UTC — $dateToString below groups by UTC calendar
        // day by default, so mixing in local-timezone date math here would
        // make the labels drift by a day on any server not running in UTC.
        const now = new Date();
        const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const windowStart = new Date(todayUTC);
        windowStart.setUTCDate(windowStart.getUTCDate() - 29);

        const grouped = await ActivityLog.aggregate([
            { $match: { userId, timestamp: { $gte: windowStart } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                    count: { $sum: 1 },
                    xpGained: { $sum: "$xpGained" },
                    goldGained: { $sum: "$goldGained" },
                },
            },
        ]);

        const byDate = new Map(grouped.map((entry) => [entry._id, entry]));

        // Fill in every day in the 30-day window, including zero-activity days,
        // so the client can render a full, gap-free heatmap.
        const heatmap = [];
        for (let i = 0; i < 30; i++) {
            const day = new Date(windowStart);
            day.setUTCDate(day.getUTCDate() + i);
            const key = day.toISOString().slice(0, 10);
            const entry = byDate.get(key);

            heatmap.push({
                date: key,
                count: entry?.count || 0,
                xpGained: entry?.xpGained || 0,
                goldGained: entry?.goldGained || 0,
            });
        }

        const currentStreak = req.user.streak?.currentStreak || 1;
        const longestStreak = req.user.streak?.longestStreak || 1;
        const multiplier = User.streakMultiplier ? User.streakMultiplier(currentStreak) : (1.0 + Math.min(currentStreak * 0.05, 0.5));
        const freezesAvailable = req.user.streak?.streakFreezesAvailable || 0;

        return res.status(200).json({
            currentStreak,
            longestStreak,
            multiplier,
            freezesAvailable,
            streak: req.user.streak,
            heatmap,
        });
    } catch (err) {
        console.error("getStreaks error:", err);
        return res.status(500).json({ error: "Failed to fetch streak data" });
    }
}