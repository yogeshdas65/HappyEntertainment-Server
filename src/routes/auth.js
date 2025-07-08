import {
  createUser,
  login,
  refreshToken,
  fetchUser,
  fetchEmployee,
  changePassword,
} from "../controllers/auth/auth.js";
import { verifyToken } from "../middleware/auth.js";
import multer from "fastify-multer";
const upload = multer({ dest: "uploads/" });

export const authRoutes = async (fastify, options) => {
  fastify.post("/login", login);
  fastify.post("/createuser", createUser);
  fastify.get("/fetch-employee", {
    preHandler: [verifyToken],
    handler: fetchEmployee,
  });
  fastify.put("/change-password", {
    preHandler: [verifyToken, upload.single("file")],
    handler: changePassword,
  });
  fastify.post("/refresh-token", refreshToken);
  fastify.get("/user", { preHandler: [verifyToken], handler: fetchUser });
};
