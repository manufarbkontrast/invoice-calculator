import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const reqAny = req as any;
  const value = reqAny.query?.[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  const appAny = app as any;
  appAny.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    const resAny = res as any;
    if (!code || !state) {
      resAny.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        resAny.status(400).json({ error: "openId missing from user info" });
        return;
      }

      if (!userInfo.email) {
        resAny.status(400).json({ error: "email missing from user info" });
        return;
      }
      
      await db.upsertUser({
        id: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email,
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      resAny.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      resAny.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      resAny.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
