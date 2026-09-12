import jwt from "jsonwebtoken";

export function generateToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });
}

export function setTokenCookie(res, token) {
    res.cookie("token", token, {
        httpOnly: true,        // not readable by JS (XSS protection)
        secure: process.env.NODE_ENV === "production", // https only in prod
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
}