import jwt from "jsonwebtoken";

export const verifyToken = (req, reply, done) => {
    try {
        const authHeader = req.headers["authorization"] || req.headers["Authorization"];
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return reply.status(401).send({ message: "Access token required" });
        }
        const token = authHeader.split(" ")[1];
        if (!process.env.ACCESS_TOKEN_SECRET) {
            return reply.status(500).send({ message: "Server error: Missing access token secret" });
        }
        // Verify the token
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        console.log("Token verification successful:", decoded);
        // Set req.user and signal Fastify to continue
        req.user = decoded;
        // Return here to pass control to the next handler
        done()
        // return true
    } catch (err) {
        console.error("Token verification failed:", err.message);
        return reply.status(403).send({ message: "Invalid or expired token" });
    }
};
