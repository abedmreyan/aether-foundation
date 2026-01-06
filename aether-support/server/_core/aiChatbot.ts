import { invokeLLM } from './llm';
import * as db from '../db';

interface McpServerResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Fetch context from MCP server
 */
async function fetchMcpContext(server: any, query: string): Promise<string> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authentication based on type
    if (server.authType === 'bearer' && server.authToken) {
      headers['Authorization'] = `Bearer ${server.authToken}`;
    } else if (server.authType === 'api_key' && server.authToken) {
      headers['X-API-Key'] = server.authToken;
    } else if (server.authType === 'basic' && server.authToken) {
      headers['Authorization'] = `Basic ${server.authToken}`;
    }

    const response = await fetch(server.serverUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      console.error(`[MCP] Server ${server.name} returned ${response.status}`);
      return '';
    }

    const data: McpServerResponse = await response.json();
    
    if (data.success && data.data) {
      return JSON.stringify(data.data);
    }

    return '';
  } catch (error) {
    console.error(`[MCP] Error fetching from ${server.name}:`, error);
    return '';
  }
}

/**
 * Build RAG context from knowledge bases
 */
function buildRagContext(knowledgeBases: any[]): string {
  if (!knowledgeBases || knowledgeBases.length === 0) {
    return '';
  }

  const contextParts = knowledgeBases.map(kb => {
    return `[${kb.name}]\\n${kb.content}`;
  });

  return `\\n\\n=== KNOWLEDGE BASE ===\\n${contextParts.join('\\n\\n')}\\n=== END KNOWLEDGE BASE ===\\n`;
}

/**
 * Generate AI chatbot response with RAG and MCP context
 */
export async function generateChatbotResponse(
  chatbotId: number,
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<string> {
  try {
    // Get chatbot configuration
    const chatbot = await db.getChatbotById(chatbotId);
    if (!chatbot || !chatbot.isActive) {
      return "I'm sorry, this chatbot is currently unavailable.";
    }

    // Get knowledge bases for RAG
    const knowledgeBases = await db.getKnowledgeBasesByChatbotId(chatbotId);
    const ragContext = buildRagContext(knowledgeBases);

    // Get MCP servers and fetch context
    const mcpServers = await db.getMcpServersByChatbotId(chatbotId);
    const activeMcpServers = mcpServers.filter(s => s.isActive);
    
    let mcpContext = '';
    if (activeMcpServers.length > 0) {
      const mcpPromises = activeMcpServers.map(server => 
        fetchMcpContext(server, userMessage)
      );
      const mcpResults = await Promise.all(mcpPromises);
      const validResults = mcpResults.filter(r => r.length > 0);
      
      if (validResults.length > 0) {
        mcpContext = `\\n\\n=== EXTERNAL DATA (MCP) ===\\n${validResults.join('\\n\\n')}\\n=== END EXTERNAL DATA ===\\n`;
      }
    }

    // Build enhanced system prompt with context
    const enhancedSystemPrompt = `${chatbot.systemPrompt}${ragContext}${mcpContext}

${ragContext || mcpContext ? '\\nIMPORTANT: Use the provided knowledge base and external data to answer questions accurately. If the information is not in the provided context, say so honestly.' : ''}`;

    // Build messages array with conversation history
    const messages = [
      { role: 'system' as const, content: enhancedSystemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user' as const, content: userMessage },
    ];

    // Call LLM
    const response = await invokeLLM({
      messages,
    });

    const content = response.choices[0]?.message?.content;
    if (typeof content === 'string') {
      return content;
    }
    return "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error('[AI Chatbot] Error generating response:', error);
    return "I'm sorry, I encountered an error while processing your message. Please try again.";
  }
}

/**
 * Test chatbot configuration
 */
export async function testChatbot(chatbotId: number, testMessage: string = "Hello, can you help me?"): Promise<{
  success: boolean;
  response?: string;
  error?: string;
}> {
  try {
    const response = await generateChatbotResponse(chatbotId, testMessage);
    return {
      success: true,
      response,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}
