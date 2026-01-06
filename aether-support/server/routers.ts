import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { db } from "./database";
import { nanoid } from "nanoid";
import { notifyNewSession } from "./_core/socket";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  widget: router({
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        platform: z.enum(['website', 'android', 'ios']),
        primaryColor: z.string(),
        position: z.enum(['bottom-right', 'bottom-left', 'top-right', 'top-left']),
        size: z.enum(['small', 'medium', 'large']),
        welcomeMessage: z.string(),
        enableChat: z.boolean(),
        enableVoice: z.boolean(),
        pushNotificationsEnabled: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const widgetKey = nanoid(32);
        await db.createWidget({
          userId: ctx.user.id,
          widgetKey,
          ...input
        });
        return { widgetKey };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getWidgetsByUserId(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const widget = await db.getWidgetById(input.id);
        if (!widget || widget.userId !== ctx.user.id) {
          throw new Error('Widget not found');
        }
        return widget;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        platform: z.enum(['website', 'android', 'ios']).optional(),
        primaryColor: z.string().optional(),
        position: z.enum(['bottom-right', 'bottom-left', 'top-right', 'top-left']).optional(),
        size: z.enum(['small', 'medium', 'large']).optional(),
        welcomeMessage: z.string().optional(),
        enableChat: z.boolean().optional(),
        enableVoice: z.boolean().optional(),
        pushNotificationsEnabled: z.boolean().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const widget = await db.getWidgetById(input.id);
        if (!widget || widget.userId !== ctx.user.id) {
          throw new Error('Widget not found');
        }
        return await db.updateWidget(input.id, input);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const widget = await db.getWidgetById(input.id);
        if (!widget || widget.userId !== ctx.user.id) {
          throw new Error('Widget not found');
        }
        return await db.deleteWidget(input.id);
      }),

    getByKey: publicProcedure
      .input(z.object({ widgetKey: z.string() }))
      .query(async ({ input }) => {
        return await db.getWidgetByKey(input.widgetKey);
      }),
  }),

  session: router({
    create: publicProcedure
      .input(z.object({
        widgetKey: z.string(),
        userAgent: z.string().optional(),
        referrer: z.string().optional(),
        url: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const widget = await db.getWidgetByKey(input.widgetKey);
        if (!widget) {
          throw new Error('Invalid widget key');
        }
        const visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const result = await db.createSession({
          widgetId: widget.id,
          type: 'chat',
          visitorId: visitorId,
          status: 'waiting'
        });

        // Get the inserted session ID from result
        const sessionId = (result as any).insertId || (result as any)[0]?.insertId;
        if (sessionId) {
          // Notify agents of new session
          await notifyNewSession(sessionId, widget.id);
        }

        return { sessionId };
      }),

    list: protectedProcedure
      .input(z.object({ widgetId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        if (input.widgetId) {
          const widget = await db.getWidgetById(input.widgetId);
          if (!widget || widget.userId !== ctx.user.id) {
            throw new Error('Widget not found');
          }
          return await db.getSessionsByWidgetId(input.widgetId);
        }
        // Get all widgets for user, then get sessions for all widgets
        const userWidgets = await db.getWidgetsByUserId(ctx.user.id);
        const allSessions = [];
        for (const widget of userWidgets) {
          const widgetSessions = await db.getSessionsByWidgetId(widget.id);
          allSessions.push(...widgetSessions);
        }
        return allSessions;
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const session = await db.getSessionById(input.id);
        if (!session) {
          throw new Error('Session not found');
        }
        const widget = await db.getWidgetById(session.widgetId);
        if (!widget || widget.userId !== ctx.user.id) {
          throw new Error('Unauthorized');
        }
        return session;
      }),
  }),

  message: router({
    send: publicProcedure
      .input(z.object({
        sessionId: z.number(),
        content: z.string(),
        type: z.enum(['text', 'system']),
      }))
      .mutation(async ({ input }) => {
        return await db.createMessage({
          sessionId: input.sessionId,
          content: input.content,
          senderType: 'visitor',
          senderId: 'visitor_' + input.sessionId
        });
      }),

    list: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ ctx, input }) => {
        const session = await db.getSessionById(input.sessionId);
        if (!session) {
          throw new Error('Session not found');
        }
        const widget = await db.getWidgetById(session.widgetId);
        if (!widget || widget.userId !== ctx.user.id) {
          throw new Error('Unauthorized');
        }
        return await db.getMessagesBySessionId(input.sessionId);
      }),

    sendAsAgent: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        content: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = await db.getSessionById(input.sessionId);
        if (!session) {
          throw new Error('Session not found');
        }
        const widget = await db.getWidgetById(session.widgetId);
        if (!widget || widget.userId !== ctx.user.id) {
          throw new Error('Unauthorized');
        }
        return await db.createMessage({
          sessionId: input.sessionId,
          content: input.content,
          senderType: 'agent',
          senderId: ctx.user.id.toString(),
          senderName: ctx.user.name || undefined
        });
      }),
  }),

  agent: router({
    status: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getAgentByUserId(ctx.user.id);
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        status: z.enum(['available', 'busy', 'offline'])
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateAgentStatus(ctx.user.id, input.status);
        return { success: true };
      }),
  }),

  cannedResponse: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getCannedResponsesByUserId(ctx.user.id);
      }),

    create: protectedProcedure
      .input(z.object({
        category: z.string(),
        title: z.string(),
        content: z.string(),
        shortcut: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createCannedResponse({
          userId: ctx.user.id,
          ...input,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        category: z.string().optional(),
        title: z.string().optional(),
        content: z.string().optional(),
        shortcut: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        await db.updateCannedResponse(id, updates);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteCannedResponse(input.id);
        return { success: true };
      }),
  }),

  analytics: router({
    overview: protectedProcedure
      .input(z.object({
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getSessionAnalytics(ctx.user.id, input.dateFrom, input.dateTo);
      }),
  }),

  twilio: router({
    getSettings: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getTwilioSettings(ctx.user.id);
      }),

    saveSettings: protectedProcedure
      .input(z.object({
        accountSid: z.string(),
        authToken: z.string(),
        twimlAppSid: z.string(),
        phoneNumber: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.saveTwilioSettings({
          userId: ctx.user.id,
          ...input,
        });
      }),

    getAccessToken: protectedProcedure
      .input(z.object({
        identity: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        const { generateAccessToken } = await import('./_core/twilio');
        const token = await generateAccessToken(ctx.user.id, input.identity);
        if (!token) {
          throw new Error('Twilio not configured. Please configure in Settings.');
        }
        return { token };
      }),
  }),

  chatbots: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getChatbotsByUserId(ctx.user.id);
      }),

    getById: protectedProcedure
      .input(z.object({ chatbotId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getChatbotById(input.chatbotId);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        systemPrompt: z.string(),
        temperature: z.number().min(0).max(100).default(70),
        maxTokens: z.number().min(100).max(4000).default(500),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createChatbot({
          userId: ctx.user.id,
          ...input,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        chatbotId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        systemPrompt: z.string().optional(),
        temperature: z.number().min(0).max(100).optional(),
        maxTokens: z.number().min(100).max(4000).optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { chatbotId, ...updates } = input;
        await db.updateChatbot(chatbotId, updates);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ chatbotId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteChatbot(input.chatbotId);
        return { success: true };
      }),

    // Knowledge Base endpoints
    getKnowledgeBases: protectedProcedure
      .input(z.object({ chatbotId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getKnowledgeBasesByChatbotId(input.chatbotId);
      }),

    addKnowledgeBase: protectedProcedure
      .input(z.object({
        chatbotId: z.number(),
        name: z.string(),
        content: z.string(),
        type: z.enum(["text", "url", "file"]),
        fileUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createKnowledgeBase(input);
      }),

    deleteKnowledgeBase: protectedProcedure
      .input(z.object({ knowledgeBaseId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteKnowledgeBase(input.knowledgeBaseId);
        return { success: true };
      }),

    // MCP Server endpoints
    getMcpServers: protectedProcedure
      .input(z.object({ chatbotId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getMcpServersByChatbotId(input.chatbotId);
      }),

    addMcpServer: protectedProcedure
      .input(z.object({
        chatbotId: z.number(),
        name: z.string(),
        description: z.string().optional(),
        serverUrl: z.string(),
        authType: z.enum(["none", "bearer", "api_key", "basic"]),
        authToken: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createMcpServer(input);
      }),

    updateMcpServer: protectedProcedure
      .input(z.object({
        serverId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        serverUrl: z.string().optional(),
        authType: z.enum(["none", "bearer", "api_key", "basic"]).optional(),
        authToken: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { serverId, ...updates } = input;
        await db.updateMcpServer(serverId, updates);
        return { success: true };
      }),

    deleteMcpServer: protectedProcedure
      .input(z.object({ serverId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteMcpServer(input.serverId);
        return { success: true };
      }),

    // Widget assignment
    assignToWidget: protectedProcedure
      .input(z.object({
        chatbotId: z.number(),
        widgetId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        // First unassign any existing chatbot from this widget
        await db.unassignChatbotFromWidget(input.widgetId);
        // Then assign the new chatbot
        return await db.assignChatbotToWidget(input.chatbotId, input.widgetId);
      }),

    // Prompt templates
    getTemplates: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getAllPromptTemplates();
      }),

    getTemplateById: protectedProcedure
      .input(z.object({ templateId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getPromptTemplateById(input.templateId);
      }),

    // Test chatbot
    test: protectedProcedure
      .input(z.object({
        chatbotId: z.number(),
        message: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { testChatbot } = await import('./_core/aiChatbot');
        return await testChatbot(input.chatbotId, input.message);
      }),
  }),
});

export type AppRouter = typeof appRouter;
