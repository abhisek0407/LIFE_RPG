import mongoose from "mongoose";

const { Schema } = mongoose;

const dailyQuestSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        title: { type: String, required: true, trim: true },
        description: { type: String, default: "" },
        domain: {
            type: String,
            enum: ["health", "mental", "skill"],
            required: true,
        },
        xpReward: { type: Number, default: 25 },
        goldReward: { type: Number, default: 10 },
        isCompletedToday: { type: Boolean, default: false },
        streakDays: { type: Number, default: 0 },
        lastCompletedDate: { type: String, default: null }, // "YYYY-MM-DD"
    },
    { timestamps: true }
);

// ── Instance helpers ─────────────────────────────────────────

// Call this at the start of each day (e.g. in GET /daily-quests)
// to auto-reset completion status on a new calendar day.
dailyQuestSchema.methods.resetIfNewDay = function () {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    if (this.lastCompletedDate !== today) {
        this.isCompletedToday = false;
        return this.save();
    }
    return this;
};

const DailyQuest = mongoose.model("DailyQuest", dailyQuestSchema);

export default DailyQuest;