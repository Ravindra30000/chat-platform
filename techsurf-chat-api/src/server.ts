import app from "./app";
import { config } from "./config/env";

const PORT = config.port || 3001;

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  server.close((error) => {
    if (error) {
      console.error("Error during server shutdown:", error);
      process.exit(1);
    }

    console.log("Server closed successfully");
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

// Start server
const server = app.listen(PORT, () => {
  console.log(`
🚀 TechSurf 2025 Chat Agent Platform API Server Started!

📋 Server Information:
   • Port: ${PORT}
   • Environment: ${config.nodeEnv}
   • Node.js: ${process.version}
   • Timestamp: ${new Date().toISOString()}

🔗 Available Endpoints:
   • Health Check: http://localhost:${PORT}/health
   • Chat API: http://localhost:${PORT}/api/chat
   • Streaming Chat: http://localhost:${PORT}/api/chat/stream
   • Models: http://localhost:${PORT}/api/chat/models
   • Test: http://localhost:${PORT}/api/chat/test

📚 Documentation:
   • API Docs: http://localhost:${PORT}/
   • Health (Detailed): http://localhost:${PORT}/health?detailed=true

🔧 Configuration:
   • GROQ API: ${config.groqApiKey ? "✅ Configured" : "❌ Missing"}
   • Rate Limiting: ${config.rateLimitMaxRequests} requests per ${
    config.rateLimitWindowMs / 1000
  }s
   • CORS Origins: ${config.allowedOrigins.join(", ")}

Ready to accept connections! 🎯
  `);
});

// Handle server errors
server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use`);
    console.log("Please either:");
    console.log(`   • Kill the process using port ${PORT}`);
    console.log("   • Change the PORT environment variable");
    console.log(`   • Use: lsof -ti:${PORT} | xargs kill`);
  } else {
    console.error("❌ Server error:", error);
  }
  process.exit(1);
});

// Graceful shutdown handlers
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

export default server;
