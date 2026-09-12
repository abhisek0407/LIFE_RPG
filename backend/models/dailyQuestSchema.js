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

        // Snapshot of the most recent Gemini proof-photo verdict for this
        // habit. Persisted (unlike the photo itself, which is never stored)
        // so the UI can keep showing "what the AI thought" under the quest
        // even after a page refresh, not just in the one-time toast.
        lastProof: {
            type: new Schema(
                {
                    description: { type: String, default: null },
                    matches: { type: Boolean, default: true },
                    score: { type: Number, default: null }, // 1-10 Gemini quality rating
                    bonusXp: { type: Number, default: 0 },
                    overPerformancePercent: { type: Number, default: 0 },
                    verifiedAt: { type: Date, default: null },
                },
                { _id: false }
            ),
            default: null,
        },
    },
    {
        timestamps: true,
        // The frontend reads `daily.id` everywhere (never `_id`). Mongoose's
        // `id` virtual exists on the document already, but is left out of
        // JSON by default — so without this, every daily quest sent to the
        // client had `id: undefined`, and completing/uploading proof for it
        // sent requests to ".../undefined/complete" (crashes with a Mongoose
        // CastError). `virtuals: true` makes `id` actually show up in the
        // JSON the frontend receives.
        toJSON: {
            virtuals: true,
            transform: (_doc, ret) => {
                delete ret.__v;
                return ret;
            },
        },
    }
);

// ── Instance helpers ─────────────────────────────────────────

// Call this at the start of each day (e.g. in GET /daily-quests)
// to auto-reset completion status on a new calendar day.
dailyQuestSchema.methods.resetIfNewDay = function () {
    const toLocalDateKey = (date = new Date()) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const today = toLocalDateKey();
    if (this.lastCompletedDate !== today) {
        this.isCompletedToday = false;
        return this.save();
    }
    return this;
};

const DailyQuest = mongoose.model("DailyQuest", dailyQuestSchema);

export default DailyQuest;