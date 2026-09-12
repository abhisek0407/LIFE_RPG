import crypto from "crypto";
import User from "../models/userSchema.js";
import {
    generateToken,
    setTokenCookie,
} from "../utils/generateToken.js";


export async function register(req, res) {
    try {
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({
                error: "All fields are required",
            });
        }

        if (username.length < 3) {
            return res.status(400).json({
                error: "Username must be at least 3 characters",
            });
        }

        if (username.length > 30) {
            return res.status(400).json({
                error: "Username cannot exceed 30 characters",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: "Password must be at least 6 characters",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedUsername = username.trim();

        // Check duplicate email / username
        const existingUser = await User.findOne({
            $or: [
                { email: normalizedEmail },
                { username: normalizedUsername },
            ],
        });

        if (existingUser) {
            if (existingUser.email === normalizedEmail) {
                return res.status(409).json({
                    error: "Email already registered",
                });
            }

            return res.status(409).json({
                error: "Username already taken",
            });
        }

        // Hash password
        const passwordHash = await User.hashPassword(password);

        // Create user
        // Mongoose automatically applies all defaults
        const user = await User.create({
            username: normalizedUsername,
            email: normalizedEmail,
            passwordHash,
        });

        // Generate JWT
        const token = generateToken(user._id.toString());

        // Set httpOnly cookie
        setTokenCookie(res, token);

        return res.status(201).json({
            token,
            user,
        });

    } catch (err) {
        console.error("Register error:", err);

        // Handle MongoDB duplicate-key race condition
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern || {})[0];

            return res.status(409).json({
                error:
                    field === "email"
                        ? "Email already registered"
                        : "Username already taken",
            });
        }

        return res.status(500).json({
            error: "Registration failed",
        });
    }
}



export async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password are required",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({
            email: normalizedEmail,
        });

        if (!user) {
            return res.status(401).json({
                error: "Invalid email or password",
            });
        }

        const passwordMatch = await user.comparePassword(password);

        if (!passwordMatch) {
            return res.status(401).json({
                error: "Invalid email or password",
            });
        }

        const token = generateToken(user._id.toString());

        setTokenCookie(res, token);

        return res.status(200).json({
            token,
            user,
        });

    } catch (err) {
        console.error("Login error:", err);

        return res.status(500).json({
            error: "Login failed",
        });
    }
}


export async function getMe(req, res) {
    try {
        return res.status(200).json({
            user: req.user,
        });
    } catch (err) {
        console.error("Get me error:", err);

        return res.status(500).json({
            error: "Failed to get user",
        });
    }
}



export async function logout(req, res) {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });

    return res.status(200).json({
        message: "Logged out successfully",
    });
}


export async function forgotPassword(req, res) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                error: "Email is required",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({
            email: normalizedEmail,
        });
        if (!user) {
            return res.status(200).json({
                message:
                    "If an account exists with this email, a password reset link has been sent.",
            });
        }

 
        const resetToken = crypto.randomBytes(32).toString("hex");

        const hashedResetToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        user.resetPasswordToken = hashedResetToken;

        user.resetPasswordExpires =
            new Date(Date.now() + 15 * 60 * 1000);

        await user.save();


        return res.status(200).json({
            message:
                "If an account exists with this email, a password reset link has been sent.",

            resetToken,
        });

    } catch (err) {
        console.error("Forgot password error:", err);

        return res.status(500).json({
            error: "Failed to process password reset request",
        });
    }
}



export async function resetPassword(req, res) {
    try {
        const {
            token,
            password,
        } = req.body;

        if (!token || !password) {
            return res.status(400).json({
                error: "Token and new password are required",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: "Password must be at least 6 characters",
            });
        }

        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: {
                $gt: new Date(),
            },
        });

        if (!user) {
            return res.status(400).json({
                error: "Invalid or expired reset token",
            });
        }

        user.passwordHash = await User.hashPassword(password);

        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;

        await user.save();

        const authToken = generateToken(user._id.toString());

        setTokenCookie(res, authToken);

        return res.status(200).json({
            message: "Password reset successfully",
            token: authToken,
            user,
        });

    } catch (err) {
        console.error("Reset password error:", err);

        return res.status(500).json({
            error: "Failed to reset password",
        });
    }
}