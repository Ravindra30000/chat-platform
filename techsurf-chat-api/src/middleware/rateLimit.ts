import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import { config } from "../config/env";

// Create rate limiter for general API endpoints
export const generalRateLimit = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    error: "Too many requests",
    message: "Rate limit exceeded. Please try again later.",
    retryAfter: Math.ceil(config.rateLimitWindowMs / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: "Too many requests",
      message: "Rate limit exceeded. Please try again later.",
      retryAfter: Math.ceil(config.rateLimitWindowMs / 1000),
    });
  },
  keyGenerator: (req: Request) => {
    return req.ip || "unknown";
  },
});

// More restrictive rate limit for chat endpoints
export const chatRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: {
    error: "Chat rate limit exceeded",
    message:
      "Too many chat messages. Please wait before sending another message.",
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: "Chat rate limit exceeded",
      message:
        "Too many chat messages. Please wait before sending another message.",
      retryAfter: 60,
    });
  },
  keyGenerator: (req: Request) => {
    // Use user ID if available, otherwise fall back to IP
    return req.user?.id || req.ip || "unknown";
  },
});

// Rate limit for streaming endpoints
export const streamRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 streaming requests per 5 minutes
  message: {
    error: "Streaming rate limit exceeded",
    message:
      "Too many streaming requests. Please wait before starting a new stream.",
    retryAfter: 300,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: "Streaming rate limit exceeded",
      message:
        "Too many streaming requests. Please wait before starting a new stream.",
      retryAfter: 300,
    });
  },
  keyGenerator: (req: Request) => {
    return req.user?.id || req.ip || "unknown";
  },
});

// Skip rate limiting in test environment
export const conditionalRateLimit = (limiter: any) => {
  return (req: Request, res: Response, next: Function) => {
    if (config.nodeEnv === "test") {
      return next();
    }
    return limiter(req, res, next);
  };
};
