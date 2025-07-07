import {
  newPropertyCreation,
  updateProperty,
  getallProperty,
  makePayment,
  generateMonthlyBill
} from "../controllers/property/property.js";
import { verifyToken } from "../middleware/auth.js";
import multer from "fastify-multer";
const upload = multer({ dest: "uploads/" });

export const propertyRoutes = async (fastify, options) => {
  fastify.post("/create-new-property", {
    preHandler: [verifyToken, upload.single("file")],
    handler: newPropertyCreation,
  });
  fastify.put("/update-property/:_id", {
    preHandler: [verifyToken, upload.single("file")],
    handler: updateProperty,
  });
  fastify.get("/get-property", {
    preHandler: [verifyToken],
    handler: getallProperty,
  });
  fastify.post("/create-new-monthly-bill", {
    preHandler: [verifyToken, upload.single("file")],
    handler: generateMonthlyBill,
  });
  fastify.post("/make-payment-for-property", {
    preHandler: [verifyToken, upload.single("file")],
    handler: makePayment,
  });
};
