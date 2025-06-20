import {
  newEventCreation,
  getEvents,
  getPaymentsOfSingleEvent,
  updateArtistPaymentOfEvent,
  updateSponsorPaymentOfEvent
} from "../controllers/events/events.js";
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
  fastify.put("/update-artist-events-payment", {
    preHandler: [verifyToken, upload.single("file")],
    handler: updateArtistPaymentOfEvent,
  });
  fastify.put("/update-sponsor-events-payment", {
    preHandler: [verifyToken, upload.single("file")],
    handler: updateSponsorPaymentOfEvent,
  });
};
