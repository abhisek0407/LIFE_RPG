import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { makeApiClient, ensureServerUp } from "./helpers/apiClient.js";
import { connectTestDB, disconnectTestDB } from "./helpers/db.js";
import User from "../models/userSchema.js";
import StoreItem from "../models/storeItemSchema.js";
import ActivityLog from "../models/activityLogSchema.js";

const stamp = Date.now();
const testUser = {
    name: "Store Test User",
    username: `storetest_${stamp}`,
    gender: "prefer_not_to_say",
    age: 25,
    email: `storetest_${stamp}@example.com`,
    gender: "male",
    age: 21,
    profilePic: null,
    password: "TestPassword123!",
};

// ── Throwaway catalog items for this test run only ──
// Costs are kept within the default starting balance (50 gold / 5 gems)
// so no direct DB top-up is needed.
const potionId = `test_potion_${stamp}`;
const freezeId = `test_freeze_${stamp}`;
const themeId = `test_theme_${stamp}`;
const expensiveId = `test_expensive_${stamp}`;

const { api, setToken } = makeApiClient();
let userId = null;

before(async () => {
    await ensureServerUp();
    await connectTestDB();

    await StoreItem.create([
        {
            _id: potionId,
            name: "Test Potion",
            description: "A throwaway potion for the test suite.",
            type: "potion",
            costGold: 20,
            costGems: 0,
            icon: "flask-conical",
            rarity: "common",
            effect: { type: "xp_multiplier", value: 1.5, durationMinutes: 30 },
        },
        {
            _id: freezeId,
            name: "Test Freeze Charm",
            description: "A throwaway streak freeze for the test suite.",
            type: "freeze",
            costGold: 10,
            costGems: 0,
            icon: "snowflake",
            rarity: "rare",
            effect: { type: "streak_freeze", value: 1, durationMinutes: 0 },
        },
        {
            _id: themeId,
            name: "Test Theme",
            description: "A free throwaway theme unlock for the test suite.",
            type: "theme",
            costGold: 0,
            costGems: 0,
            icon: "palette",
            rarity: "epic",
            effect: { type: "theme_unlock", value: themeId, durationMinutes: 0 },
        },
        {
            _id: expensiveId,
            name: "Test Unaffordable Relic",
            description: "Deliberately priced above default starting gold.",
            type: "relic",
            costGold: 999,
            costGems: 0,
            icon: "compass",
            rarity: "legendary",
            effect: null,
        },
    ]);

    const reg = await api("POST", "/api/auth/register", testUser, false);
    setToken(reg.data.token);
    userId = reg.data.user._id;
});

after(async () => {
    // ── Cleanup: remove anything this file created ──
    await StoreItem.deleteMany({ _id: { $in: [potionId, freezeId, themeId, expensiveId] } });
    await ActivityLog.deleteMany({ userId });
    await User.deleteOne({ _id: userId });
    await disconnectTestDB();
});

test("GET /api/store/items — lists the catalog including our test items", async () => {
    const { status, data } = await api("GET", "/api/store/items");
    assert.equal(status, 200);
    assert.ok(Array.isArray(data.items));
    assert.ok(data.items.some((i) => i._id === potionId));
    assert.ok(data.items.some((i) => i._id === freezeId));
});

test("GET /api/store/items?type=potion — filters by type", async () => {
    const { status, data } = await api("GET", "/api/store/items?type=potion");
    assert.equal(status, 200);
    assert.ok(data.items.every((i) => i.type === "potion"));
    assert.ok(data.items.some((i) => i._id === potionId));
});

test("GET /api/store/items?type=bogus — rejects an invalid type filter", async () => {
    const { status } = await api("GET", "/api/store/items?type=bogus");
    assert.equal(status, 400);
});

test("POST /api/store/buy — rejects a missing itemId", async () => {
    const { status } = await api("POST", "/api/store/buy", {});
    assert.equal(status, 400);
});

test("POST /api/store/buy — rejects an unknown itemId", async () => {
    const { status } = await api("POST", "/api/store/buy", { itemId: "does_not_exist" });
    assert.equal(status, 404);
});

test("POST /api/store/buy — rejects a purchase the user can't afford", async () => {
    const { status, data } = await api("POST", "/api/store/buy", { itemId: expensiveId });
    assert.equal(status, 400);
    assert.match(data.error, /insufficient/i);
});

test("POST /api/store/buy — purchases a potion, deducts gold, adds it to inventory", async () => {
    const before = await api("GET", "/api/auth/me");
    const goldBefore = before.data.user.character.gold;

    const { status, data } = await api("POST", "/api/store/buy", { itemId: potionId });

    assert.equal(status, 200, `Expected 200, got ${status}: ${JSON.stringify(data)}`);
    assert.equal(data.appliedImmediately, false);
    assert.equal(data.user.character.gold, goldBefore - 20);

    const invEntry = data.user.inventory.find((inv) => inv.itemId === potionId);
    assert.ok(invEntry, "Potion should appear in inventory");
    assert.equal(invEntry.quantity, 1);
});

test("POST /api/store/buy — buying the same potion again stacks quantity instead of duplicating", async () => {
    const { status, data } = await api("POST", "/api/store/buy", { itemId: potionId });
    assert.equal(status, 200);

    const matching = data.user.inventory.filter((inv) => inv.itemId === potionId);
    assert.equal(matching.length, 1, "Should still be a single inventory entry");
    assert.equal(matching[0].quantity, 2, "Quantity should stack to 2");
});

test("POST /api/store/buy — streak_freeze item applies immediately and is not added to inventory", async () => {
    const before = await api("GET", "/api/auth/me");
    const freezesBefore = before.data.user.streak.streakFreezesAvailable;

    const { status, data } = await api("POST", "/api/store/buy", { itemId: freezeId });

    assert.equal(status, 200, `Expected 200, got ${status}: ${JSON.stringify(data)}`);
    assert.equal(data.appliedImmediately, true);
    assert.equal(data.user.streak.streakFreezesAvailable, freezesBefore + 1);
    assert.ok(
        !data.user.inventory.some((inv) => inv.itemId === freezeId),
        "Freeze charm should not sit in inventory"
    );
});

test("POST /api/store/buy — theme_unlock applies immediately and buying twice doesn't duplicate", async () => {
    const first = await api("POST", "/api/store/buy", { itemId: themeId });
    assert.equal(first.status, 200);
    assert.equal(first.data.appliedImmediately, true);

    const second = await api("POST", "/api/store/buy", { itemId: themeId });
    assert.equal(second.status, 200);

    const matching = second.data.user.inventory.filter((inv) => inv.itemId === themeId);
    assert.equal(matching.length, 1, "Theme unlock should not be duplicated in inventory");
});

test("GET /api/store/inventory — reflects the purchases made so far", async () => {
    const { status, data } = await api("GET", "/api/store/inventory");
    assert.equal(status, 200);

    const potionEntry = data.inventory.find((inv) => inv.itemId === potionId);
    assert.ok(potionEntry);
    assert.equal(potionEntry.quantity, 2);

    assert.ok(!data.inventory.some((inv) => inv.itemId === freezeId));
    assert.equal(data.inventory.filter((inv) => inv.itemId === themeId).length, 1);
});

test("POST /api/store/use/:itemId — rejects using a permanent unlock", async () => {
    const { status, data } = await api("POST", `/api/store/use/${themeId}`);
    assert.equal(status, 400);
    assert.match(data.error, /permanent unlock/i);
});

test("POST /api/store/use/:itemId — 404 for an item not in inventory", async () => {
    const { status } = await api("POST", `/api/store/use/${freezeId}`);
    assert.equal(status, 404);
});

test("POST /api/store/use/:itemId — consumes one unit of a stacked potion", async () => {
    const { status, data } = await api("POST", `/api/store/use/${potionId}`);
    assert.equal(status, 200, `Expected 200, got ${status}: ${JSON.stringify(data)}`);
    assert.equal(data.remainingQuantity, 1);
    assert.equal(data.effect.type, "xp_multiplier");

    const invEntry = data.user.inventory.find((inv) => inv.itemId === potionId);
    assert.equal(invEntry.quantity, 1);
});

test("POST /api/store/use/:itemId — removes the inventory entry once quantity hits 0", async () => {
    const { status, data } = await api("POST", `/api/store/use/${potionId}`);
    assert.equal(status, 200);
    assert.equal(data.remainingQuantity, 0);
    assert.ok(!data.user.inventory.some((inv) => inv.itemId === potionId));
});

test("POST /api/store/use/:itemId — 404 once the item has been fully consumed", async () => {
    const { status } = await api("POST", `/api/store/use/${potionId}`);
    assert.equal(status, 404);
});