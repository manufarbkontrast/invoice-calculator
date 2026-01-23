/**
 * Production Server Entry Point
 * This file is used for Docker/production deployments
 */
import "dotenv/config";
import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  console.log("[Server] Starting production server...");
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // OAuth routes (optional, load dynamically)
  try {
    const { registerOAuthRoutes } = await import("./_core/oauth");
    registerOAuthRoutes(app);
    console.log("[Server] OAuth routes registered");
  } catch (error) {
    console.warn("[Server] OAuth module could not be loaded:", error);
  }
  
  // Stripe routes disabled for now
  // TODO: Re-enable when Stripe integration is needed
  console.log("[Server] Stripe routes disabled");
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  
  // Health check endpoint for Docker
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });
  
  // Serve static files in production
  const distPath = path.resolve(process.cwd(), "dist", "public");
  
  if (fs.existsSync(distPath)) {
    console.log(`[Server] Serving static files from: ${distPath}`);
    app.use(express.static(distPath));
    
    // SPA fallback - serve index.html for all unmatched routes
    app.use("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  } else {
    console.error(`[Server] Static files directory not found: ${distPath}`);
    app.use("*", (_req, res) => {
      res.status(404).send("Build directory not found. Please run 'pnpm run build' first.");
    });
  }

  const port = parseInt(process.env.PORT || "3000");

  server.listen(port, "0.0.0.0", () => {
    console.log(`[Server] 🚀 Server running on http://0.0.0.0:${port}/`);
    console.log(`[Server] Environment: production`);
    console.log(`[Server] Database URL: ${process.env.DATABASE_URL ? "configured" : "NOT SET"}`);
    console.log(`[Server] Supabase URL: ${process.env.SUPABASE_URL ? "configured" : "NOT SET"}`);
  });
}

startServer().catch(error => {
  console.error("[Server] Failed to start:", error);
  process.exit(1);
});

