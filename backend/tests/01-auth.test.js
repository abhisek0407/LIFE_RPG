import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { makeApiClient, ensureServerUp } from "./helpers/apiClient.js";
import { connectTestDB, disconnectTestDB } from "./helpers/db.js";
import User from "../models/userSchema.js";

const stamp = Date.now();
const testUser = {
    name: "Auth Test User",
    username: `authtest_${stamp}`,
    email: `authtest_${stamp}@example.com`,
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
});

after(async () => {
    // ── Cleanup: remove the user this file created ──
    if (userId) {
        await User.deleteOne({ _id: userId });
    }
    await disconnectTestDB();
});

test("POST /api/auth/register — creates a new user", async () => {
    const { status, data } = await api("POST", "/api/auth/register", testUser, false);

    assert.equal(status, 201, `Expected 201, got ${status}: ${JSON.stringify(data)}`);
    assert.ok(data.token, "Response should include a token");
    assert.ok(data.user, "Response should include a user");
    assert.equal(data.user.username, testUser.username);
    assert.equal(data.user.email, testUser.email);
    assert.equal(data.user.passwordHash, undefined, "passwordHash must never be returned");
    assert.equal(data.user.character.gold, 50, "New user should start with 50 gold");
    assert.equal(data.user.domains.health.level, 1);

    setToken(data.token);
    userId = data.user._id;
});

test("POST /api/auth/register — rejects duplicate email", async () => {
    const { status, data } = await api("POST", "/api/auth/register", testUser, false);
    assert.equal(status, 409, `Expected 409 for duplicate email, got ${status}`);
    assert.ok(data.error);
});

test("POST /api/auth/login — wrong password is rejected", async () => {
    const { status } = await api(
        "POST",
        "/api/auth/login",
        { email: testUser.email, password: "WrongPassword!" },
        false
    );
    assert.equal(status, 401);
});

test("POST /api/auth/login — logs in with correct credentials", async () => {
    const { status, data } = await api(
        "POST",
        "/api/auth/login",
        { email: testUser.email, password: testUser.password },
        false
    );
    assert.equal(status, 200);
    assert.ok(data.token);
    setToken(data.token); // refresh token from login
});

test("GET /api/auth/me — rejects request with no token", async () => {
    const { status } = await api("GET", "/api/auth/me", null, false);
    assert.equal(status, 401);
});

test("GET /api/auth/me — returns the logged-in user", async () => {
    const { status, data } = await api("GET", "/api/auth/me");
    assert.equal(status, 200);
    assert.equal(data.user._id, userId);
    assert.equal(data.user.email, testUser.email);
});
test("PATCH /api/auth/profile — updates editable profile fields", async () => {
    const { status, data } = await api("PATCH", "/api/auth/profile", {
        name: "Updated Test User",
        username: `updated_${stamp}`,
        gender: "female",
        age: 25,
        profilePic: "https://example.com/profile.jpg",
    });

    assert.equal(
        status,
        200,
        `Expected 200, got ${status}: ${JSON.stringify(data)}`
    );

    assert.equal(data.user.name, "Updated Test User");
    assert.equal(data.user.username, `updated_${stamp}`);
    assert.equal(data.user.email, testUser.email);
    assert.equal(data.user.gender, "female");
    assert.equal(data.user.age, 25);
    assert.equal(
        data.user.profilePic,
        "https://example.com/profile.jpg"
    );
});
test("PATCH /api/auth/profile — rejects email modification", async () => {
    const { status, data } = await api(
        "PATCH",
        "/api/auth/profile",
        {
            email: "attacker@example.com",
        }
    );

    assert.equal(status, 400);
    assert.match(data.error, /email/i);
});
test("PATCH /api/auth/profile — requires authentication", async () => {
    const { status } = await api(
        "PATCH",
        "/api/auth/profile",
        {
            name: "Should Not Work",
        },
        false
    );

    assert.equal(status, 401);
});