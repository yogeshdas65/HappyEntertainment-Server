import { newEventCreation , getEvents, getPaymentsOfSingleEvent } from "../controllers/events/events.js";
import { verifyToken } from "../middleware/auth.js";
import multer from "fastify-multer";
const upload = multer({ dest: "uploads/" });

export const eventsRoutes = async (fastify, options) => {
  fastify.post("/create-new-event", {
    preHandler: [verifyToken, upload.single("file")],
    handler: newEventCreation,
  });
  fastify.get("/get-events", {
    preHandler: [verifyToken, upload.single("file")],
    handler: getEvents,
  });
  fastify.get("/get-events-payment", {
    preHandler: [verifyToken, upload.single("file")],
    handler: getPaymentsOfSingleEvent,
  });
};
