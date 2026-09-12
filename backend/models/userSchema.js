import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { Schema } = mongoose;


const characterSchema = new Schema(
    {
        title: { type: String, default: "Novice Seeker" },
        avatar: { type: String, default: "avatar_cyber_mage" },
        avatarFrame: { type: String, default: "neon_cyan" },
        avatarUrl: { type: String, default: null },
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
        health: {
            type: domainStateSchema,
            default: () => ({}),
        },
        mental: {
            type: domainStateSchema,
            default: () => ({}),
        },
        skill: {
            type: domainStateSchema,
            default: () => ({}),
        },
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
        itemId: {
            type: String,
            required: true,
        },

        name: {
            type: String,
            required: true,
        },

        type: {
            type: String,
            enum: ["potion", "badge", "theme", "relic", "freeze"],
            required: true,
        },

        quantity: {
            type: Number,
            default: 1,
        },

        equipped: {
            type: Boolean,
            default: false,
        },

        acquiredAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: true }
);



const userSchema = new Schema(
    {
        

        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: [2, "Name must be at least 2 characters"],
            maxlength: [50, "Name cannot exceed 50 characters"],
        },

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
            match: [
                /^\S+@\S+\.\S+$/,
                "Please provide a valid email address",
            ],
        },

        gender: {
            type: String,
            required: [true, "Gender is required"],
            enum: {
                values: [
                    "male",
                    "female",
                    "non-binary",
                    "prefer_not_to_say",
                ],
                message: "Invalid gender",
            },
        },

        age: {
            type: Number,
            required: [true, "Age is required"],
            min: [13, "Age must be at least 13"],
            max: [120, "Please provide a valid age"],
        },

        profilePic: {
            type: String,
            default: null,
            trim: true,
        },

        

        passwordHash: {
            type: String,
            required: true,
        },

        resetPasswordToken: {
            type: String,
            default: null,
        },

        resetPasswordExpires: {
            type: Date,
            default: null,
        },

        

        character: {
            type: characterSchema,
            default: () => ({}),
        },

        

        domains: {
            type: domainsSchema,
            default: () => ({}),
        },

    

        streak: {
            type: streakSchema,
            default: () => ({}),
        },

       

        inventory: [inventoryItemSchema],
    },
    {
        timestamps: true,
    }
);



userSchema.statics.xpRequiredForLevel = function (level) {
    return Math.floor(100 * Math.pow(level, 1.5));
};

userSchema.statics.streakMultiplier = function (streakDays) {
    return 1.0 + Math.min(streakDays * 0.05, 0.5);
};


userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.statics.hashPassword = async function (plainPassword) {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(plainPassword, salt);
};


userSchema.methods.toJSON = function () {
    const obj = this.toObject();

    delete obj.passwordHash;
    delete obj.resetPasswordToken;
    delete obj.resetPasswordExpires;

    return obj;
};


const User = mongoose.model("User", userSchema);

export default User;