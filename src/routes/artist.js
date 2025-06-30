import {
  newArtistCreation,
  getArtistList,
  getPaymentsOfSingleEventOfArtist,
  getArtistEventList
} from "../controllers/artist/artist.js";
import { verifyToken } from "../middleware/auth.js";
import multer from "fastify-multer";
const upload = multer({ dest: "uploads/" });

export const artistRoutes = async (fastify, options) => {
  fastify.post("/create-new-artist", {
    preHandler: [verifyToken, upload.single("file")],
    handler: newArtistCreation,
  });
  
  fastify.get("/get-artist", {
    preHandler: [verifyToken, upload.single("file")],
    handler: getArtistList,
  });

  fastify.get("/get-artist-events", {
    preHandler: [verifyToken, upload.single("file")],
    handler: getArtistEventList,
  });

  fastify.get("/get-events-artist-payment", {
    preHandler: [verifyToken, upload.single("file")],
    handler: getPaymentsOfSingleEventOfArtist,
  });
};
