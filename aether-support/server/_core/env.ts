import { config } from "dotenv";
config();

export const ENV = {
  appId: process.env.APP_ID ?? "",

  // Azure AD Configuration
  azureTenantId: process.env.AZURE_TENANT_ID ?? "",
  azureClientId: process.env.AZURE_CLIENT_ID ?? "",
  azureClientSecret: process.env.AZURE_CLIENT_SECRET ?? "",
  azureRedirectUri: process.env.AZURE_REDIRECT_URI ?? "http://localhost:3000/api/auth/callback",

  // Session Management
  cookieSecret: process.env.COOKIE_SECRET ?? "default-cookie-secret-change-in-production",
  jwtSecret: process.env.JWT_SECRET ?? "default-jwt-secret-change-in-production",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
} as const;
