/**
 * Database Facade - Main Entry Point
 * 
 * Provides a single interface to the database, routing to either
 * LocalDB (development) or AzureDB (production) based on configuration.
 */

import { DatabaseAdapter } from './adapter';
import { LocalDBAdapter } from './localAdapter';
import { AzureDBAdapter } from './azureAdapter';

interface DBConfig {
    useAzure: boolean;
    azure?: {
        host: string;
        port: number;
        database: string;
        user: string;
        password: string;
        ssl: boolean;
    };
}

class AetherSupportDB {
    private local: LocalDBAdapter;
    private azure: AzureDBAdapter | null = null;
    private config: DBConfig;

    constructor() {
        this.local = new LocalDBAdapter();

        // Read config from environment
        this.config = {
            useAzure: process.env.USE_AZURE_DB === 'true',
            azure: process.env.AZURE_DB_URL ? {
                host: process.env.AZURE_DB_HOST || '',
                port: parseInt(process.env.AZURE_DB_PORT || '5432'),
                database: process.env.AZURE_DB_NAME || '',
                user: process.env.AZURE_DB_USER || '',
                password: process.env.AZURE_DB_PASSWORD || '',
                ssl: process.env.AZURE_DB_SSL !== 'false',
            } : undefined,
        };

        if (this.config.useAzure && this.config.azure) {
            try {
                this.azure = new AzureDBAdapter(this.config.azure);
                console.log('[AetherSupportDB] Connected to Azure PostgreSQL');
            } catch (error) {
                console.error('[AetherSupportDB] Failed to connect to Azure:', error);
                console.log('[AetherSupportDB] Falling back to LocalDB');
                this.config.useAzure = false;
            }
        }

        if (!this.config.useAzure) {
            console.log('[AetherSupportDB] Using LocalDB (localStorage)');
        }
    }

    private get adapter(): DatabaseAdapter {
        return (this.config.useAzure && this.azure) ? this.azure : this.local;
    }

    // ============================================================================
    // Proxy all methods to the active adapter
    // ============================================================================

    // Users
    registerUser = (openId: string, name: string, email?: string) =>
        this.adapter.registerUser(openId, name, email);
    getUserByOpenId = (openId: string) =>
        this.adapter.getUserByOpenId(openId);
    updateUser = (userId: number, updates: any) =>
        this.adapter.updateUser(userId, updates);

    // Backward compatibility alias for registerUser
    upsertUser = async (user: { openId: string; name?: string; email?: string; role?: string; lastSignedIn?: Date }) => {
        const existing = await this.adapter.getUserByOpenId(user.openId);
        if (existing) {
            await this.adapter.updateUser(existing.id, {
                name: user.name,
                email: user.email,
                role: user.role,
                lastSignedIn: user.lastSignedIn || new Date(),
            });
        } else {
            await this.adapter.registerUser(user.openId, user.name || '', user.email);
        }
    };

    // Agents
    getAgentByUserId = (userId: number) =>
        this.adapter.getAgentByUserId(userId);
    upsertAgent = (agent: any) =>
        this.adapter.upsertAgent(agent);
    updateAgentStatus = (userId: number, status: any) =>
        this.adapter.updateAgentStatus(userId, status);

    // Widgets
    createWidget = (widget: any) =>
        this.adapter.createWidget(widget);
    getWidgetById = (id: number) =>
        this.adapter.getWidgetById(id);
    getWidgetByKey = (widgetKey: string) =>
        this.adapter.getWidgetByKey(widgetKey);
    getWidgetsByUserId = (userId: number) =>
        this.adapter.getWidgetsByUserId(userId);
    updateWidget = (id: number, updates: any) =>
        this.adapter.updateWidget(id, updates);
    deleteWidget = (id: number) =>
        this.adapter.deleteWidget(id);

    // Sessions
    createSession = (session: any) =>
        this.adapter.createSession(session);
    getSessionById = (id: number) =>
        this.adapter.getSessionById(id);
    getSessionsByWidgetId = (widgetId: number) =>
        this.adapter.getSessionsByWidgetId(widgetId);
    updateSession = (id: number, updates: any) =>
        this.adapter.updateSession(id, updates);

    // Messages
    createMessage = (message: any) =>
        this.adapter.createMessage(message);
    getMessagesBySessionId = (sessionId: number) =>
        this.adapter.getMessagesBySessionId(sessionId);

    // Canned Responses
    getCannedResponsesByUserId = (userId: number) =>
        this.adapter.getCannedResponsesByUserId(userId);
    createCannedResponse = (response: any) =>
        this.adapter.createCannedResponse(response);
    updateCannedResponse = (id: number, updates: any) =>
        this.adapter.updateCannedResponse(id, updates);
    deleteCannedResponse = (id: number) =>
        this.adapter.deleteCannedResponse(id);

    // Chatbots
    getChatbotsByUserId = (userId: number) =>
        this.adapter.getChatbotsByUserId(userId);
    getChatbotById = (chatbotId: number) =>
        this.adapter.getChatbotById(chatbotId);
    createChatbot = (chatbot: any) =>
        this.adapter.createChatbot(chatbot);
    updateChatbot = (chatbotId: number, updates: any) =>
        this.adapter.updateChatbot(chatbotId, updates);
    deleteChatbot = (chatbotId: number) =>
        this.adapter.deleteChatbot(chatbotId);

    // Knowledge Bases
    getKnowledgeBasesByChatbotId = (chatbotId: number) =>
        this.adapter.getKnowledgeBasesByChatbotId(chatbotId);
    createKnowledgeBase = (kb: any) =>
        this.adapter.createKnowledgeBase(kb);
    deleteKnowledgeBase = (kbId: number) =>
        this.adapter.deleteKnowledgeBase(kbId);

    // MCP Servers
    getMcpServersByChatbotId = (chatbotId: number) =>
        this.adapter.getMcpServersByChatbotId(chatbotId);
    createMcpServer = (server: any) =>
        this.adapter.createMcpServer(server);
    updateMcpServer = (serverId: number, updates: any) =>
        this.adapter.updateMcpServer(serverId, updates);
    deleteMcpServer = (serverId: number) =>
        this.adapter.deleteMcpServer(serverId);

    // Chatbot-Widget Assignments
    assignChatbotToWidget = (chatbotId: number, widgetId: number) =>
        this.adapter.assignChatbotToWidget(chatbotId, widgetId);
    getChatbotByWidgetId = (widgetId: number) =>
        this.adapter.getChatbotByWidgetId(widgetId);
    unassignChatbotFromWidget = (widgetId: number) =>
        this.adapter.unassignChatbotFromWidget(widgetId);

    // Calls
    createCall = (call: any) =>
        this.adapter.createCall(call);
    getCallsBySessionId = (sessionId: number) =>
        this.adapter.getCallsBySessionId(sessionId);
    updateCallStatus = (callId: number, status: string, duration?: number, endedAt?: Date, recordingUrl?: string) =>
        this.adapter.updateCallStatus(callId, status, duration, endedAt, recordingUrl);

    // Twilio
    getTwilioSettings = (userId: number) =>
        this.adapter.getTwilioSettings(userId);
    saveTwilioSettings = (settings: any) =>
        this.adapter.saveTwilioSettings(settings);

    // Analytics
    getSessionAnalytics = (userId: number, dateFrom?: Date, dateTo?: Date) =>
        this.adapter.getSessionAnalytics(userId, dateFrom, dateTo);

    // Templates
    getAllPromptTemplates = () =>
        this.adapter.getAllPromptTemplates();
    getPromptTemplateById = (templateId: number) =>
        this.adapter.getPromptTemplateById(templateId);

    // Routing
    getChatbotRoutingRulesByUserId = (userId: number) =>
        this.adapter.getChatbotRoutingRulesByUserId(userId);
    getChatbotRoutingRuleById = (id: number) =>
        this.adapter.getChatbotRoutingRuleById(id);
    getChatbotRoutingRuleByWidgetId = (widgetId: number) =>
        this.adapter.getChatbotRoutingRuleByWidgetId(widgetId);
    createChatbotRoutingRule = (rule: any) =>
        this.adapter.createChatbotRoutingRule(rule);
    updateChatbotRoutingRule = (id: number, updates: any) =>
        this.adapter.updateChatbotRoutingRule(id, updates);
    deleteChatbotRoutingRule = (id: number) =>
        this.adapter.deleteChatbotRoutingRule(id);
    getRoutingNodesByRuleId = (ruleId: number) =>
        this.adapter.getRoutingNodesByRuleId(ruleId);
    createRoutingNode = (node: any) =>
        this.adapter.createRoutingNode(node);
    deleteRoutingNodesByRuleId = (ruleId: number) =>
        this.adapter.deleteRoutingNodesByRuleId(ruleId);
    getRoutingConnectionsByRuleId = (ruleId: number) =>
        this.adapter.getRoutingConnectionsByRuleId(ruleId);
    createRoutingConnection = (connection: any) =>
        this.adapter.createRoutingConnection(connection);
    deleteRoutingConnectionsByRuleId = (ruleId: number) =>
        this.adapter.deleteRoutingConnectionsByRuleId(ruleId);
    getSessionChatbotHistory = (sessionId: number) =>
        this.adapter.getSessionChatbotHistory(sessionId);
    createSessionChatbotHistory = (history: any) =>
        this.adapter.createSessionChatbotHistory(history);

    // Workflows
    getWorkflowsByUserId = (userId: number) =>
        this.adapter.getWorkflowsByUserId(userId);
    createWorkflow = (workflow: any) =>
        this.adapter.createWorkflow(workflow);
    getWorkflowLogs = (workflowId: number) =>
        this.adapter.getWorkflowLogs(workflowId);
}

// Export singleton instance
export const db = new AetherSupportDB();
