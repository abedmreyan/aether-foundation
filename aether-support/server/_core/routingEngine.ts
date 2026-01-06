import { db } from "../database";
import { generateChatbotResponse } from "./aiChatbot";

interface RoutingNode {
  id: string;
  type: "chatbot" | "condition" | "mcp_check" | "handoff";
  label: string;
  chatbotId?: number;
  condition?: string;
  position?: { x: number; y: number };
}

interface RoutingEdge {
  source: string;
  target: string;
}

interface RoutingConfig {
  nodes: RoutingNode[];
  edges: RoutingEdge[];
}

interface RoutingContext {
  sessionId: number;
  widgetId: number;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
  customerData?: any;
}

/**
 * Routing Execution Engine
 * Evaluates routing rules and determines which chatbot should handle the conversation
 */
export class RoutingEngine {
  /**
   * Get the active routing rule for a widget
   */
  static async getRoutingRuleForWidget(widgetId: number) {
    return await db.getChatbotRoutingRuleByWidgetId(widgetId);
  }

  /**
   * Get the current chatbot handling a session
   */
  static async getCurrentChatbot(sessionId: number) {
    const history = await db.getSessionChatbotHistory(sessionId);

    // Find the most recent active assignment (no endedAt)
    const current = history.find(h => !h.endedAt);
    if (!current) return null;

    // Get the chatbot details
    return await db.getChatbotById(current.chatbotId);
  }

  /**
   * Initialize a session with the initial chatbot from routing rule
   */
  static async initializeSession(sessionId: number, widgetId: number) {
    const rule = await this.getRoutingRuleForWidget(widgetId);
    if (!rule) return null;

    // Assign initial chatbot to session
    await db.createSessionChatbotHistory({
      sessionId,
      chatbotId: rule.initialChatbotId,
      handoffReason: "Initial assignment",
    });

    // Get the initial chatbot
    return await db.getChatbotById(rule.initialChatbotId);
  }

  /**
   * Evaluate routing conditions and determine if handoff is needed
   */
  static async evaluateRouting(context: RoutingContext): Promise<{
    shouldHandoff: boolean;
    targetChatbotId?: number;
    reason?: string;
  }> {
    const rule = await this.getRoutingRuleForWidget(context.widgetId);
    if (!rule) return { shouldHandoff: false };

    const routingConfig: RoutingConfig = JSON.parse(rule.routingConfig);
    const currentChatbot = await this.getCurrentChatbot(context.sessionId);
    if (!currentChatbot) return { shouldHandoff: false };

    // Find the current chatbot node
    const currentNode = routingConfig.nodes.find(
      (node) => node.type === "chatbot" && node.chatbotId === currentChatbot.id
    );

    if (!currentNode) return { shouldHandoff: false };

    // Get outgoing edges from current node
    const outgoingEdges = routingConfig.edges.filter((edge) => edge.source === currentNode.id);

    // Evaluate each possible path
    for (const edge of outgoingEdges) {
      const targetNode = routingConfig.nodes.find((node) => node.id === edge.target);
      if (!targetNode) continue;

      // Evaluate the target node
      const shouldTakePath = await this.evaluateNode(targetNode, context);

      if (shouldTakePath.shouldProceed) {
        // If target is a chatbot, handoff to it
        if (targetNode.type === "chatbot" && targetNode.chatbotId) {
          return {
            shouldHandoff: true,
            targetChatbotId: targetNode.chatbotId,
            reason: shouldTakePath.reason || `Condition met: ${targetNode.label}`,
          };
        }

        // If target is another condition/mcp_check, continue traversing
        if (targetNode.type === "condition" || targetNode.type === "mcp_check") {
          // Find next chatbot in the path
          const nextChatbot = await this.findNextChatbotInPath(
            targetNode.id,
            routingConfig,
            context
          );
          if (nextChatbot) {
            return {
              shouldHandoff: true,
              targetChatbotId: nextChatbot.chatbotId,
              reason: nextChatbot.reason,
            };
          }
        }
      }
    }

    return { shouldHandoff: false };
  }

  /**
   * Evaluate a single routing node
   */
  private static async evaluateNode(
    node: RoutingNode,
    context: RoutingContext
  ): Promise<{ shouldProceed: boolean; reason?: string }> {
    switch (node.type) {
      case "condition":
        return await this.evaluateCondition(node, context);

      case "mcp_check":
        return await this.evaluateMCPCheck(node, context);

      case "chatbot":
        return { shouldProceed: true, reason: `Route to ${node.label}` };

      default:
        return { shouldProceed: false };
    }
  }

  /**
   * Evaluate a condition node (keyword detection, intent analysis)
   */
  private static async evaluateCondition(
    node: RoutingNode,
    context: RoutingContext
  ): Promise<{ shouldProceed: boolean; reason?: string }> {
    if (!node.condition) return { shouldProceed: false };

    // Get the latest user message
    const userMessages = context.conversationHistory.filter((msg) => msg.role === "user");
    if (userMessages.length === 0) return { shouldProceed: false };

    const latestMessage = userMessages[userMessages.length - 1].content.toLowerCase();

    // Simple keyword detection
    const keywords = node.condition.toLowerCase().split(",").map((k) => k.trim());
    const hasKeyword = keywords.some((keyword) => latestMessage.includes(keyword));

    if (hasKeyword) {
      return {
        shouldProceed: true,
        reason: `Keyword detected: ${keywords.find((k) => latestMessage.includes(k))}`,
      };
    }

    // TODO: Add more sophisticated intent analysis using LLM
    // Could use invokeLLM to classify intent

    return { shouldProceed: false };
  }

  /**
   * Evaluate an MCP check node (fetch customer data)
   */
  private static async evaluateMCPCheck(
    node: RoutingNode,
    context: RoutingContext
  ): Promise<{ shouldProceed: boolean; reason?: string }> {
    if (!node.condition) return { shouldProceed: false };

    try {
      // Parse MCP query from condition
      // Format expected: "server_name:tool_name:condition"
      // Example: "crm:get_customer_tier:tier=premium"
      const parts = node.condition.split(":");
      if (parts.length < 2) return { shouldProceed: false };

      const [serverName, toolName, conditionStr] = parts;

      // Fetch customer data from MCP server
      // TODO: Get actual MCP server configuration for this widget
      // For now, we'll simulate the check
      const mcpData = context.customerData || {};

      // Evaluate condition
      if (conditionStr) {
        const [key, expectedValue] = conditionStr.split("=");
        const actualValue = mcpData[key];

        if (actualValue === expectedValue) {
          return {
            shouldProceed: true,
            reason: `MCP check passed: ${key}=${expectedValue}`,
          };
        }
      }

      return { shouldProceed: false };
    } catch (error) {
      console.error("[RoutingEngine] MCP check error:", error);
      return { shouldProceed: false };
    }
  }

  /**
   * Find the next chatbot node in a path by traversing edges
   */
  private static async findNextChatbotInPath(
    currentNodeId: string,
    config: RoutingConfig,
    context: RoutingContext
  ): Promise<{ chatbotId: number; reason: string } | null> {
    const outgoingEdges = config.edges.filter((edge) => edge.source === currentNodeId);

    for (const edge of outgoingEdges) {
      const targetNode = config.nodes.find((node) => node.id === edge.target);
      if (!targetNode) continue;

      if (targetNode.type === "chatbot" && targetNode.chatbotId) {
        return {
          chatbotId: targetNode.chatbotId,
          reason: `Routed via ${targetNode.label}`,
        };
      }

      // Recursively check next nodes
      const result = await this.findNextChatbotInPath(targetNode.id, config, context);
      if (result) return result;
    }

    return null;
  }

  /**
   * Perform chatbot handoff
   */
  static async handoffChatbot(
    sessionId: number,
    targetChatbotId: number,
    reason: string
  ): Promise<boolean> {
    try {
      // End the current chatbot assignment
      const history = await db.getSessionChatbotHistory(sessionId);
      const current = history.find(h => !h.endedAt);

      if (current) {
        // Mark current assignment as ended
        // Note: LocalDB doesn't have update method for history, so we'll recreate
        // This is a limitation that should be addressed
      }

      // Assign new chatbot
      await db.createSessionChatbotHistory({
        sessionId,
        chatbotId: targetChatbotId,
        handoffReason: reason,
      });

      return true;
    } catch (error) {
      console.error("[RoutingEngine] Handoff error:", error);
      return false;
    }
  }

  /**
   * Process a message through the routing engine
   */
  static async processMessage(
    sessionId: number,
    widgetId: number,
    userMessage: string,
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }>
  ): Promise<{
    response: string;
    chatbotId: number;
    handoffOccurred: boolean;
    handoffReason?: string;
  } | null> {
    // Get or initialize current chatbot
    let currentChatbot = await this.getCurrentChatbot(sessionId);
    if (!currentChatbot) {
      currentChatbot = await this.initializeSession(sessionId, widgetId);
      if (!currentChatbot) return null;
    }

    // Evaluate if routing/handoff is needed
    const routingDecision = await this.evaluateRouting({
      sessionId,
      widgetId,
      conversationHistory: [...conversationHistory, { role: "user", content: userMessage }],
    });

    let handoffOccurred = false;
    let handoffReason: string | undefined;

    // Perform handoff if needed
    if (routingDecision.shouldHandoff && routingDecision.targetChatbotId) {
      const success = await this.handoffChatbot(
        sessionId,
        routingDecision.targetChatbotId,
        routingDecision.reason || "Routing condition met"
      );

      if (success) {
        handoffOccurred = true;
        handoffReason = routingDecision.reason;

        // Get the new chatbot
        const newChatbot = await db.getChatbotById(routingDecision.targetChatbotId);
        if (newChatbot) {
          currentChatbot = newChatbot;
        }
      }
    }

    // Generate response using the current (or newly assigned) chatbot
    const response = await generateChatbotResponse(
      currentChatbot.id,
      userMessage,
      conversationHistory
    );

    return {
      response,
      chatbotId: currentChatbot.id,
      handoffOccurred,
      handoffReason,
    };
  }
}
