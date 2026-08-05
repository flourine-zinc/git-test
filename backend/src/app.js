import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import config from "./config.js";
import errorHandler from "./middlewares/errorHandler.js";
import { generalLimiter } from "./middlewares/rateLimiter.js";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import todoRoutes from "./routes/todoRoutes.js";
import focusRoutes from "./routes/focusRoutes.js";
import missionRoutes from "./routes/missionRoutes.js";
import achievementRoutes from "./routes/achievementRoutes.js";
import xpRoutes from "./routes/xpRoutes.js";

const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

// CORS
app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  }),
);

// Logging
if (config.nodeEnv !== "test") {
  app.use(morgan("dev"));
}

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting
app.use(config.apiPrefix, generalLimiter);

// Health check
app.get(`${config.apiPrefix}/health`, (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Routes
app.use(`${config.apiPrefix}/auth`, authRoutes);
app.use(`${config.apiPrefix}/todos`, todoRoutes);
app.use(`${config.apiPrefix}/focus`, focusRoutes);
app.use(`${config.apiPrefix}/missions`, missionRoutes);
app.use(`${config.apiPrefix}/achievements`, achievementRoutes);
app.use(`${config.apiPrefix}/xp`, xpRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.originalUrl} not found`,
      statusCode: 404,
    },
  });
});

// Error handler
app.use(errorHandler);

export default app;
