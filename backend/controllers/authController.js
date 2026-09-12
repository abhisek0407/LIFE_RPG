import crypto from "crypto";
import User from "../models/userSchema.js";
import { generateToken, setTokenCookie } from "../utils/generateToken.js";

export async function register(req, res) {
  try {
    const { name, username, email, gender, age, profilePic, password } =
      req.body;

    if (
      !name ||
      !username ||
      !email ||
      !gender ||
      age === undefined ||
      age === null ||
      !password
    ) {
      return res.status(400).json({
        error: "Name, username, email, gender, age and password are required",
      });
    }

    const normalizedName = name.trim();
    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedName.length < 2) {
      return res.status(400).json({
        error: "Name must be at least 2 characters",
      });
    }

    if (normalizedName.length > 50) {
      return res.status(400).json({
        error: "Name cannot exceed 50 characters",
      });
    }

    if (normalizedUsername.length < 3) {
      return res.status(400).json({
        error: "Username must be at least 3 characters",
      });
    }

    if (normalizedUsername.length > 30) {
      return res.status(400).json({
        error: "Username cannot exceed 30 characters",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters",
      });
    }

    const numericAge = Number(age);

    if (!Number.isInteger(numericAge)) {
      return res.status(400).json({
        error: "Age must be a whole number",
      });
    }

    if (numericAge < 13 || numericAge > 120) {
      return res.status(400).json({
        error: "Age must be between 13 and 120",
      });
    }

    const validGenders = ["male", "female", "non-binary", "prefer_not_to_say"];

    if (!validGenders.includes(gender)) {
      return res.status(400).json({
        error: "Invalid gender",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
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

    const passwordHash = await User.hashPassword(password);

    const user = await User.create({
      name: normalizedName,
      username: normalizedUsername,
      email: normalizedEmail,
      gender,
      age: numericAge,
      profilePic: profilePic ? profilePic.trim() : null,
      passwordHash,
    });

    const token = generateToken(user._id.toString());

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

    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);

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
    const { token, password } = req.body;

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

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

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
export async function updateProfile(req, res) {
  try {
    const { name, username, gender, age, profilePic } = req.body;

    const user = req.user;
    const allowedFields = ["name", "username", "gender", "age", "profilePic"];

    const invalidFields = Object.keys(req.body).filter(
      (field) => !allowedFields.includes(field),
    );

    if (invalidFields.length > 0) {
      return res.status(400).json({
        error: `Cannot update field(s): ${invalidFields.join(", ")}`,
      });
    }

    if (name !== undefined) {
      const normalizedName = name.trim();

      if (normalizedName.length < 2) {
        return res.status(400).json({
          error: "Name must be at least 2 characters",
        });
      }

      if (normalizedName.length > 50) {
        return res.status(400).json({
          error: "Name cannot exceed 50 characters",
        });
      }

      user.name = normalizedName;
    }

    if (username !== undefined) {
      const normalizedUsername = username.trim();

      if (normalizedUsername.length < 3) {
        return res.status(400).json({
          error: "Username must be at least 3 characters",
        });
      }

      if (normalizedUsername.length > 30) {
        return res.status(400).json({
          error: "Username cannot exceed 30 characters",
        });
      }

      const existingUser = await User.findOne({
        username: normalizedUsername,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        return res.status(409).json({
          error: "Username already taken",
        });
      }

      user.username = normalizedUsername;
    }

    if (gender !== undefined) {
      const validGenders = [
        "male",
        "female",
        "non-binary",
        "prefer_not_to_say",
      ];

      if (!validGenders.includes(gender)) {
        return res.status(400).json({
          error: "Invalid gender",
        });
      }

      user.gender = gender;
    }

    if (age !== undefined) {
      const numericAge = Number(age);

      if (!Number.isInteger(numericAge)) {
        return res.status(400).json({
          error: "Age must be a whole number",
        });
      }

      if (numericAge < 13 || numericAge > 120) {
        return res.status(400).json({
          error: "Age must be between 13 and 120",
        });
      }

      user.age = numericAge;
    }

    if (profilePic !== undefined) {
      user.profilePic =
        profilePic === null || profilePic === "" ? null : profilePic.trim();
    }

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      user,
    });
  } catch (err) {
    console.error("Update profile error:", err);

    if (err.code === 11000) {
      return res.status(409).json({
        error: "Username already taken",
      });
    }

    if (err.name === "ValidationError") {
      const firstError = Object.values(err.errors)[0];

      return res.status(400).json({
        error: firstError.message,
      });
    }

    return res.status(500).json({
      error: "Failed to update profile",
    });
  }
}
