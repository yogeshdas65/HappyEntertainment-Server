import {
  newPlantCreation,
  getPlantNames,
  getSinglePlant,
  getBillTypeChoice,
} from "../controllers/electricity/electricity.js";
import { verifyToken } from "../middleware/auth.js";

export const electricityRoutes = async (fastify, options) => {
  fastify.post("/create-new-plant", {
    preHandler: [verifyToken],
    handler: newPlantCreation,
  });
  fastify.get("/get-all-plants", {
    preHandler: [verifyToken],
    handler: getPlantNames,
  });
  fastify.get("/get-single-plants/:_id", {
    preHandler: [verifyToken],
    handler: getSinglePlant,
  });
  fastify.get("/get-bills-by-type-choice", {
    preHandler: [verifyToken],
    handler: getBillTypeChoice,
  });
};
