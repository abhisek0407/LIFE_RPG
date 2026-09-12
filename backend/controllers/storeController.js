import StoreItem from "../models/storeItemSchema.js";
import { logActivity } from "../services/progressionService.js";

// ── GET /api/store/items?type=potion ─────────────────────────
export async function getStoreItems(req, res) {
    try {
        const filter = {};
        if (req.query.type) {
            if (!["potion", "freeze", "theme", "badge", "relic"].includes(req.query.type)) {
                return res.status(400).json({ error: "Invalid type filter" });
            }
            filter.type = req.query.type;
        }

        const items = await StoreItem.find(filter).sort({ rarity: 1, costGold: 1 });
        return res.status(200).json({ items });
    } catch (err) {
        console.error("getStoreItems error:", err);
        return res.status(500).json({ error: "Failed to fetch store items" });
    }
}

// ── GET /api/store/inventory ──────────────────────────────────
export async function getInventory(req, res) {
    // req.user is already the full, current Mongoose doc (attached by `protect`)
    return res.status(200).json({ inventory: req.user.inventory });
}

// ── POST /api/store/buy ───────────────────────────────────────
// body: { itemId }
export async function buyItem(req, res) {
    try {
        const { itemId } = req.body;
        if (!itemId) {
            return res.status(400).json({ error: "itemId is required" });
        }

        const item = await StoreItem.findById(itemId);
        if (!item) {
            return res.status(404).json({ error: "Store item not found" });
        }

        const user = req.user;
        const costGems = item.costGems || 0;

        if (user.character.gold < item.costGold || user.character.gems < costGems) {
            return res.status(400).json({ error: "Insufficient gold or gems" });
        }

        // ── Deduct currency ──
        user.character.gold -= item.costGold;
        user.character.gems -= costGems;

        // ── Apply / stow the effect ──
        // streak_freeze, theme_unlock and badge_grant are applied immediately
        // (they shouldn't just sit inertly in inventory). Everything else
        // (potions, relics) is added to inventory to be used/kept later.
        let appliedImmediately = false;

        if (item.effect?.type === "streak_freeze") {
            const amount = typeof item.effect.value === "number" ? item.effect.value : 1;
            user.streak.streakFreezesAvailable += amount;
            appliedImmediately = true;
        } else if (item.effect?.type === "theme_unlock" || item.effect?.type === "badge_grant") {
            const alreadyOwned = user.inventory.some((inv) => inv.itemId === item._id);
            if (!alreadyOwned) {
                user.inventory.push({
                    itemId: item._id,
                    name: item.name,
                    type: item.type,
                    quantity: 1,
                    equipped: false,
                });
            }
            appliedImmediately = true;
        } else {
            // Consumable (potion) or collectible (relic) — stack by itemId
            const existing = user.inventory.find((inv) => inv.itemId === item._id);
            if (existing) {
                existing.quantity += 1;
            } else {
                user.inventory.push({
                    itemId: item._id,
                    name: item.name,
                    type: item.type,
                    quantity: 1,
                    equipped: false,
                });
            }
        }

        await user.save();

        await logActivity({
            userId: user._id,
            actionType: "item_purchased",
            domain: "global",
            goldGained: -item.costGold,
            metadata: {
                itemId: item._id,
                name: item.name,
                costGold: item.costGold,
                costGems,
                appliedImmediately,
            },
        });

        return res.status(200).json({ item, appliedImmediately, user });
    } catch (err) {
        console.error("buyItem error:", err);
        return res.status(500).json({ error: "Failed to purchase item" });
    }
}

// ── POST /api/store/use/:itemId ───────────────────────────────
// Consumes one unit of a stacked inventory item (e.g. a potion) and
// returns its effect so the caller can apply it. Note: there is no
// activeEffects/buff-timer field on the User schema yet, so a timed
// effect (e.g. a 30-minute XP multiplier) is not tracked server-side
// here — this is the deferred MVP boundary called out in CLAUDE.md §6.
export async function useItem(req, res) {
    try {
        const { itemId } = req.params;
        const user = req.user;

        const invEntry = user.inventory.find((inv) => inv.itemId === itemId);
        if (!invEntry || invEntry.quantity <= 0) {
            return res.status(404).json({ error: "Item not found in inventory" });
        }

        const storeItem = await StoreItem.findById(itemId);
        if (!storeItem) {
            return res.status(404).json({ error: "Store item no longer exists" });
        }
        if (!["potion", "relic"].includes(storeItem.type)) {
            return res.status(400).json({ error: "This item cannot be used — it's a permanent unlock" });
        }

        invEntry.quantity -= 1;
        if (invEntry.quantity <= 0) {
            user.inventory.pull({ _id: invEntry._id });
        }

        await user.save();

        return res.status(200).json({
            message: `Used ${storeItem.name}`,
            effect: storeItem.effect || null,
            remainingQuantity: Math.max(invEntry.quantity, 0),
            user,
        });
    } catch (err) {
        console.error("useItem error:", err);
        return res.status(500).json({ error: "Failed to use item" });
    }
}