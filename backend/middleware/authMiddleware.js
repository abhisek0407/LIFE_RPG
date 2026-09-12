import jwt from "jsonwebtoken";
import User from "../models/userSchema.js";

export async function protect(req, res, next) {
    try {
        let token;

        // 1. Bearer header
        if (req.headers.authorization?.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }
        // 2. httpOnly cookie
        else if (req.cookies?.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({ error: "Not authorized — no token" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ error: "Not authorized — user not found" });
        }

        req.user = user; // full user doc available in all protected routes
        next();
    } catch (err) {
        return res.status(401).json({ error: "Not authorized — invalid token" });
    }
}