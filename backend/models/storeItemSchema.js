import mongoose from "mongoose";

const { Schema } = mongoose;

const effectSchema = new Schema(
    {
        type: {
            type: String,
            enum: ["xp_multiplier", "streak_freeze", "theme_unlock", "badge_grant"],
            required: true,
        },
        value: { type: Schema.Types.Mixed }, // e.g. 1.25, "theme_id", "badge_id"
        durationMinutes: { type: Number, default: 0 },
    },
    { _id: false }
);

const storeItemSchema = new Schema(
    {
        _id: { type: String, required: true }, // custom string id like "potion_focus"
        name: { type: String, required: true, unique: true },
        description: { type: String, required: true },
        type: {
            type: String,
            enum: ["potion", "freeze", "theme", "badge", "relic"],
            required: true,
        },
        costGold: { type: Number, required: true },
        costGems: { type: Number, default: 0 },
        icon: { type: String, required: true }, // lucide icon name
        rarity: {
            type: String,
            enum: ["common", "rare", "epic", "legendary"],
            default: "common",
        },
        effect: { type: effectSchema, default: null },
    },
    { _id: false, timestamps: true }
);

const StoreItem = mongoose.model("StoreItem", storeItemSchema);

export default StoreItem;