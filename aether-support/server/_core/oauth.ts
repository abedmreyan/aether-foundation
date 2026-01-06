import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { db } from "../database";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { AzureAuthService } from "./auth/azureAd";
import { ENV } from "./env";

// Initialize Azure AD authentication
const azureAuth = new AzureAuthService({
  tenantId: ENV.azureTenantId,
  clientId: ENV.azureClientId,
  clientSecret: ENV.azureClientSecret,
  redirectUri: ENV.azureRedirectUri,
});

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code) {
      res.status(400).json({ error: "code is required" });
      return;
    }

    try {
      // Exchange code for tokens
      const tokenResponse = await azureAuth.exchangeCodeForTokens(code);

      // Extract user info from ID token
      const userClaims = azureAuth.extractUserClaims(tokenResponse.idToken);

      if (!userClaims.sub) {
        res.status(400).json({ error: "User ID missing from token" });
        return;
      }

      // Get login method
      const loginMethod = azureAuth.getLoginMethod(userClaims.idp, userClaims.email);

      // Upsert user in database
      await db.upsertUser({
        openId: userClaims.sub,
        name: userClaims.name,
        email: userClaims.email,
        role: undefined,
        lastSignedIn: new Date(),
      });

      // Create session token
      const sessionToken = await sdk.createSessionToken(userClaims.sub, {
        name: userClaims.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      // Set cookie
      const cookieOptions = getSessionCookieOptions(req);
      console.log("[Azure AD] Setting session cookie");
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      console.log("[Azure AD] Authentication successful, redirecting to /");
      res.redirect(302, "/");
    } catch (error) {
      console.error("[Azure AD] Callback failed", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });
}
