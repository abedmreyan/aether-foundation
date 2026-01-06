import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, agents, cannedResponses, sessions, messages, widgets, twilioSettings, calls, chatbots, knowledgeBases, mcpServers, chatbotWidgets, promptTemplates, InsertAgent, InsertCannedResponse, InsertTwilioSettings, InsertCall, InsertChatbot, InsertKnowledgeBase, InsertMcpServer, InsertChatbotWidget } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Agent status functions
export async function getAgentByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(agents).where(eq(agents.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertAgent(agent: InsertAgent) {
  const db = await getDb();
  if (!db) return;

  await db.insert(agents).values(agent).onDuplicateKeyUpdate({
    set: {
      status: agent.status,
      currentSessionId: agent.currentSessionId,
      updatedAt: new Date(),
    },
  });
}

export async function updateAgentStatus(userId: number, status: "available" | "busy" | "offline") {
  const db = await getDb();
  if (!db) return;

  await db.update(agents).set({ status, updatedAt: new Date() }).where(eq(agents.userId, userId));
}

// Canned responses functions
export async function getCannedResponsesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(cannedResponses).where(eq(cannedResponses.userId, userId));
}

export async function createCannedResponse(response: InsertCannedResponse) {
  const db = await getDb();
  if (!db) return;

  const result = await db.insert(cannedResponses).values(response);
  return result;
}

export async function updateCannedResponse(id: number, updates: Partial<InsertCannedResponse>) {
  const db = await getDb();
  if (!db) return;

  await db.update(cannedResponses).set(updates).where(eq(cannedResponses.id, id));
}

export async function deleteCannedResponse(id: number) {
  const db = await getDb();
  if (!db) return;

  await db.delete(cannedResponses).where(eq(cannedResponses.id, id));
}

// Widget functions
export async function getWidgetById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(widgets).where(eq(widgets.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getWidgetByKey(widgetKey: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(widgets).where(eq(widgets.widgetKey, widgetKey)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getWidgetsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(widgets).where(eq(widgets.userId, userId));
}

export async function deleteWidget(id: number) {
  const db = await getDb();
  if (!db) return;

  await db.delete(widgets).where(eq(widgets.id, id));
}

export async function createWidget(widget: any) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(widgets).values(widget);
  return { widgetId: Number(result[0].insertId) };
}

export async function updateWidget(id: number, updates: any) {
  const db = await getDb();
  if (!db) return;

  await db.update(widgets).set(updates).where(eq(widgets.id, id));
}

// Session functions
export async function getSessionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createSession(session: any) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(sessions).values(session);
  return { sessionId: Number(result[0].insertId) };
}

export async function getSessionsByWidgetId(widgetId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(sessions).where(eq(sessions.widgetId, widgetId));
}

export async function updateSession(id: number, updates: any) {
  const db = await getDb();
  if (!db) return;

  await db.update(sessions).set(updates).where(eq(sessions.id, id));
}

// Message functions
export async function getMessagesBySessionId(sessionId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(messages).where(eq(messages.sessionId, sessionId));
}

export async function createMessage(message: any) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(messages).values(message);
  return { messageId: Number(result[0].insertId) };
}

// Session analytics functions
export async function getSessionAnalytics(userId: number, dateFrom?: Date, dateTo?: Date) {
  const db = await getDb();
  if (!db) return null;

  // Get all sessions for user's widgets
  const allSessions = await db.select().from(sessions);
  
  // Filter by date if provided
  let filteredSessions = allSessions;
  if (dateFrom) {
    filteredSessions = filteredSessions.filter(s => new Date(s.startedAt) >= dateFrom);
  }
  if (dateTo) {
    const endOfDay = new Date(dateTo);
    endOfDay.setHours(23, 59, 59, 999);
    filteredSessions = filteredSessions.filter(s => new Date(s.startedAt) <= endOfDay);
  }

  const totalSessions = filteredSessions.length;
  const activeSessions = filteredSessions.filter(s => s.status === "active").length;
  const endedSessions = filteredSessions.filter(s => s.status === "ended").length;
  const missedSessions = filteredSessions.filter(s => s.status === "missed").length;

  // Calculate average duration
  const sessionsWithDuration = filteredSessions.filter(s => s.duration);
  const avgDuration = sessionsWithDuration.length > 0
    ? sessionsWithDuration.reduce((sum, s) => sum + (s.duration || 0), 0) / sessionsWithDuration.length
    : 0;

  return {
    totalSessions,
    activeSessions,
    endedSessions,
    missedSessions,
    avgDuration: Math.round(avgDuration),
  };
}

// Twilio Settings functions
export async function getTwilioSettings(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(twilioSettings).where(eq(twilioSettings.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function saveTwilioSettings(settings: InsertTwilioSettings) {
  const db = await getDb();
  if (!db) return undefined;

  const existing = await getTwilioSettings(settings.userId);
  
  if (existing) {
    await db.update(twilioSettings)
      .set({
        accountSid: settings.accountSid,
        authToken: settings.authToken,
        twimlAppSid: settings.twimlAppSid,
        phoneNumber: settings.phoneNumber,
        isConfigured: true,
      })
      .where(eq(twilioSettings.userId, settings.userId));
  } else {
    await db.insert(twilioSettings).values({
      ...settings,
      isConfigured: true,
    });
  }
  
  return await getTwilioSettings(settings.userId);
}

// Call functions
export async function createCall(call: InsertCall) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(calls).values(call);
  return { callId: Number(result[0].insertId) };
}

export async function getCallsBySessionId(sessionId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(calls).where(eq(calls.sessionId, sessionId));
}

export async function updateCallStatus(callId: number, status: string, duration?: number, endedAt?: Date, recordingUrl?: string) {
  const db = await getDb();
  if (!db) return;

  const updates: any = { status };
  if (duration !== undefined) updates.duration = duration;
  if (endedAt) updates.endedAt = endedAt;
  if (recordingUrl) updates.recordingUrl = recordingUrl;

  await db.update(calls).set(updates).where(eq(calls.id, callId));
}

// Chatbot functions
export async function getChatbotsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(chatbots).where(eq(chatbots.userId, userId));
}

export async function getChatbotById(chatbotId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(chatbots).where(eq(chatbots.id, chatbotId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createChatbot(chatbot: InsertChatbot) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(chatbots).values(chatbot);
  return { chatbotId: Number(result[0].insertId) };
}

export async function updateChatbot(chatbotId: number, updates: Partial<InsertChatbot>) {
  const db = await getDb();
  if (!db) return;
  await db.update(chatbots).set(updates).where(eq(chatbots.id, chatbotId));
}

export async function deleteChatbot(chatbotId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(chatbots).where(eq(chatbots.id, chatbotId));
}

// Knowledge Base functions
export async function getKnowledgeBasesByChatbotId(chatbotId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(knowledgeBases).where(eq(knowledgeBases.chatbotId, chatbotId));
}

export async function createKnowledgeBase(kb: InsertKnowledgeBase) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(knowledgeBases).values(kb);
  return { knowledgeBaseId: Number(result[0].insertId) };
}

export async function deleteKnowledgeBase(kbId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(knowledgeBases).where(eq(knowledgeBases.id, kbId));
}

// MCP Server functions
export async function getMcpServersByChatbotId(chatbotId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(mcpServers).where(eq(mcpServers.chatbotId, chatbotId));
}

export async function createMcpServer(server: InsertMcpServer) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(mcpServers).values(server);
  return { mcpServerId: Number(result[0].insertId) };
}

export async function updateMcpServer(serverId: number, updates: Partial<InsertMcpServer>) {
  const db = await getDb();
  if (!db) return;
  await db.update(mcpServers).set(updates).where(eq(mcpServers.id, serverId));
}

export async function deleteMcpServer(serverId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(mcpServers).where(eq(mcpServers.id, serverId));
}

// Chatbot-Widget Assignment functions
export async function assignChatbotToWidget(chatbotId: number, widgetId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(chatbotWidgets).values({ chatbotId, widgetId });
  return { assignmentId: Number(result[0].insertId) };
}

export async function getChatbotByWidgetId(widgetId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(chatbotWidgets).where(eq(chatbotWidgets.widgetId, widgetId)).limit(1);
  if (result.length === 0) return null;
  return await getChatbotById(result[0].chatbotId);
}

export async function unassignChatbotFromWidget(widgetId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(chatbotWidgets).where(eq(chatbotWidgets.widgetId, widgetId));
}

// Prompt Template functions
export async function getAllPromptTemplates() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(promptTemplates).where(eq(promptTemplates.isPublic, true));
}

export async function getPromptTemplateById(templateId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(promptTemplates).where(eq(promptTemplates.id, templateId)).limit(1);
  return result.length > 0 ? result[0] : null;
}
