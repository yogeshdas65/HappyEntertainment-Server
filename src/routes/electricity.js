import {
  newPlantCreation,
  getPlantNames,
  getSinglePlant,
  getBillTypeChoice,
  addBillForPlant,
  uploadPaymentScreenShot,
} from "../controllers/electricity/electricity.js";
import { verifyToken } from "../middleware/auth.js";
import multer from "fastify-multer";
const upload = multer({ dest: "uploads/" });

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
  fastify.post("/add-bill-by-billtype", {
    preHandler: [verifyToken, upload.single("file")],
    handler: addBillForPlant,
  });
  fastify.post("/upload-payment-screenshot", {
    preHandler: [verifyToken, upload.single("file")],
    handler: uploadPaymentScreenShot,
  });
};
