import "dotenv/config";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import express from "express";
import "express-async-errors";
import { pool } from "./db/index.js";
import { logger } from "./utils/logger.js";
import authRoutes from "./api/routes/auth.js";
import userRoutes from "./api/routes/user.js";
import adminRoutes from "./api/routes/admin.js";
import rolesRoutes from "./api/routes/roles.js";
import letterRoutes from "./api/routes/letters.js";
import communityRoutes from "./api/routes/community.js";
import newsletterRoutes from "./api/routes/newsletters.js";
import blogRoutes from "./api/routes/blogs.js";
import faqRoutes from "./api/routes/faqs.js";
import feedbackRoutes from "./api/routes/feedback.js";
import mentorshipRoutes from "./api/routes/mentorship.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { rateLimit, getRateLimitStats } from "./middleware/rateLimit.js";
import { startEmailProcessor, getEmailQueueStatus } from "./utils/emailService.js";
import { startMentorshipReminder } from "./utils/mentorshipReminder.js";

const app = express();
const PORT = process.env.PORT || 5000;

// ========== Logging Middleware ==========
app.use((req: any, res: any, next) => {
  const startTime = Date.now();

  // Override res.json to capture response
  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    const duration = Date.now() - startTime;
    logger.request(req.method, req.path, res.statusCode, duration, req.user?.id, req.ip);
    return originalJson(body);
  };

  next();
});

// ========== Security & CORS Middleware ==========
// Helmet with reduced headers to avoid PDF.js issues
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposedHeaders: ["Content-Length", "Content-Type", "Content-Disposition"],
  })
);

// ========== Request Logging ==========
app.use(
  morgan((tokens, req, res) => {
    const message = [
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens["response-time"](req, res),
      "ms",
    ].join(" ");

    if (res.statusCode >= 400) {
      logger.warn(message, "HTTP");
    } else {
      logger.debug(message, "HTTP");
    }

    return message;
  })
);

// ========== Body Parsers ==========
app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ limit: "200mb", extended: true }));

// ========== Rate Limiting ==========
// Global rate limit: 100 requests per minute per IP
app.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  })
);

// ========== Health Check & Monitoring Endpoints ==========
app.get("/health", async (req, res) => {
  try {
    // Check database connection (try to get a connection without holding it)
    let dbConnected = false;
    try {
      const client = await pool.connect();
      client.release();
      dbConnected = true;
    } catch {
      dbConnected = false;
    }

    const emailQueueStatus = await getEmailQueueStatus();
    const rateLimitStatus = await getRateLimitStats();

    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        database: dbConnected ? "connected" : "disconnected",
        email_queue: emailQueueStatus,
        rate_limit: rateLimitStatus,
      },
    });
  } catch (error) {
    logger.error("Health check failed", "HEALTH", error as Error);
    res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: "One or more services are unavailable",
    });
  }
});

// ========== API Routes ==========
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", rolesRoutes);
app.use("/api/newsletters", newsletterRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/letters", letterRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/faqs", faqRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/mentorship", mentorshipRoutes);

// ========== 404 Handler ==========
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    error: {
      code: "NOT_FOUND",
      message: "Endpoint not found",
    },
    timestamp: new Date().toISOString(),
  });
});

// ========== Global Error Handler (Must be last) ==========
app.use(errorHandler);

// ========== Server Startup ==========
let server: any;

try {
  server = app.listen(PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT}`, "SERVER");
    logger.info(`📝 API Documentation: http://localhost:${PORT}/api/docs`, "SERVER");
    logger.info(`❤️ Health Check: http://localhost:${PORT}/health`, "SERVER");

    // Initialize background services
    try {
      startEmailProcessor();
    } catch (emailError) {
      logger.warn("Failed to start email processor, continuing without it", "SERVER");
    }

    try {
      startMentorshipReminder();
    } catch (reminderError) {
      logger.warn("Failed to start mentorship reminder service, continuing without it", "SERVER");
    }

    logger.info(`Environment: ${process.env.NODE_ENV || "development"}`, "SERVER");
    logger.info(`Log Level: ${process.env.LOG_LEVEL || "INFO"}`, "SERVER");
  });

  server.on("error", (err: any) => {
    console.error("Server error:", err?.message || err);
    if (err?.code === "EADDRINUSE") {
      console.error(`❌ Port ${PORT} is already in use`);
      process.exit(1);
    }
  });
} catch (error: any) {
  console.error("Failed to start server:", error?.message || error);
  process.exit(1);
}

// ========== Graceful Shutdown ==========
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} signal received: closing HTTP server`, "SERVER");

  if (!server) {
    logger.info("Server not running, exiting", "SERVER");
    process.exit(0);
  }

  server.close(async () => {
    logger.info("HTTP server closed", "SERVER");

    // Close database connections
    try {
      await pool.end();
      logger.info("Database pool closed", "DATABASE");
    } catch (error) {
      logger.error("Error closing database pool", "DATABASE", error as Error);
    }

    logger.info("Graceful shutdown complete", "SERVER");
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error("Forced shutdown - graceful shutdown took too long", "SERVER");
    process.exit(1);
  }, 30 * 1000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error: any) => {
  try {
    const message = error?.message || String(error) || "Unknown error";
    console.error("❌ Uncaught exception:", message);
    console.error("Stack:", error?.stack);
    logger.error("Uncaught exception", "EXCEPTION", error as Error);
  } catch (e) {
    console.error("❌ Fatal error (unable to parse):", error);
  }
  process.exit(1);
});

// Handle unhandled rejections
process.on("unhandledRejection", (reason: any, promise) => {
  try {
    const message = reason?.message || String(reason) || "Unknown reason";
    console.error("❌ Unhandled rejection:", message);
    logger.error(`Unhandled rejection at ${promise}`, "PROMISE", new Error(message));
  } catch (e) {
    console.error("❌ Fatal error (unable to parse):", reason);
  }
  process.exit(1);
});
