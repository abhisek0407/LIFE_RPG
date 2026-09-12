import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { makeApiClient, ensureServerUp } from "./helpers/apiClient.js";
import { connectTestDB, disconnectTestDB } from "./helpers/db.js";
import User from "../models/userSchema.js";
import Quest from "../models/questSchema.js";
import ActivityLog from "../models/activityLogSchema.js";

const stamp = Date.now();
const testUser = {
    name: "Quest Test User",
    username: `questtest_${stamp}`,
    email: `questtest_${stamp}@example.com`,
    gender: "male",
    age: 21,
    profilePic: null,
    password: "TestPassword123!",
};

const strangerUser = {
    name: "Stranger Test User",
    username: `stranger_${stamp}`,
    email: `stranger_${stamp}@example.com`,
    gender: "female",
    age: 22,
    profilePic: null,
    password: "TestPassword123!",
};

const { api, setToken } = makeApiClient();
const strangerClient = makeApiClient();

let userId = null;
let strangerId = null;
let questId = null;
let microtaskId = null;

before(async () => {
    await ensureServerUp();
    await connectTestDB();

    const reg = await api("POST", "/api/auth/register", testUser, false);
    setToken(reg.data.token);
    userId = reg.data.user._id;

    const regStranger = await strangerClient.api("POST", "/api/auth/register", strangerUser, false);
    strangerClient.setToken(regStranger.data.token);
    strangerId = regStranger.data.user._id;
});

after(async () => {
    // ── Cleanup: remove anything this file created ──
    await Quest.deleteMany({ userId: { $in: [userId, strangerId] } });
    await ActivityLog.deleteMany({ userId: { $in: [userId, strangerId] } });
    await User.deleteMany({ _id: { $in: [userId, strangerId] } });
    await disconnectTestDB();
});

test("POST /api/quests — creates a quest with microtasks", async () => {
    const { status, data } = await api("POST", "/api/quests", {
        title: "Automated Test Quest",
        domain: "health",
        difficulty: "medium",
        motivationLevel: "medium",
        microtasks: [
            { title: "Step 1", xpReward: 20, goldReward: 5 },
            { title: "Step 2", xpReward: 30, goldReward: 10 },
        ],
    });

    assert.equal(status, 201, `Expected 201, got ${status}: ${JSON.stringify(data)}`);
    assert.equal(data.quest.totalXp, 50, "totalXp should be computed server-side");
    assert.equal(data.quest.totalGold, 15);
    assert.equal(data.quest.microtasks.length, 2);
    assert.equal(data.quest.status, "active");

    questId = data.quest._id;
    microtaskId = data.quest.microtasks[0]._id;
});

test("POST /api/quests — rejects missing title", async () => {
    const { status } = await api("POST", "/api/quests", {
        domain: "health",
        microtasks: [{ title: "x", xpReward: 10, goldReward: 5 }],
    });
    assert.equal(status, 400);
});

test("POST /api/quests — rejects empty microtasks array", async () => {
    const { status } = await api("POST", "/api/quests", {
        title: "No tasks",
        domain: "health",
        microtasks: [],
    });
    assert.equal(status, 400);
});

test("GET /api/quests — lists the created quest", async () => {
    const { status, data } = await api("GET", "/api/quests?status=active");
    assert.equal(status, 200);
    assert.ok(Array.isArray(data.quests));
    assert.ok(data.quests.some((q) => q._id === questId));
});

test("GET /api/quests/:id — fetches single quest", async () => {
    const { status, data } = await api("GET", `/api/quests/${questId}`);
    assert.equal(status, 200);
    assert.equal(data.quest._id, questId);
});

test("PATCH .../microtasks/:id/complete — awards XP and gold", async () => {
    const before = await api("GET", "/api/auth/me");
    const goldBefore = before.data.user.character.gold;
    const xpBefore = before.data.user.domains.health.currentXp;

    const { status, data } = await api(
        "PATCH",
        `/api/quests/${questId}/microtasks/${microtaskId}/complete`
    );

    assert.equal(status, 200, `Expected 200, got ${status}: ${JSON.stringify(data)}`);
    assert.equal(data.quest.microtasks[0].isCompleted, true);
    assert.ok(data.progression.xpAwarded >= 20, "Should award at least the base XP");
    assert.equal(data.user.character.gold, goldBefore + 5, "Gold should increase by goldReward");
    assert.ok(
        data.user.domains.health.currentXp > xpBefore || data.user.domains.health.level > 1,
        "Health domain XP or level should increase"
    );
});

test("PATCH .../complete — rejects completing the same microtask twice", async () => {
    const { status, data } = await api(
        "PATCH",
        `/api/quests/${questId}/microtasks/${microtaskId}/complete`
    );
    assert.equal(status, 400);
    assert.match(data.error, /already completed/i);
});

test("PATCH .../complete — completing the last microtask marks quest completed", async () => {
    const { data: questData } = await api("GET", `/api/quests/${questId}`);
    const secondMicrotaskId = questData.quest.microtasks[1]._id;

    const { status, data } = await api(
        "PATCH",
        `/api/quests/${questId}/microtasks/${secondMicrotaskId}/complete`
    );

    assert.equal(status, 200);
    assert.equal(data.questCompleted, true);
    assert.equal(data.quest.status, "completed");
});

test("Second user cannot see or modify first user's quest", async () => {
    const { status } = await strangerClient.api("GET", `/api/quests/${questId}`);
    assert.equal(status, 404, "Quest belonging to another user must return 404");
});

test("DELETE /api/quests/:id — removes the test quest", async () => {
    const { status } = await api("DELETE", `/api/quests/${questId}`);
    assert.equal(status, 200);
});

test("GET /api/quests/:id — deleted quest returns 404", async () => {
    const { status } = await api("GET", `/api/quests/${questId}`);
    assert.equal(status, 404);
});