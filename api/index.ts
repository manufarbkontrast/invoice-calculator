import "dotenv/config";
import express from "express";
import fs from "fs";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

const app = express();

// Configure body parser with larger size limit for file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// OAuth callback under /api/oauth/callback
registerOAuthRoutes(app);

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Serve static files in production
const distPath = path.resolve(process.cwd(), "dist", "public");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  // Fall through to index.html for SPA routing
  app.use("*", (_req: express.Request, res: express.Response) => {
    const resAny = res as any;
    resAny.sendFile(path.resolve(distPath, "index.html"));
  });
} else {
  // If dist doesn't exist, return a simple message
  app.use("*", (_req: express.Request, res: express.Response) => {
    const resAny = res as any;
    resAny.status(404).send("Build directory not found. Please run 'npm run build' first.");
  });
}

// Export as Vercel serverless function handler
export default async function handler(req: any, res: any) {
  return new Promise<void>((resolve, reject) => {
    app(req, res, (err?: any) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

