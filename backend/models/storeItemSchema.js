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
        _id: { type: String, required: true }, // custom string id like "fire_emberbrand"
        name: { type: String, required: true, unique: true },
        description: { type: String, required: true },
        type: {
            type: String,
            enum: ["power", "potion", "freeze", "theme", "badge", "relic", "boost", "consumable"],
            required: true,
            default: "power",
        },
        school: {
            type: String,
            enum: ["fire", "water", "earth", "air", "arcane", "shadow", "holy", "nature", "mind", "time"],
            default: "arcane",
        },
        costGold: { type: Number, required: true },
        costGems: { type: Number, default: 0 },
        icon: { type: String, required: true },
        rarity: {
            type: String,
            enum: ["common", "rare", "epic", "legendary"],
            default: "common",
        },
        effectText: { type: String, default: "" },
        effect: { type: effectSchema, default: null },
    },
    { _id: false, timestamps: true }
);

const StoreItem = mongoose.model("StoreItem", storeItemSchema);

export default StoreItem;