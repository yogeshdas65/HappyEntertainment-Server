import { newArtistCreation , getArtist } from "../controllers/artist/artist.js";
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
    handler: getArtist,
  });
};
