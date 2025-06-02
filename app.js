import "dotenv/config";
import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import { connectDB } from "./src/config/connect.js";
import { registerRoutes } from "./src/routes/index.js";

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);

    const app = Fastify({ logger: true });

    app.register(fastifyCors, {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
    });

    app.register(import("@fastify/multipart"));

    await registerRoutes(app);

    const PORT = process.env.PORT || 5001;
    const HOST = "0.0.0.0";

    app.listen({ port: PORT, host: HOST }, (err, address) => {
      if (err) {
        console.error("Server failed to start:", err);
        process.exit(1);
      }
      console.log(`🚀 Server running at ${address}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
};

start();
