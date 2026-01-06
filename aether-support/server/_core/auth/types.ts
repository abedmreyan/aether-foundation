/**
 * Azure AD Authentication Types
 */

export interface AzureADConfig {
    tenantId: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
}

export interface AzureADUser {
    sub: string;              // Azure AD subject (unique user ID)
    name?: string;
    email?: string;
    preferred_username?: string;
    idp?: string;             // Identity provider (Google, Microsoft, etc.)
}

export interface TokenResponse {
    accessToken: string;
    idToken: string;
    expiresIn: number;
}
