import {
  createUser,
  login,
  refreshToken,
  fetchUser,
  fetchEmployee,
} from "../controllers/auth/auth.js";
import { verifyToken } from "../middleware/auth.js";

export const authRoutes = async (fastify, options) => {
  fastify.post("/login", login);
  fastify.post("/createuser", createUser);
  fastify.get("/fetch-employee", {
    preHandler: [verifyToken],
    handler: fetchEmployee,
  });
  fastify.post("/refresh-token", refreshToken);
  fastify.get("/user", { preHandler: [verifyToken], handler: fetchUser });
};
