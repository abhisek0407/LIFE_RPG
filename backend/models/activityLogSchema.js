import mongoose from "mongoose";

const { Schema } = mongoose;

const activityLogSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        actionType: {
            type: String,
            enum: [
                "microtask_completed",
                "quest_completed",
                "level_up",
                "item_purchased",
                "streak_checkin",
                "grounding_completed",
            ],
            required: true,
        },
        domain: {
            type: String,
            enum: ["health", "mental", "skill", "global"],
            default: "global",
        },
        xpGained: { type: Number, default: 0 },
        goldGained: { type: Number, default: 0 },
        metadata: { type: Schema.Types.Mixed, default: {} }, // questId, microtaskId, itemId, etc.
        timestamp: { type: Date, default: Date.now, index: true },
    },
    { timestamps: false }
);

// Compound index for fetching a user's recent history fast
activityLogSchema.index({ userId: 1, timestamp: -1 });

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);

export default ActivityLog;