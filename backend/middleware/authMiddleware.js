import jwt from "jsonwebtoken";
import User from "../models/userSchema.js";

export async function protect(req, res, next) {
    try {
        let token;

        if (req.headers.authorization?.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }
       
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

        req.user = user; 
        next();
    } catch (err) {
        return res.status(401).json({ error: "Not authorized — invalid token" });
    }
}