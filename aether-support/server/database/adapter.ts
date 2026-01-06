/**
 * Abstract Database Adapter for Aether Support
 * 
 * Defines the interface for all database operations.
 * Implementations can use localStorage (dev) or Azure PostgreSQL (production).
 */

import type {
    User, Widget, Session, Message, Agent, CannedResponse,
    Chatbot, KnowledgeBase, McpServer, Call, TwilioSettings,
    ChatbotRoutingRule, ChatbotRoutingNode, ChatbotRoutingConnection,
    SessionChatbotHistory, Workflow, WorkflowLog, PromptTemplate, ChatbotWidget
} from '../../drizzle/schema';

export abstract class DatabaseAdapter {
    // ============================================================================
    // USER MANAGEMENT
    // ============================================================================

    abstract registerUser(openId: string, name: string, email?: string): Promise<User>;
    abstract getUserByOpenId(openId: string): Promise<User | null>;
    abstract updateUser(userId: number, updates: Partial<User>): Promise<void>;

    // ============================================================================
    // AGENT MANAGEMENT
    // ============================================================================

    abstract getAgentByUserId(userId: number): Promise<Agent | null>;
    abstract upsertAgent(agent: Partial<Agent> & { userId: number }): Promise<void>;
    abstract updateAgentStatus(userId: number, status: 'available' | 'busy' | 'offline'): Promise<void>;

    // ============================================================================
    // WIDGET MANAGEMENT
    // ============================================================================

    abstract createWidget(widget: Omit<Widget, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ widgetId: number }>;
    abstract getWidgetById(id: number): Promise<Widget | null>;
    abstract getWidgetByKey(widgetKey: string): Promise<Widget | null>;
    abstract getWidgetsByUserId(userId: number): Promise<Widget[]>;
    abstract updateWidget(id: number, updates: Partial<Widget>): Promise<void>;
    abstract deleteWidget(id: number): Promise<void>;

    // ============================================================================
    // SESSION MANAGEMENT
    // ============================================================================

    abstract createSession(session: Omit<Session, 'id' | 'createdAt'>): Promise<{ sessionId: number }>;
    abstract getSessionById(id: number): Promise<Session | null>;
    abstract getSessionsByWidgetId(widgetId: number): Promise<Session[]>;
    abstract updateSession(id: number, updates: Partial<Session>): Promise<void>;

    // ============================================================================
    // MESSAGE MANAGEMENT
    // ============================================================================

    abstract createMessage(message: Omit<Message, 'id' | 'createdAt'>): Promise<{ messageId: number }>;
    abstract getMessagesBySessionId(sessionId: number): Promise<Message[]>;

    // ============================================================================
    // CANNED RESPONSES
    // ============================================================================

    abstract getCannedResponsesByUserId(userId: number): Promise<CannedResponse[]>;
    abstract createCannedResponse(response: Omit<CannedResponse, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ responseId: number }>;
    abstract updateCannedResponse(id: number, updates: Partial<CannedResponse>): Promise<void>;
    abstract deleteCannedResponse(id: number): Promise<void>;

    // ============================================================================
    // CHATBOT MANAGEMENT
    // ============================================================================

    abstract getChatbotsByUserId(userId: number): Promise<Chatbot[]>;
    abstract getChatbotById(chatbotId: number): Promise<Chatbot | null>;
    abstract createChatbot(chatbot: Omit<Chatbot, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ chatbotId: number }>;
    abstract updateChatbot(chatbotId: number, updates: Partial<Chatbot>): Promise<void>;
    abstract deleteChatbot(chatbotId: number): Promise<void>;

    // ============================================================================
    // KNOWLEDGE BASE
    // ============================================================================

    abstract getKnowledgeBasesByChatbotId(chatbotId: number): Promise<KnowledgeBase[]>;
    abstract createKnowledgeBase(kb: Omit<KnowledgeBase, 'id' | 'createdAt'>): Promise<{ knowledgeBaseId: number }>;
    abstract deleteKnowledgeBase(kbId: number): Promise<void>;

    // ============================================================================
    // MCP SERVERS
    // ============================================================================

    abstract getMcpServersByChatbotId(chatbotId: number): Promise<McpServer[]>;
    abstract createMcpServer(server: Omit<McpServer, 'id' | 'createdAt'>): Promise<{ mcpServerId: number }>;
    abstract updateMcpServer(serverId: number, updates: Partial<McpServer>): Promise<void>;
    abstract deleteMcpServer(serverId: number): Promise<void>;

    // ============================================================================
    // CHATBOT-WIDGET ASSIGNMENTS
    // ============================================================================

    abstract assignChatbotToWidget(chatbotId: number, widgetId: number): Promise<{ assignmentId: number }>;
    abstract getChatbotByWidgetId(widgetId: number): Promise<Chatbot | null>;
    abstract unassignChatbotFromWidget(widgetId: number): Promise<void>;

    // ============================================================================
    // CALLS (VoIP)
    // ============================================================================

    abstract createCall(call: Omit<Call, 'id' | 'createdAt'>): Promise<{ callId: number }>;
    abstract getCallsBySessionId(sessionId: number): Promise<Call[]>;
    abstract updateCallStatus(callId: number, status: string, duration?: number, endedAt?: Date, recordingUrl?: string): Promise<void>;

    // ============================================================================
    // TWILIO SETTINGS
    // ============================================================================

    abstract getTwilioSettings(userId: number): Promise<TwilioSettings | null>;
    abstract saveTwilioSettings(settings: Omit<TwilioSettings, 'id' | 'createdAt' | 'updatedAt'>): Promise<TwilioSettings>;

    // ============================================================================
    // ANALYTICS
    // ============================================================================

    abstract getSessionAnalytics(userId: number, dateFrom?: Date, dateTo?: Date): Promise<{
        totalSessions: number;
        activeSessions: number;
        endedSessions: number;
        missedSessions: number;
        avgDuration: number;
    }>;

    // ============================================================================
    // PROMPT TEMPLATES
    // ============================================================================

    abstract getAllPromptTemplates(): Promise<PromptTemplate[]>;
    abstract getPromptTemplateById(templateId: number): Promise<PromptTemplate | null>;

    // ============================================================================
    // ROUTING (Advanced)
    // ============================================================================

    abstract getChatbotRoutingRulesByUserId(userId: number): Promise<ChatbotRoutingRule[]>;
    abstract getChatbotRoutingRuleById(id: number): Promise<ChatbotRoutingRule | null>;
    abstract getChatbotRoutingRuleByWidgetId(widgetId: number): Promise<ChatbotRoutingRule | null>;
    abstract createChatbotRoutingRule(rule: Omit<ChatbotRoutingRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ ruleId: number }>;
    abstract updateChatbotRoutingRule(id: number, updates: Partial<ChatbotRoutingRule>): Promise<void>;
    abstract deleteChatbotRoutingRule(id: number): Promise<void>;

    abstract getRoutingNodesByRuleId(ruleId: number): Promise<ChatbotRoutingNode[]>;
    abstract createRoutingNode(node: Omit<ChatbotRoutingNode, 'id' | 'createdAt'>): Promise<{ nodeId: number }>;
    abstract deleteRoutingNodesByRuleId(ruleId: number): Promise<void>;

    abstract getRoutingConnectionsByRuleId(ruleId: number): Promise<ChatbotRoutingConnection[]>;
    abstract createRoutingConnection(connection: Omit<ChatbotRoutingConnection, 'id' | 'createdAt'>): Promise<{ connectionId: number }>;
    abstract deleteRoutingConnectionsByRuleId(ruleId: number): Promise<void>;

    abstract getSessionChatbotHistory(sessionId: number): Promise<SessionChatbotHistory[]>;
    abstract createSessionChatbotHistory(history: Omit<SessionChatbotHistory, 'id' | 'startedAt'>): Promise<{ historyId: number }>;

    // ============================================================================
    // WORKFLOWS (Future)
    // ============================================================================

    abstract getWorkflowsByUserId(userId: number): Promise<Workflow[]>;
    abstract createWorkflow(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ workflowId: number }>;
    abstract getWorkflowLogs(workflowId: number): Promise<WorkflowLog[]>;
}
