import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";

// Generic validation middleware
export const validate = (schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation error",
          message: "Invalid request data",
          details: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
            received: err.received,
          })),
        });
      }
      return res.status(400).json({
        error: "Validation error",
        message: "Invalid request data",
      });
    }
  };
};

// Chat request validation schemas
export const chatRequestSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(4000, "Message too long"),
  conversationId: z.string().uuid().optional(),
  userId: z.string().optional(),
  context: z.record(z.unknown()).optional(),
  stream: z.boolean().default(true),
});

export const chatQuerySchema = z.object({
  stream: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
});

// Conversation validation schemas
export const conversationParamsSchema = z.object({
  id: z.string().uuid("Invalid conversation ID"),
});

// Health check validation
export const healthQuerySchema = z.object({
  detailed: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
});

// Request ID middleware
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const requestId =
    (req.headers["x-request-id"] as string) ||
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  req.requestId = requestId;
  res.setHeader("X-Request-ID", requestId);
  next();
};

// Content type validation for POST requests
export const validateContentType = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.method === "POST" && !req.is("application/json")) {
    return res.status(415).json({
      error: "Unsupported Media Type",
      message: "Content-Type must be application/json",
    });
  }
  next();
};

// Request size limit validation
export const validateRequestSize = (maxSize: number = 1024 * 1024) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers["content-length"] || "0");

    if (contentLength > maxSize) {
      return res.status(413).json({
        error: "Request too large",
        message: `Request size exceeds maximum allowed size of ${maxSize} bytes`,
      });
    }
    next();
  };
};
