import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { makeApiClient, ensureServerUp } from "./helpers/apiClient.js";
import { connectTestDB, disconnectTestDB } from "./helpers/db.js";
import User from "../models/userSchema.js";
import DailyQuest from "../models/dailyQuestSchema.js";
import ActivityLog from "../models/activityLogSchema.js";

const stamp = Date.now();
const testUser = {
    username: `dailytest_${stamp}`,
    email: `dailytest_${stamp}@example.com`,
    password: "TestPassword123!",
};

const { api, setToken } = makeApiClient();
let userId = null;
let dailyQuestId = null;

before(async () => {
    await ensureServerUp();
    await connectTestDB();

    const reg = await api("POST", "/api/auth/register", testUser, false);
    setToken(reg.data.token);
    userId = reg.data.user._id;
});

after(async () => {
    // ── Cleanup: remove anything this file created ──
    await DailyQuest.deleteMany({ userId });
    await ActivityLog.deleteMany({ userId });
    await User.deleteOne({ _id: userId });
    await disconnectTestDB();
});

test("POST /api/daily-quests — creates a daily quest", async () => {
    const { status, data } = await api("POST", "/api/daily-quests", {
        title: "Drink 2L of water",
        domain: "health",
        xpReward: 15,
        goldReward: 5,
    });

    assert.equal(status, 201, `Expected 201, got ${status}: ${JSON.stringify(data)}`);
    assert.equal(data.dailyQuest.isCompletedToday, false);
    assert.equal(data.dailyQuest.streakDays, 0);

    dailyQuestId = data.dailyQuest._id;
});

test("POST /api/daily-quests — rejects missing domain", async () => {
    const { status } = await api("POST", "/api/daily-quests", { title: "No domain" });
    assert.equal(status, 400);
});

test("GET /api/daily-quests — lists daily quests", async () => {
    const { status, data } = await api("GET", "/api/daily-quests");
    assert.equal(status, 200);
    assert.ok(data.dailyQuests.some((d) => d._id === dailyQuestId));
});

test("PATCH /api/daily-quests/:id/complete — completes for today", async () => {
    const before = await api("GET", "/api/auth/me");
    const goldBefore = before.data.user.character.gold;

    const { status, data } = await api("PATCH", `/api/daily-quests/${dailyQuestId}/complete`);

    assert.equal(status, 200, `Expected 200, got ${status}: ${JSON.stringify(data)}`);
    assert.equal(data.dailyQuest.isCompletedToday, true);
    assert.equal(data.dailyQuest.streakDays, 1);
    assert.equal(data.user.character.gold, goldBefore + 5);
});

test("PATCH /api/daily-quests/:id/complete — rejects completing twice same day", async () => {
    const { status, data } = await api("PATCH", `/api/daily-quests/${dailyQuestId}/complete`);
    assert.equal(status, 400);
    assert.match(data.error, /already completed/i);
});

test("DELETE /api/daily-quests/:id — removes the daily quest", async () => {
    const { status } = await api("DELETE", `/api/daily-quests/${dailyQuestId}`);
    assert.equal(status, 200);
});

test("DELETE /api/daily-quests/:id — deleting again returns 404", async () => {
    const { status } = await api("DELETE", `/api/daily-quests/${dailyQuestId}`);
    assert.equal(status, 404);
});