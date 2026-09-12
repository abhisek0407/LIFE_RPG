import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { Schema } = mongoose;

// ── Sub-schemas ──────────────────────────────────────────────

const characterSchema = new Schema(
    {
        title: { type: String, default: "Novice Seeker" },
        avatar: { type: String, default: "avatar_cyber_mage" },
        overallLevel: { type: Number, default: 1 },
        totalXpEarned: { type: Number, default: 0 },
        gold: { type: Number, default: 50 },
        gems: { type: Number, default: 5 },
    },
    { _id: false }
);

const domainStateSchema = new Schema(
    {
        level: { type: Number, default: 1 },
        currentXp: { type: Number, default: 0 },
        xpToNextLevel: { type: Number, default: 100 },
    },
    { _id: false }
);

const domainsSchema = new Schema(
    {
        health: { type: domainStateSchema, default: () => ({}) },
        mental: { type: domainStateSchema, default: () => ({}) },
        skill: { type: domainStateSchema, default: () => ({}) },
    },
    { _id: false }
);

const streakSchema = new Schema(
    {
        currentStreak: { type: Number, default: 1 },
        longestStreak: { type: Number, default: 1 },
        lastActivityDate: { type: Date, default: Date.now },
        streakFreezesAvailable: { type: Number, default: 1 },
    },
    { _id: false }
);

const inventoryItemSchema = new Schema(
    {
        itemId: { type: String, required: true },
        name: { type: String, required: true },
        type: {
            type: String,
            enum: ["potion", "badge", "theme", "relic", "freeze"],
            required: true,
        },
        quantity: { type: Number, default: 1 },
        equipped: { type: Boolean, default: false },
        acquiredAt: { type: Date, default: Date.now },
    },
    { _id: true }
);

// ── Main User Schema ─────────────────────────────────────────

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: [true, "Username is required"],
            unique: true,
            trim: true,
            minlength: [3, "Username must be at least 3 characters"],
            maxlength: [30, "Username cannot exceed 30 characters"],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
        },
        passwordHash: { type: String, required: true },
        character: { type: characterSchema, default: () => ({}) },
        domains: { type: domainsSchema, default: () => ({}) },
        streak: { type: streakSchema, default: () => ({}) },
        inventory: [inventoryItemSchema],
    },
    { timestamps: true }
);

// ── Static Helpers (progression formulas from spec) ──────────

userSchema.statics.xpRequiredForLevel = function (level) {
    return Math.floor(100 * Math.pow(level, 1.5));
};

userSchema.statics.streakMultiplier = function (streakDays) {
    return 1.0 + Math.min(streakDays * 0.05, 0.5);
};

// ── Password helpers ─────────────────────────────────────────

userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.statics.hashPassword = async function (plainPassword) {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(plainPassword, salt);
};

// ── Hide sensitive fields in JSON responses ──────────────────

userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.passwordHash;
    return obj;
};

const User = mongoose.model("User", userSchema);

export default User;