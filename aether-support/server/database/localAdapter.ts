/**
 * LocalDB Adapter - File-based Storage Implementation
 * 
 * Used for development and testing without a real database.
 * Stores all data in a JSON file on disk (Node.js environment).
 */

import { DatabaseAdapter } from './adapter';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import type {
    User, Widget, Session, Message, Agent, CannedResponse,
    Chatbot, KnowledgeBase, McpServer, Call, TwilioSettings,
    ChatbotRoutingRule, ChatbotRoutingNode, ChatbotRoutingConnection,
    SessionChatbotHistory, Workflow, WorkflowLog, PromptTemplate, ChatbotWidget
} from '../../drizzle/schema';

const STORAGE_FILE = join(process.cwd(), '.aether-support-db.json');

interface DBState {
    users: User[];
    agents: Agent[];
    widgets: Widget[];
    sessions: Session[];
    messages: Message[];
    cannedResponses: CannedResponse[];
    chatbots: Chatbot[];
    knowledgeBases: KnowledgeBase[];
    mcpServers: McpServer[];
    chatbotWidgets: ChatbotWidget[];
    calls: Call[];
    twilioSettings: TwilioSettings[];
    promptTemplates: PromptTemplate[];
    chatbotRoutingRules: ChatbotRoutingRule[];
    chatbotRoutingNodes: ChatbotRoutingNode[];
    chatbotRoutingConnections: ChatbotRoutingConnection[];
    sessionChatbotHistory: SessionChatbotHistory[];
    workflows: Workflow[];
    workflowLogs: WorkflowLog[];
}

const defaultState: DBState = {
    users: [],
    agents: [],
    widgets: [],
    sessions: [],
    messages: [],
    cannedResponses: [],
    chatbots: [],
    knowledgeBases: [],
    mcpServers: [],
    chatbotWidgets: [],
    calls: [],
    twilioSettings: [],
    promptTemplates: [],
    chatbotRoutingRules: [],
    chatbotRoutingNodes: [],
    chatbotRoutingConnections: [],
    sessionChatbotHistory: [],
    workflows: [],
    workflowLogs: [],
};

export class LocalDBAdapter extends DatabaseAdapter {
    private state: DBState;
    private nextId: Record<string, number> = {};

    constructor() {
        super();
        // Load from file if exists
        if (existsSync(STORAGE_FILE)) {
            try {
                const data = readFileSync(STORAGE_FILE, 'utf-8');
                this.state = JSON.parse(data);
            } catch (error) {
                console.warn('[LocalDB] Failed to load database file, using default state');
                this.state = { ...defaultState };
            }
        } else {
            this.state = { ...defaultState };
        }
    }

    private save() {
        try {
            writeFileSync(STORAGE_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
        } catch (error) {
            console.error('[LocalDB] Failed to save database:', error);
        }
    }

    private generateId(table: keyof DBState): number {
        if (!this.nextId[table]) {
            const existing = (this.state[table] as any[]);
            this.nextId[table] = existing.length > 0
                ? Math.max(...existing.map((item: any) => item.id || 0)) + 1
                : 1;
        }
        return this.nextId[table]++;
    }

    // ============================================================================
    // USER MANAGEMENT
    // ============================================================================

    async registerUser(openId: string, name: string, email?: string): Promise<User> {
        const existing = this.state.users.find(u => u.openId === openId);
        if (existing) return existing;

        const newUser: User = {
            id: this.generateId('users'),
            openId,
            name,
            email: email || null,
            loginMethod: null,
            role: 'user',
            createdAt: new Date(),
            updatedAt: new Date(),
            lastSignedIn: new Date(),
        };

        this.state.users.push(newUser);
        this.save();
        return newUser;
    }

    async getUserByOpenId(openId: string): Promise<User | null> {
        return this.state.users.find(u => u.openId === openId) || null;
    }

    async updateUser(userId: number, updates: Partial<User>): Promise<void> {
        const user = this.state.users.find(u => u.id === userId);
        if (user) {
            Object.assign(user, updates, { updatedAt: new Date() });
            this.save();
        }
    }

    // ============================================================================
    // AGENT MANAGEMENT
    // ============================================================================

    async getAgentByUserId(userId: number): Promise<Agent | null> {
        return this.state.agents.find(a => a.userId === userId) || null;
    }

    async upsertAgent(agent: Partial<Agent> & { userId: number }): Promise<void> {
        const existing = this.state.agents.find(a => a.userId === agent.userId);
        if (existing) {
            Object.assign(existing, agent, { updatedAt: new Date() });
        } else {
            this.state.agents.push({
                id: this.generateId('agents'),
                userId: agent.userId,
                status: agent.status || 'offline',
                currentSessionId: agent.currentSessionId || null,
                updatedAt: new Date(),
            });
        }
        this.save();
    }

    async updateAgentStatus(userId: number, status: 'available' | 'busy' | 'offline'): Promise<void> {
        await this.upsertAgent({ userId, status });
    }

    // ============================================================================
    // WIDGET MANAGEMENT
    // ============================================================================

    async createWidget(widget: Omit<Widget, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ widgetId: number }> {
        const id = this.generateId('widgets');
        const newWidget: Widget = {
            ...widget,
            id,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.state.widgets.push(newWidget);
        this.save();
        return { widgetId: id };
    }

    async getWidgetById(id: number): Promise<Widget | null> {
        return this.state.widgets.find(w => w.id === id) || null;
    }

    async getWidgetByKey(widgetKey: string): Promise<Widget | null> {
        return this.state.widgets.find(w => w.widgetKey === widgetKey) || null;
    }

    async getWidgetsByUserId(userId: number): Promise<Widget[]> {
        return this.state.widgets.filter(w => w.userId === userId);
    }

    async updateWidget(id: number, updates: Partial<Widget>): Promise<void> {
        const widget = this.state.widgets.find(w => w.id === id);
        if (widget) {
            Object.assign(widget, updates, { updatedAt: new Date() });
            this.save();
        }
    }

    async deleteWidget(id: number): Promise<void> {
        this.state.widgets = this.state.widgets.filter(w => w.id !== id);
        this.save();
    }

    // ============================================================================
    // SESSION MANAGEMENT
    // ============================================================================

    async createSession(session: Omit<Session, 'id' | 'createdAt'>): Promise<{ sessionId: number }> {
        const id = this.generateId('sessions');
        const newSession: Session = {
            ...session,
            id,
            createdAt: new Date(),
        };
        this.state.sessions.push(newSession);
        this.save();
        return { sessionId: id };
    }

    async getSessionById(id: number): Promise<Session | null> {
        return this.state.sessions.find(s => s.id === id) || null;
    }

    async getSessionsByWidgetId(widgetId: number): Promise<Session[]> {
        return this.state.sessions.filter(s => s.widgetId === widgetId);
    }

    async updateSession(id: number, updates: Partial<Session>): Promise<void> {
        const session = this.state.sessions.find(s => s.id === id);
        if (session) {
            Object.assign(session, updates);
            this.save();
        }
    }

    // ============================================================================
    // MESSAGE MANAGEMENT
    // ============================================================================

    async createMessage(message: Omit<Message, 'id' | 'createdAt'>): Promise<{ messageId: number }> {
        const id = this.generateId('messages');
        const newMessage: Message = {
            ...message,
            id,
            createdAt: new Date(),
        };
        this.state.messages.push(newMessage);
        this.save();
        return { messageId: id };
    }

    async getMessagesBySessionId(sessionId: number): Promise<Message[]> {
        return this.state.messages.filter(m => m.sessionId === sessionId);
    }

    // ============================================================================
    // CANNED RESPONSES
    // ============================================================================

    async getCannedResponsesByUserId(userId: number): Promise<CannedResponse[]> {
        return this.state.cannedResponses.filter(r => r.userId === userId);
    }

    async createCannedResponse(response: Omit<CannedResponse, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ responseId: number }> {
        const id = this.generateId('cannedResponses');
        const newResponse: CannedResponse = {
            ...response,
            id,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.state.cannedResponses.push(newResponse);
        this.save();
        return { responseId: id };
    }

    async updateCannedResponse(id: number, updates: Partial<CannedResponse>): Promise<void> {
        const response = this.state.cannedResponses.find(r => r.id === id);
        if (response) {
            Object.assign(response, updates, { updatedAt: new Date() });
            this.save();
        }
    }

    async deleteCannedResponse(id: number): Promise<void> {
        this.state.cannedResponses = this.state.cannedResponses.filter(r => r.id !== id);
        this.save();
    }

    // ============================================================================
    // CHATBOT MANAGEMENT
    // ============================================================================

    async getChatbotsByUserId(userId: number): Promise<Chatbot[]> {
        return this.state.chatbots.filter(c => c.userId === userId);
    }

    async getChatbotById(chatbotId: number): Promise<Chatbot | null> {
        return this.state.chatbots.find(c => c.id === chatbotId) || null;
    }

    async createChatbot(chatbot: Omit<Chatbot, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ chatbotId: number }> {
        const id = this.generateId('chatbots');
        const newChatbot: Chatbot = {
            ...chatbot,
            id,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.state.chatbots.push(newChatbot);
        this.save();
        return { chatbotId: id };
    }

    async updateChatbot(chatbotId: number, updates: Partial<Chatbot>): Promise<void> {
        const chatbot = this.state.chatbots.find(c => c.id === chatbotId);
        if (chatbot) {
            Object.assign(chatbot, updates, { updatedAt: new Date() });
            this.save();
        }
    }

    async deleteChatbot(chatbotId: number): Promise<void> {
        this.state.chatbots = this.state.chatbots.filter(c => c.id !== chatbotId);
        this.save();
    }

    // ============================================================================
    // KNOWLEDGE BASE
    // ============================================================================

    async getKnowledgeBasesByChatbotId(chatbotId: number): Promise<KnowledgeBase[]> {
        return this.state.knowledgeBases.filter(kb => kb.chatbotId === chatbotId);
    }

    async createKnowledgeBase(kb: Omit<KnowledgeBase, 'id' | 'createdAt'>): Promise<{ knowledgeBaseId: number }> {
        const id = this.generateId('knowledgeBases');
        const newKB: KnowledgeBase = {
            ...kb,
            id,
            createdAt: new Date(),
        };
        this.state.knowledgeBases.push(newKB);
        this.save();
        return { knowledgeBaseId: id };
    }

    async deleteKnowledgeBase(kbId: number): Promise<void> {
        this.state.knowledgeBases = this.state.knowledgeBases.filter(kb => kb.id !== kbId);
        this.save();
    }

    // ============================================================================
    // MCP SERVERS
    // ============================================================================

    async getMcpServersByChatbotId(chatbotId: number): Promise<McpServer[]> {
        return this.state.mcpServers.filter(s => s.chatbotId === chatbotId);
    }

    async createMcpServer(server: Omit<McpServer, 'id' | 'createdAt'>): Promise<{ mcpServerId: number }> {
        const id = this.generateId('mcpServers');
        const newServer: McpServer = {
            ...server,
            id,
            createdAt: new Date(),
        };
        this.state.mcpServers.push(newServer);
        this.save();
        return { mcpServerId: id };
    }

    async updateMcpServer(serverId: number, updates: Partial<McpServer>): Promise<void> {
        const server = this.state.mcpServers.find(s => s.id === serverId);
        if (server) {
            Object.assign(server, updates);
            this.save();
        }
    }

    async deleteMcpServer(serverId: number): Promise<void> {
        this.state.mcpServers = this.state.mcpServers.filter(s => s.id !== serverId);
        this.save();
    }

    // ============================================================================
    // CHATBOT-WIDGET ASSIGNMENTS
    // ============================================================================

    async assignChatbotToWidget(chatbotId: number, widgetId: number): Promise<{ assignmentId: number }> {
        const id = this.generateId('chatbotWidgets');
        this.state.chatbotWidgets.push({
            id,
            chatbotId,
            widgetId,
            createdAt: new Date(),
        });
        this.save();
        return { assignmentId: id };
    }

    async getChatbotByWidgetId(widgetId: number): Promise<Chatbot | null> {
        const assignment = this.state.chatbotWidgets.find(cw => cw.widgetId === widgetId);
        if (!assignment) return null;
        return await this.getChatbotById(assignment.chatbotId);
    }

    async unassignChatbotFromWidget(widgetId: number): Promise<void> {
        this.state.chatbotWidgets = this.state.chatbotWidgets.filter(cw => cw.widgetId !== widgetId);
        this.save();
    }

    // ============================================================================
    // CALLS (VoIP)
    // ============================================================================

    async createCall(call: Omit<Call, 'id' | 'createdAt'>): Promise<{ callId: number }> {
        const id = this.generateId('calls');
        const newCall: Call = {
            ...call,
            id,
            createdAt: new Date(),
        };
        this.state.calls.push(newCall);
        this.save();
        return { callId: id };
    }

    async getCallsBySessionId(sessionId: number): Promise<Call[]> {
        return this.state.calls.filter(c => c.sessionId === sessionId);
    }

    async updateCallStatus(callId: number, status: string, duration?: number, endedAt?: Date, recordingUrl?: string): Promise<void> {
        const call = this.state.calls.find(c => c.id === callId);
        if (call) {
            (call as any).status = status;
            if (duration !== undefined) call.duration = duration;
            if (endedAt) call.endedAt = endedAt;
            if (recordingUrl) call.recordingUrl = recordingUrl;
            this.save();
        }
    }

    // ============================================================================
    // TWILIO SETTINGS
    // ============================================================================

    async getTwilioSettings(userId: number): Promise<TwilioSettings | null> {
        return this.state.twilioSettings.find(t => t.userId === userId) || null;
    }

    async saveTwilioSettings(settings: Omit<TwilioSettings, 'id' | 'createdAt' | 'updatedAt'>): Promise<TwilioSettings> {
        const existing = this.state.twilioSettings.find(t => t.userId === settings.userId);
        if (existing) {
            Object.assign(existing, settings, { updatedAt: new Date() });
            this.save();
            return existing;
        } else {
            const id = this.generateId('twilioSettings');
            const newSettings: TwilioSettings = {
                ...settings,
                id,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            this.state.twilioSettings.push(newSettings);
            this.save();
            return newSettings;
        }
    }

    // ============================================================================
    // ANALYTICS
    // ============================================================================

    async getSessionAnalytics(userId: number, dateFrom?: Date, dateTo?: Date): Promise<{
        totalSessions: number;
        activeSessions: number;
        endedSessions: number;
        missedSessions: number;
        avgDuration: number;
    }> {
        let sessions = this.state.sessions;

        if (dateFrom) {
            sessions = sessions.filter(s => new Date(s.startedAt) >= dateFrom);
        }
        if (dateTo) {
            const endOfDay = new Date(dateTo);
            endOfDay.setHours(23, 59, 59, 999);
            sessions = sessions.filter(s => new Date(s.startedAt) <= endOfDay);
        }

        const totalSessions = sessions.length;
        const activeSessions = sessions.filter(s => s.status === 'active').length;
        const endedSessions = sessions.filter(s => s.status === 'ended').length;
        const missedSessions = sessions.filter(s => s.status === 'missed').length;

        const sessionsWithDuration = sessions.filter(s => s.duration);
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

    // ============================================================================
    // PROMPT TEMPLATES
    // ============================================================================

    async getAllPromptTemplates(): Promise<PromptTemplate[]> {
        return this.state.promptTemplates.filter(pt => pt.isPublic === true);
    }

    async getPromptTemplateById(templateId: number): Promise<PromptTemplate | null> {
        return this.state.promptTemplates.find(pt => pt.id === templateId) || null;
    }

    // ============================================================================
    // ROUTING (Advanced)
    // ============================================================================

    async getChatbotRoutingRulesByUserId(userId: number): Promise<ChatbotRoutingRule[]> {
        return this.state.chatbotRoutingRules.filter(r => r.userId === userId);
    }

    async getChatbotRoutingRuleById(id: number): Promise<ChatbotRoutingRule | null> {
        return this.state.chatbotRoutingRules.find(r => r.id === id) || null;
    }

    async getChatbotRoutingRuleByWidgetId(widgetId: number): Promise<ChatbotRoutingRule | null> {
        return this.state.chatbotRoutingRules.find(r => r.widgetId === widgetId) || null;
    }

    async createChatbotRoutingRule(rule: Omit<ChatbotRoutingRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ ruleId: number }> {
        const id = this.generateId('chatbotRoutingRules');
        const newRule: ChatbotRoutingRule = {
            ...rule,
            id,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.state.chatbotRoutingRules.push(newRule);
        this.save();
        return { ruleId: id };
    }

    async updateChatbotRoutingRule(id: number, updates: Partial<ChatbotRoutingRule>): Promise<void> {
        const rule = this.state.chatbotRoutingRules.find(r => r.id === id);
        if (rule) {
            Object.assign(rule, updates, { updatedAt: new Date() });
            this.save();
        }
    }

    async deleteChatbotRoutingRule(id: number): Promise<void> {
        this.state.chatbotRoutingRules = this.state.chatbotRoutingRules.filter(r => r.id !== id);
        this.save();
    }

    async getRoutingNodesByRuleId(ruleId: number): Promise<ChatbotRoutingNode[]> {
        return this.state.chatbotRoutingNodes.filter(n => n.routingRuleId === ruleId);
    }

    async createRoutingNode(node: Omit<ChatbotRoutingNode, 'id' | 'createdAt'>): Promise<{ nodeId: number }> {
        const id = this.generateId('chatbotRoutingNodes');
        const newNode: ChatbotRoutingNode = {
            ...node,
            id,
            createdAt: new Date(),
        };
        this.state.chatbotRoutingNodes.push(newNode);
        this.save();
        return { nodeId: id };
    }

    async deleteRoutingNodesByRuleId(ruleId: number): Promise<void> {
        this.state.chatbotRoutingNodes = this.state.chatbotRoutingNodes.filter(n => n.routingRuleId !== ruleId);
        this.save();
    }

    async getRoutingConnectionsByRuleId(ruleId: number): Promise<ChatbotRoutingConnection[]> {
        return this.state.chatbotRoutingConnections.filter(c => c.routingRuleId === ruleId);
    }

    async createRoutingConnection(connection: Omit<ChatbotRoutingConnection, 'id' | 'createdAt'>): Promise<{ connectionId: number }> {
        const id = this.generateId('chatbotRoutingConnections');
        const newConnection: ChatbotRoutingConnection = {
            ...connection,
            id,
            createdAt: new Date(),
        };
        this.state.chatbotRoutingConnections.push(newConnection);
        this.save();
        return { connectionId: id };
    }

    async deleteRoutingConnectionsByRuleId(ruleId: number): Promise<void> {
        this.state.chatbotRoutingConnections = this.state.chatbotRoutingConnections.filter(c => c.routingRuleId !== ruleId);
        this.save();
    }

    async getSessionChatbotHistory(sessionId: number): Promise<SessionChatbotHistory[]> {
        return this.state.sessionChatbotHistory.filter(h => h.sessionId === sessionId);
    }

    async createSessionChatbotHistory(history: Omit<SessionChatbotHistory, 'id' | 'startedAt'>): Promise<{ historyId: number }> {
        const id = this.generateId('sessionChatbotHistory');
        const newHistory: SessionChatbotHistory = {
            ...history,
            id,
            startedAt: new Date(),
        };
        this.state.sessionChatbotHistory.push(newHistory);
        this.save();
        return { historyId: id };
    }

    // ============================================================================
    // WORKFLOWS (Future)
    // ============================================================================

    async getWorkflowsByUserId(userId: number): Promise<Workflow[]> {
        return this.state.workflows.filter(w => w.userId === userId);
    }

    async createWorkflow(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ workflowId: number }> {
        const id = this.generateId('workflows');
        const newWorkflow: Workflow = {
            ...workflow,
            id,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.state.workflows.push(newWorkflow);
        this.save();
        return { workflowId: id };
    }

    async getWorkflowLogs(workflowId: number): Promise<WorkflowLog[]> {
        return this.state.workflowLogs.filter(l => l.workflowId === workflowId);
    }
}
