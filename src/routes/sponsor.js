import { newSponsorCreation , getSponsors , updateSponsor} from "../controllers/sponsor/sponsor.js";
import { verifyToken } from "../middleware/auth.js";
import multer from "fastify-multer";
const upload = multer({ dest: "uploads/" });

export const sponsorRoutes = async (fastify, options) => {
  fastify.post("/create-new-sponsor", {
    preHandler: [verifyToken, upload.single("file")],
    handler: newSponsorCreation,
  });
  fastify.put("/update-sponsor/:_id", {
    preHandler: [verifyToken, upload.single("file")],
    handler: updateSponsor,
  });
  fastify.get("/get-sponsor", {
    preHandler: [verifyToken, upload.single("file")],
    handler: getSponsors,
  });
};
