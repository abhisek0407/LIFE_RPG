import "dotenv/config";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { makeApiClient, ensureServerUp } from "./helpers/apiClient.js";
import { connectTestDB, disconnectTestDB } from "./helpers/db.js";
import User from "../models/userSchema.js";

const stamp = Date.now();

const testUser = {
    name: "AI Test User",
    username: `aitest_${stamp}`,
    email: `aitest_${stamp}@example.com`,
    gender: "male",
    age: 21,
    profilePic: null,
    password: "TestPassword123!",
};

const { api, setToken } = makeApiClient();
let userId = null;

before(async () => {
    await ensureServerUp();
    await connectTestDB();

    const reg = await api("POST", "/api/auth/register", testUser, false);

    setToken(reg.data.token);
    userId = reg.data.user._id;
});

after(async () => {
    await User.deleteOne({ _id: userId });
    await disconnectTestDB();
});


test("POST /api/ai/decompose — requires authentication", async () => {
    const { status } = await api(
        "POST",
        "/api/ai/decompose",
        {
            description: "test",
            domain: "health",
        },
        false
    );

    assert.equal(status, 401);
});


test("POST /api/ai/decompose — rejects a missing description", async () => {
    const { status } = await api(
        "POST",
        "/api/ai/decompose",
        {
            domain: "health",
        }
    );

    assert.equal(status, 400);
});


test("POST /api/ai/decompose — rejects an invalid domain", async () => {
    const { status } = await api(
        "POST",
        "/api/ai/decompose",
        {
            description: "Clean the garage",
            domain: "bogus",
        }
    );

    assert.equal(status, 400);
});


test("POST /api/ai/decompose — breaks a task into 4-6 well-formed microtasks", async () => {
    const { status, data } = await api(
        "POST",
        "/api/ai/decompose",
        {
            description: "Clean and organize the garage",
            domain: "health",
            motivationLevel: "low",
        }
    );

    // PRINT ACTUAL AI RESPONSE
    console.log("\n========================================");
    console.log("🤖 AI DECOMPOSE RESPONSE");
    console.log("========================================");
    console.dir(data, { depth: null });
    console.log("========================================\n");

    assert.equal(
        status,
        200,
        `Expected 200, got ${status}: ${JSON.stringify(data)}`
    );

    assert.ok(
        ["gemini", "rule-based"].includes(data.source),
        `Unexpected source: ${data.source}`
    );

    assert.equal(data.domain, "health");
    assert.equal(data.motivationLevel, "low");

    assert.ok(Array.isArray(data.microtasks));

    assert.ok(
        data.microtasks.length >= 4 &&
        data.microtasks.length <= 6,
        `Expected 4-6 microtasks, got ${data.microtasks.length}`
    );

    let expectedXp = 0;
    let expectedGold = 0;

    for (const mt of data.microtasks) {
        assert.equal(typeof mt.title, "string");

        assert.ok(
            mt.title.trim().length > 0,
            "Microtask title should not be empty"
        );

        assert.ok(
            Number.isFinite(mt.xpReward) && mt.xpReward > 0,
            "xpReward should be a positive number"
        );

        assert.ok(
            Number.isFinite(mt.goldReward) && mt.goldReward >= 0,
            "goldReward should be non-negative"
        );

        expectedXp += mt.xpReward;
        expectedGold += mt.goldReward;
    }

    assert.equal(
        data.totalXp,
        expectedXp,
        "totalXp should equal the sum of microtask xpRewards"
    );

    assert.equal(
        data.totalGold,
        expectedGold,
        "totalGold should equal the sum of microtask goldRewards"
    );
});


test("POST /api/ai/decompose — defaults motivationLevel to medium when omitted", async () => {
    const { status, data } = await api(
        "POST",
        "/api/ai/decompose",
        {
            description: "Read a chapter of a book",
            domain: "skill",
        }
    );

    // PRINT ACTUAL RESPONSE
    console.log("\n========================================");
    console.log("🤖 AI DECOMPOSE RESPONSE - DEFAULT MOTIVATION");
    console.log("========================================");
    console.dir(data, { depth: null });
    console.log("========================================\n");

    assert.equal(status, 200);
    assert.equal(data.motivationLevel, "medium");
});


test("POST /api/ai/feel-stuck — requires authentication", async () => {
    const { status } = await api(
        "POST",
        "/api/ai/feel-stuck",
        {
            domain: "mental",
        },
        false
    );

    assert.equal(status, 401);
});


test("POST /api/ai/feel-stuck — returns a breathing exercise and grounding microtasks", async () => {
    const { status, data } = await api(
        "POST",
        "/api/ai/feel-stuck",
        {
            domain: "mental",
        }
    );

    // PRINT ACTUAL AI RESPONSE
    console.log("\n========================================");
    console.log("🧠 AI FEEL-STUCK RESPONSE");
    console.log("========================================");
    console.dir(data, { depth: null });
    console.log("========================================\n");

    assert.equal(
        status,
        200,
        `Expected 200, got ${status}: ${JSON.stringify(data)}`
    );

    assert.ok(
        ["gemini", "rule-based"].includes(data.source)
    );

    assert.ok(
        Array.isArray(data.breathingExercise?.steps)
    );

    assert.ok(
        data.breathingExercise.steps.length > 0
    );

    assert.equal(
        typeof data.breathingExercise.name,
        "string"
    );

    assert.ok(
        Array.isArray(data.groundingMicrotasks)
    );

    assert.ok(
        data.groundingMicrotasks.length > 0
    );

    for (const mt of data.groundingMicrotasks) {
        assert.equal(typeof mt.title, "string");

        assert.ok(
            Number.isFinite(mt.xpReward) && mt.xpReward > 0
        );

        assert.ok(
            Number.isFinite(mt.goldReward) && mt.goldReward >= 0
        );
    }

    assert.equal(
        typeof data.encouragement,
        "string"
    );

    assert.ok(
        data.encouragement.trim().length > 0
    );
});


test("POST /api/ai/feel-stuck — works with no body / no domain at all", async () => {
    const { status, data } = await api(
        "POST",
        "/api/ai/feel-stuck",
        {}
    );

    // PRINT ACTUAL RESPONSE
    console.log("\n========================================");
    console.log("🧠 AI FEEL-STUCK RESPONSE - NO BODY");
    console.log("========================================");
    console.dir(data, { depth: null });
    console.log("========================================\n");

    assert.equal(
        status,
        200,
        `Expected 200, got ${status}: ${JSON.stringify(data)}`
    );

    assert.ok(
        Array.isArray(data.groundingMicrotasks)
    );
});