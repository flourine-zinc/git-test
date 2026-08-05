import { AppError } from "../utils/AppError.js";

export default function errorHandler(err, req, res, next) {
  console.error(err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code || err.statusCode, message: err.message },
    });
  }

  // Prisma known errors
  if (err.code && err.code.startsWith("P")) {
    return res.status(400).json({
      success: false,
      error: {
        code: "DB_ERROR",
        message: "Database error",
        details: err.message,
      },
    });
  }

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : err.message,
    },
  });
}
