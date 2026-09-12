import ActivityLog from "../models/activityLogSchema.js";
import User from "../models/userSchema.js";

const toLocalDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const getLocalTimezoneString = () => {
    const offsetMinutes = -new Date().getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? "+" : "-";
    const absoluteMinutes = Math.abs(offsetMinutes);
    const hours = String(Math.floor(absoluteMinutes / 60)).padStart(2, "0");
    const minutes = String(absoluteMinutes % 60).padStart(2, "0");
    return `${sign}${hours}:${minutes}`;
};

// ── GET /api/streaks ───────────────────────────────────────────
// Returns the user's current streak state plus a 30-day activity
// heatmap (one entry per day, zero-filled for days with no activity)
// built from ActivityLog via an aggregation pipeline.
export async function getStreaks(req, res) {
    try {
        const userId = req.user._id;

        const now = new Date();
        const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const windowStart = new Date(todayLocal);
        windowStart.setDate(windowStart.getDate() - 29);

        const timezone = getLocalTimezoneString();

        const grouped = await ActivityLog.aggregate([
            { $match: { userId, timestamp: { $gte: windowStart } } },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$timestamp",
                            timezone,
                        },
                    },
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
        const recentDays = [];
        for (let i = 0; i < 30; i++) {
            const day = new Date(windowStart);
            day.setDate(day.getDate() + i);
            const key = toLocalDateKey(day);
            const entry = byDate.get(key);
            const tasksCompleted = entry?.count || 0;

            heatmap.push({
                date: key,
                count: tasksCompleted,
                xpGained: entry?.xpGained || 0,
                goldGained: entry?.goldGained || 0,
            });

            recentDays.push({
                date: key,
                tasksCompleted,
                active: tasksCompleted > 0,
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
            recentDays,
        });
    } catch (err) {
        console.error("getStreaks error:", err);
        return res.status(500).json({ error: "Failed to fetch streak data" });
    }
}