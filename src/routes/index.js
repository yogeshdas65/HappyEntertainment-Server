import { authRoutes } from "./auth.js";
import { electricityRoutes } from "./electricity.js";
import { propertyRoutes } from "./property.js";

const prefix = "/api";

export const registerRoutes = async (fastify) => {
  fastify.register(authRoutes, { prefix });
  fastify.register(electricityRoutes, { prefix });
  fastify.register(propertyRoutes, { prefix });
};
