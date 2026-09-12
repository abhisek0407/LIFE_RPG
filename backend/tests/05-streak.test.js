import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { makeApiClient, ensureServerUp } from "./helpers/apiClient.js";
import { connectTestDB, disconnectTestDB } from "./helpers/db.js";
import User from "../models/userSchema.js";
import DailyQuest from "../models/dailyQuestSchema.js";
import ActivityLog from "../models/activityLogSchema.js";

const stamp = Date.now();
const testUser = {
    name: "Streak Test User",
    username: `streaktest_${stamp}`,
    email: `streaktest_${stamp}@example.com`,
    gender: "male",
    age: 21,
    profilePic: null,
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

function todayStr() {
    return new Date().toISOString().slice(0, 10);
}

test("GET /api/streaks — returns default streak state and a full 30-day zero heatmap before any activity", async () => {
    const { status, data } = await api("GET", "/api/streaks");

    assert.equal(status, 200, `Expected 200, got ${status}: ${JSON.stringify(data)}`);
    assert.equal(data.streak.currentStreak, 1, "New user should start with a streak of 1");
    assert.equal(data.streak.longestStreak, 1);
    assert.equal(data.streak.streakFreezesAvailable, 1);

    assert.ok(Array.isArray(data.heatmap));
    assert.equal(data.heatmap.length, 30, "Heatmap should always cover exactly 30 days");
    assert.ok(
        data.heatmap.every((day) => day.count === 0 && day.xpGained === 0 && day.goldGained === 0),
        "All days should be zero-activity before anything is completed"
    );

    const today = data.heatmap[data.heatmap.length - 1];
    assert.equal(today.date, todayStr(), "Last entry in the heatmap should be today");
});

test("GET /api/streaks — heatmap reflects activity after completing a daily quest", async () => {
    const created = await api("POST", "/api/daily-quests", {
        title: "Test streak habit",
        domain: "mental",
        xpReward: 15,
        goldReward: 5,
    });
    assert.equal(created.status, 201);
    dailyQuestId = created.data.dailyQuest._id;

    const completed = await api("PATCH", `/api/daily-quests/${dailyQuestId}/complete`);
    assert.equal(completed.status, 200);

    const { status, data } = await api("GET", "/api/streaks");
    assert.equal(status, 200);

    const today = data.heatmap.find((day) => day.date === todayStr());
    assert.ok(today, "Today should be present in the heatmap");
    assert.equal(today.count, 1, "One streak_checkin activity should have been logged today");
    assert.ok(today.xpGained > 0, "Today's xpGained should reflect the completed daily quest");
    assert.equal(today.goldGained, 5);
});

test("GET /api/streaks — only counts the requesting user's own activity", async () => {
   const otherUser = {
    name: "Other Streak User",
    username: `streakother_${stamp}`,
    email: `streakother_${stamp}@example.com`,
    gender: "female",
    age: 22,
    profilePic: null,
    password: "TestPassword123!",
};
    const otherClient = makeApiClient();
    const reg = await otherClient.api("POST", "/api/auth/register", otherUser, false);
    otherClient.setToken(reg.data.token);
    const otherId = reg.data.user._id;

    const { status, data } = await otherClient.api("GET", "/api/streaks");
    assert.equal(status, 200);

    const today = data.heatmap.find((day) => day.date === todayStr());
    assert.equal(today.count, 0, "A brand-new user should have no activity in the shared date bucket");

    // ── Cleanup for this ad-hoc second user ──
    await User.deleteOne({ _id: otherId });
});