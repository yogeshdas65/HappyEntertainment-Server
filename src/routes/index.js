import { authRoutes } from "./auth.js";
import { electricityRoutes } from "./electricity.js";

const prefix = "/api";

export const registerRoutes = async (fastify) => {
  fastify.register(authRoutes, { prefix });
  fastify.register(electricityRoutes, { prefix });
};
