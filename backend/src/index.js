import app from "./app.js";
import config from "./config.js";
import { getPrisma } from "./lib/prisma.js";

async function start() {
  try {
    // Test database connection
    await getPrisma().$connect();
    console.log("✓ Database connected successfully");

    // Start server
    const server = app.listen(config.port, () => {
      console.log(`✓ Server running on port ${config.port}`);
      console.log(`✓ Environment: ${config.nodeEnv}`);
      console.log(`✓ API prefix: ${config.apiPrefix}`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await getPrisma().$disconnect();
        console.log("Database disconnected");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("Failed to start server:", error);
    await getPrisma().$disconnect();
    process.exit(1);
  }
}

start();
