/**
 * Azure AD Authentication Service
 * 
 * Handles authentication using Microsoft MSAL (Microsoft Authentication Library)
 */

import { ConfidentialClientApplication, type Configuration } from '@azure/msal-node';
import type { AzureADConfig, AzureADUser, TokenResponse } from './types';

export class AzureAuthService {
    private msalClient: ConfidentialClientApplication;
    private config: AzureADConfig;

    constructor(config: AzureADConfig) {
        this.config = config;

        const msalConfig: Configuration = {
            auth: {
                clientId: config.clientId,
                authority: `https://login.microsoftonline.com/${config.tenantId}`,
                clientSecret: config.clientSecret,
            },
            system: {
                loggerOptions: {
                    loggerCallback: (level, message, containsPii) => {
                        if (containsPii) return;
                        console.log(`[Azure AD] ${message}`);
                    },
                    piiLoggingEnabled: false,
                    logLevel: 3, // Info
                },
            },
        };

        this.msalClient = new ConfidentialClientApplication(msalConfig);
        console.log('[Azure AD] Initialized with tenant:', config.tenantId);
    }

    /**
     * Get authorization URL for user login
     */
    async getAuthorizationUrl(state?: string): Promise<string> {
        const authCodeUrlParameters = {
            scopes: ['openid', 'profile', 'email', 'User.Read'],
            redirectUri: this.config.redirectUri,
            state: state || '',
        };

        return await this.msalClient.getAuthCodeUrl(authCodeUrlParameters);
    }

    /**
     * Exchange authorization code for tokens
     */
    async exchangeCodeForTokens(code: string): Promise<TokenResponse> {
        try {
            const tokenRequest = {
                code,
                scopes: ['openid', 'profile', 'email', 'User.Read'],
                redirectUri: this.config.redirectUri,
            };

            const response = await this.msalClient.acquireTokenByCode(tokenRequest);

            if (!response || !response.idToken || !response.accessToken) {
                throw new Error('Invalid token response from Azure AD');
            }

            return {
                accessToken: response.accessToken,
                idToken: response.idToken,
                expiresIn: response.expiresOn ?
                    Math.floor((response.expiresOn.getTime() - Date.now()) / 1000) :
                    3600,
            };
        } catch (error) {
            console.error('[Azure AD] Token exchange failed:', error);
            throw new Error('Failed to exchange code for tokens');
        }
    }

    /**
     * Extract user claims from ID token
     */
    extractUserClaims(idToken: string): AzureADUser {
        try {
            // Decode JWT (simple base64 decode, no verification needed as it came from MSAL)
            const payload = idToken.split('.')[1];
            const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());

            return {
                sub: decoded.sub || decoded.oid, // oid is Azure AD's user object ID
                name: decoded.name,
                email: decoded.email || decoded.preferred_username,
                preferred_username: decoded.preferred_username,
                idp: decoded.idp, // Identity provider (e.g., google.com, live.com)
            };
        } catch (error) {
            console.error('[Azure AD] Failed to extract user claims:', error);
            throw new Error('Invalid ID token');
        }
    }

    /**
     * Get login method/provider from identity provider claim
     */
    getLoginMethod(idp?: string, email?: string): string | null {
        if (!idp) {
            // Fallback: check email domain
            if (email?.endsWith('@gmail.com')) return 'google';
            if (email?.endsWith('@outlook.com') || email?.endsWith('@hotmail.com')) return 'microsoft';
            return 'email';
        }

        // Map Azure AD identity providers
        if (idp.includes('google')) return 'google';
        if (idp.includes('live.com') || idp.includes('microsoft')) return 'microsoft';
        if (idp.includes('apple')) return 'apple';
        if (idp.includes('github')) return 'github';

        return idp.toLowerCase();
    }
}
