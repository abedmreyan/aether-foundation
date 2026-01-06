import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { db } from "../database";
import { RoutingEngine } from "./routingEngine";

let io: SocketIOServer | null = null;

export function initializeSocket(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    path: "/socket.io",
  });

  io.on("connection", (socket) => {
    console.log("[Socket.io] Client connected:", socket.id);

    // Join room based on role
    socket.on("join:agent", async (data: { userId: number }) => {
      const agentRoom = `agent:${data.userId}`;
      socket.join(agentRoom);
      console.log(`[Socket.io] Agent ${data.userId} joined room ${agentRoom}`);

      // Update agent status to available
      await db.upsertAgent({ userId: data.userId, status: "available" });

      // Send current sessions to agent
      const userWidgets = await db.getWidgetsByUserId(data.userId);
      const allSessions = [];
      for (const widget of userWidgets) {
        const widgetSessions = await db.getSessionsByWidgetId(widget.id);
        allSessions.push(...widgetSessions);
      }
      socket.emit("sessions:list", allSessions);
    });

    socket.on("join:visitor", (data: { sessionId: number }) => {
      const sessionRoom = `session:${data.sessionId}`;
      socket.join(sessionRoom);
      console.log(`[Socket.io] Visitor joined session ${data.sessionId}`);
    });

    // Agent accepts a session
    socket.on("session:accept", async (data: { sessionId: number; agentId: number }) => {
      try {
        await db.updateSession(data.sessionId, {
          status: "active",
          agentId: data.agentId,
        });

        const session = await db.getSessionById(data.sessionId);

        // Notify agent
        io?.to(`agent:${data.agentId}`).emit("session:accepted", session);

        // Notify visitor
        io?.to(`session:${data.sessionId}`).emit("session:started", {
          sessionId: data.sessionId,
          status: "active",
        });

        console.log(`[Socket.io] Session ${data.sessionId} accepted by agent ${data.agentId}`);
      } catch (error) {
        console.error("[Socket.io] Error accepting session:", error);
        socket.emit("error", { message: "Failed to accept session" });
      }
    });

    // Send message
    socket.on("message:send", async (data: {
      sessionId: number;
      content: string;
      senderType: "visitor" | "agent";
      senderId: string;
      senderName?: string;
    }) => {
      try {
        const message = await db.createMessage({
          sessionId: data.sessionId,
          content: data.content,
          senderType: data.senderType,
          senderId: data.senderId,
          senderName: data.senderName,
        });

        // Broadcast to session room
        io?.to(`session:${data.sessionId}`).emit("message:received", message);

        // Get session to notify agent
        const session = await db.getSessionById(data.sessionId);
        if (session && session.agentId) {
          io?.to(`agent:${session.agentId}`).emit("message:received", message);
        }

        // If message is from visitor and session has no agent, use AI routing
        if (data.senderType === "visitor" && session && !session.agentId) {
          // Get conversation history
          const messages = await db.getMessagesBySessionId(data.sessionId);
          const conversationHistory = messages.map((msg) => ({
            role: (msg.senderType === "visitor" ? "user" : "assistant") as "user" | "assistant",
            content: msg.content,
          }));

          // Process through routing engine
          const routingResult = await RoutingEngine.processMessage(
            data.sessionId,
            session.widgetId,
            data.content,
            conversationHistory
          );

          if (routingResult) {
            // Send AI response
            const aiMessage = await db.createMessage({
              sessionId: data.sessionId,
              content: routingResult.response,
              senderType: "agent",
              senderId: `chatbot-${routingResult.chatbotId}`,
              senderName: "AI Assistant",
            });

            io?.to(`session:${data.sessionId}`).emit("message:received", aiMessage);

            // If handoff occurred, notify
            if (routingResult.handoffOccurred) {
              io?.to(`session:${data.sessionId}`).emit("chatbot:handoff", {
                sessionId: data.sessionId,
                newChatbotId: routingResult.chatbotId,
                reason: routingResult.handoffReason,
              });
            }
          }
        }

        console.log(`[Socket.io] Message sent in session ${data.sessionId}`);
      } catch (error) {
        console.error("[Socket.io] Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Typing indicator
    socket.on("typing:start", (data: { sessionId: number; senderType: "visitor" | "agent" }) => {
      socket.to(`session:${data.sessionId}`).emit("typing:start", data);
    });

    socket.on("typing:stop", (data: { sessionId: number; senderType: "visitor" | "agent" }) => {
      socket.to(`session:${data.sessionId}`).emit("typing:stop", data);
    });

    // End session
    socket.on("session:end", async (data: { sessionId: number }) => {
      try {
        await db.updateSession(data.sessionId, {
          status: "ended",
          endedAt: new Date(),
        });

        io?.to(`session:${data.sessionId}`).emit("session:ended", {
          sessionId: data.sessionId,
        });

        console.log(`[Socket.io] Session ${data.sessionId} ended`);
      } catch (error) {
        console.error("[Socket.io] Error ending session:", error);
      }
    });

    // Agent status update
    socket.on("agent:status", async (data: { userId: number; status: "available" | "busy" | "offline" }) => {
      try {
        await db.upsertAgent({ userId: data.userId, status: data.status });
        console.log(`[Socket.io] Agent ${data.userId} status updated to ${data.status}`);
      } catch (error) {
        console.error("[Socket.io] Error updating agent status:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("[Socket.io] Client disconnected:", socket.id);
    });
  });

  console.log("[Socket.io] WebSocket server initialized");
  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

// Helper to notify agents of new sessions
export async function notifyNewSession(sessionId: number, widgetId: number) {
  if (!io) return;

  const session = await db.getSessionById(sessionId);
  const widget = await db.getWidgetById(widgetId);

  if (session && widget) {
    // Notify all agents of this widget owner
    io.to(`agent:${widget.userId}`).emit("session:new", session);
    console.log(`[Socket.io] Notified agent ${widget.userId} of new session ${sessionId}`);
  }
}
