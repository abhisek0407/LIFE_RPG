// One-off seed script for the StoreItem catalog.
// Run with: npm run seed:store
//
// Uses upsert (findOneAndUpdate + upsert) rather than plain insertMany so
// this is safe to re-run after editing the catalog below.

import "dotenv/config";
import { connectDB, disconnectDB } from "../config/db.js";
import StoreItem from "../models/storeItemSchema.js";

const catalog = [
    {
        _id: "potion_focus",
        name: "Potion of Focus",
        description: "A shimmering brew that sharpens concentration for a short while.",
        type: "potion",
        costGold: 100,
        costGems: 0,
        icon: "flask-conical",
        rarity: "common",
        effect: { type: "xp_multiplier", value: 1.5, durationMinutes: 30 },
    },
    {
        _id: "potion_clarity",
        name: "Potion of Clarity",
        description: "A lighter tonic — a mild but reliable XP boost.",
        type: "potion",
        costGold: 50,
        costGems: 0,
        icon: "sparkles",
        rarity: "common",
        effect: { type: "xp_multiplier", value: 1.25, durationMinutes: 15 },
    },
    {
        _id: "freeze_frost",
        name: "Frostguard Charm",
        description: "Protects your streak for one missed day. Applied instantly on purchase.",
        type: "freeze",
        costGold: 150,
        costGems: 0,
        icon: "snowflake",
        rarity: "rare",
        effect: { type: "streak_freeze", value: 1, durationMinutes: 0 },
    },
    {
        _id: "theme_cyberpunk",
        name: "Neon Cyberpunk Theme",
        description: "Unlocks a neon-drenched UI theme for your character sheet.",
        type: "theme",
        costGold: 0,
        costGems: 10,
        icon: "palette",
        rarity: "epic",
        effect: { type: "theme_unlock", value: "theme_cyberpunk", durationMinutes: 0 },
    },
    {
        _id: "badge_first_steps",
        name: "First Steps Badge",
        description: "A commemorative badge for beginning your journey.",
        type: "badge",
        costGold: 0,
        costGems: 5,
        icon: "badge-check",
        rarity: "common",
        effect: { type: "badge_grant", value: "badge_first_steps", durationMinutes: 0 },
    },
    {
        _id: "relic_ancient_compass",
        name: "Ancient Compass",
        description: "A purely decorative relic for your collection. No mechanical effect.",
        type: "relic",
        costGold: 500,
        costGems: 0,
        icon: "compass",
        rarity: "legendary",
        effect: null,
    },
];

async function seed() {
    await connectDB();

    for (const item of catalog) {
        const { _id, ...fields } = item;
        await StoreItem.findOneAndUpdate(
            { _id },
            { _id, ...fields },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        console.log(`✓ Seeded: ${item.name} (${_id})`);
    }

    console.log(`\nDone — ${catalog.length} store items seeded.`);
    await disconnectDB();
    process.exit(0);
}

seed().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});