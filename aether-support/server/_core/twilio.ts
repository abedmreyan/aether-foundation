import twilio from 'twilio';
import * as db from '../db';

const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

/**
 * Generate Twilio access token for client-side voice SDK
 */
export async function generateAccessToken(userId: number, identity: string): Promise<string | null> {
  const settings = await db.getTwilioSettings(userId);
  
  if (!settings || !settings.isConfigured) {
    console.warn('[Twilio] Settings not configured for user:', userId);
    return null;
  }

  const token = new AccessToken(
    settings.accountSid!,
    settings.twimlAppSid!,
    settings.authToken!,
    { identity }
  );

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: settings.twimlAppSid!,
    incomingAllow: true,
  });

  token.addGrant(voiceGrant);

  return token.toJwt();
}

/**
 * Get Twilio client instance for a user
 */
export async function getTwilioClient(userId: number) {
  const settings = await db.getTwilioSettings(userId);
  
  if (!settings || !settings.isConfigured) {
    console.warn('[Twilio] Settings not configured for user:', userId);
    return null;
  }

  return twilio(settings.accountSid!, settings.authToken!);
}

/**
 * Initiate outbound call
 */
export async function initiateCall(userId: number, to: string, from?: string) {
  const client = await getTwilioClient(userId);
  const settings = await db.getTwilioSettings(userId);
  
  if (!client || !settings) {
    throw new Error('Twilio not configured');
  }

  const call = await client.calls.create({
    to,
    from: from || settings.phoneNumber!,
    url: 'http://demo.twilio.com/docs/voice.xml', // TwiML URL
  });

  return call;
}
