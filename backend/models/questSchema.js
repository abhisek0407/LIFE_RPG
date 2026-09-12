import mongoose from "mongoose";

const { Schema } = mongoose;

// ── Microtask sub-schema ─────────────────────────────────────

const microtaskSchema = new Schema(
    {
        title: { type: String, required: true, trim: true },
        order: { type: Number, required: true },
        xpReward: { type: Number, required: true },
        goldReward: { type: Number, required: true },
        isCompleted: { type: Boolean, default: false },
        completedAt: { type: Date, default: null },
    },
    {
        timestamps: false,
        // Subdocuments serialize with their own toJSON options, so this
        // needs to be repeated here too for `microtask.id` to show up.
        toJSON: { virtuals: true },
    }
);

// ── Main Quest Schema ────────────────────────────────────────

const questSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        title: { type: String, required: true, trim: true },
        domain: {
            type: String,
            enum: ["health", "mental", "skill"],
            required: true,
        },
        difficulty: {
            type: String,
            enum: ["easy", "medium", "hard"],
            default: "medium",
            required: true,
        },
        motivationLevel: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium",
            required: true,
        },
        status: {
            type: String,
            enum: ["active", "completed", "archived"],
            default: "active",
            index: true,
        },
        totalXp: { type: Number, required: true },
        totalGold: { type: Number, required: true },
        earnedXp: { type: Number, default: 0 },
        earnedGold: { type: Number, default: 0 },
        microtasks: [microtaskSchema],
        completedAt: { type: Date, default: null },
    },
    {
        timestamps: true,
        // Same fix as dailyQuestSchema: expose the `id` virtual in JSON so
        // the frontend's `quest.id` / `microtask.id` lookups actually work
        // instead of silently being undefined.
        toJSON: {
            virtuals: true,
            transform: (_doc, ret) => {
                delete ret.__v;
                return ret;
            },
        },
    }
);

// ── Indexes for common queries ───────────────────────────────

questSchema.index({ userId: 1, status: 1 });

// ── Instance helpers ─────────────────────────────────────────

questSchema.methods.progress = function () {
    const total = this.microtasks.length;
    const done = this.microtasks.filter((m) => m.isCompleted).length;
    return total === 0 ? 0 : Math.round((done / total) * 100);
};

questSchema.methods.checkAndMarkCompleted = function () {
    const allDone =
        this.microtasks.length > 0 &&
        this.microtasks.every((m) => m.isCompleted);

    if (allDone && this.status !== "completed") {
        this.status = "completed";
        this.completedAt = new Date();
    }
    return allDone;
};

const Quest = mongoose.model("Quest", questSchema);

export default Quest;