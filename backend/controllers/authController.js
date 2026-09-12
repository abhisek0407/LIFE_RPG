import User from "../models/userSchema.js";
import { generateToken, setTokenCookie } from "../utils/generateToken.js";

// ── POST /api/auth/register ──────────────────────────────────
export async function register(req, res) {
    try {
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }
        if (username.length < 3) {
            return res.status(400).json({ error: "Username must be at least 3 characters" });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters" });
        }

        // Check duplicates
        const existingUser = await User.findOne({
            $or: [{ email: email.toLowerCase() }, { username }],
        });
        if (existingUser) {
            return res.status(409).json({
                error: existingUser.email === email.toLowerCase()
                    ? "Email already registered"
                    : "Username already taken",
            });
        }

        // Create user (password hashed by User.hashPassword static)
        const passwordHash = await User.hashPassword(password);
        const user = await User.create({ username, email, passwordHash });

        const token = generateToken(user._id);
        setTokenCookie(res, token);

        // Spec: 201 with token + user (passwordHash auto-stripped by toJSON)
        return res.status(201).json({ token, user });
    } catch (err) {
        console.error("Register error:", err);
        return res.status(500).json({ error: "Registration failed" });
    }
}

// ── POST /api/auth/login ─────────────────────────────────────
export async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const token = generateToken(user._id);
        setTokenCookie(res, token);

        return res.status(200).json({ token, user });
    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ error: "Login failed" });
    }
}

// ── GET /api/auth/me ─────────────────────────────────────────
export async function getMe(req, res) {
    return res.status(200).json({ user: req.user });
}

// ── POST /api/auth/logout ────────────────────────────────────
export async function logout(req, res) {
    res.clearCookie("token");
    return res.status(200).json({ message: "Logged out successfully" });
}