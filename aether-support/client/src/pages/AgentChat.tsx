import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, MessageCircle, Send, User, Clock, CheckCircle2, Bell, BellOff, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";

interface Session {
  id: number;
  widgetId: number;
  type: string;
  status: string;
  visitorName?: string;
  visitorEmail?: string;
  visitorId: string;
  agentId?: number;
  startedAt: Date;
  endedAt?: Date;
}

interface Message {
  id: number;
  sessionId: number;
  senderType: "visitor" | "agent";
  senderId: string;
  senderName?: string;
  content: string;
  createdAt: Date;
}

export default function AgentChat() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [widgetFilter, setWidgetFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [agentStatus, setAgentStatus] = useState<"available" | "busy" | "offline">("available");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showCannedResponses, setShowCannedResponses] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);

  const widgetsQuery = trpc.widget.list.useQuery();
  const cannedResponsesQuery = trpc.cannedResponse.list.useQuery();
  const agentStatusQuery = trpc.agent.status.useQuery();
  const updateAgentStatusMutation = trpc.agent.updateStatus.useMutation();

  const messagesQuery = trpc.message.list.useQuery(
    { sessionId: activeSessionId! },
    { enabled: !!activeSessionId, refetchInterval: false }
  );

  const sendMessageMutation = trpc.message.sendAsAgent.useMutation();

  // Initialize Socket.io
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const newSocket = io(window.location.origin, {
      path: "/socket.io",
    });

    newSocket.on("connect", () => {
      console.log("[Socket.io] Connected");
      newSocket.emit("join:agent", { userId: user.id });
    });

    newSocket.on("sessions:list", (sessionsList: Session[]) => {
      console.log("[Socket.io] Received sessions list:", sessionsList);
      setSessions(sessionsList.filter(s => s.status !== "ended"));
    });

    newSocket.on("session:new", (session: Session) => {
      console.log("[Socket.io] New session:", session);
      setSessions(prev => [session, ...prev]);
      toast.info("New chat session incoming!");
      
      // Browser notification
      if (notificationsEnabled && Notification.permission === "granted") {
        new Notification("New Chat Session", {
          body: `${session.visitorName || 'A visitor'} started a chat`,
          icon: APP_LOGO || undefined,
        });
      }
      
      // Play notification sound
      if (notificationSoundRef.current) {
        notificationSoundRef.current.play().catch(e => console.log("Audio play failed:", e));
      }
    });

    newSocket.on("session:accepted", (session: Session) => {
      console.log("[Socket.io] Session accepted:", session);
      setSessions(prev => prev.map(s => s.id === session.id ? session : s));
    });

    newSocket.on("message:received", (message: Message) => {
      console.log("[Socket.io] Message received:", message);
      if (message.sessionId === activeSessionId) {
        setMessages(prev => [...prev, message]);
      }
      
      // Notify for new messages from visitors
      if (message.senderType === "visitor" && message.sessionId !== activeSessionId) {
        if (notificationsEnabled && Notification.permission === "granted") {
          new Notification("New Message", {
            body: message.content.substring(0, 50),
            icon: APP_LOGO || undefined,
          });
        }
        if (notificationSoundRef.current) {
          notificationSoundRef.current.play().catch(e => console.log("Audio play failed:", e));
        }
      }
      
      // Update session in list to show latest activity
      setSessions(prev => {
        const updated = [...prev];
        const sessionIndex = updated.findIndex(s => s.id === message.sessionId);
        if (sessionIndex !== -1) {
          const session = updated.splice(sessionIndex, 1)[0];
          updated.unshift(session);
        }
        return updated;
      });
    });

    newSocket.on("typing:start", (data: { senderType: string }) => {
      if (data.senderType === "visitor") {
        setIsTyping(true);
      }
    });

    newSocket.on("typing:stop", (data: { senderType: string }) => {
      if (data.senderType === "visitor") {
        setIsTyping(false);
      }
    });

    newSocket.on("session:ended", (data: { sessionId: number }) => {
      console.log("[Socket.io] Session ended:", data.sessionId);
      setSessions(prev => prev.filter(s => s.id !== data.sessionId));
      if (activeSessionId === data.sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
      toast.info("Chat session ended");
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user, activeSessionId, notificationsEnabled]);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          setNotificationsEnabled(true);
          toast.success("Notifications enabled!");
        }
      });
    } else if (Notification.permission === "granted") {
      setNotificationsEnabled(true);
    }
    
    // Create notification sound
    notificationSoundRef.current = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltryxnMpBSh+zPLaizsIGGS57OihUBELTKXh8bllHAU2jdXzzn0vBSp7yvDejj0JFmm97Oadr");
  }, []);

  // Update agent status
  const handleStatusChange = async (newStatus: "available" | "busy" | "offline") => {
    setAgentStatus(newStatus);
    await updateAgentStatusMutation.mutateAsync({ status: newStatus });
    if (socket) {
      socket.emit("agent:status", { userId: user?.id, status: newStatus });
    }
    toast.success(`Status updated to ${newStatus}`);
  };

  // Toggle notifications
  const toggleNotifications = () => {
    if (!notificationsEnabled && Notification.permission !== "granted") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          setNotificationsEnabled(true);
          toast.success("Notifications enabled!");
        } else {
          toast.error("Notification permission denied");
        }
      });
    } else {
      setNotificationsEnabled(!notificationsEnabled);
      toast.info(notificationsEnabled ? "Notifications disabled" : "Notifications enabled");
    }
  };

  // Load messages when active session changes
  useEffect(() => {
    if (activeSessionId && messagesQuery.data) {
      setMessages(messagesQuery.data as Message[]);
    } else {
      setMessages([]);
    }
  }, [activeSessionId, messagesQuery.data]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAcceptSession = (sessionId: number) => {
    if (!user || !socket) return;
    
    socket.emit("session:accept", { sessionId, agentId: user.id });
    setActiveSessionId(sessionId);
    toast.success("Session accepted");
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeSessionId || !user || !socket) return;

    const content = messageInput.trim();
    setMessageInput("");

    // Stop typing indicator
    socket.emit("typing:stop", { sessionId: activeSessionId, senderType: "agent" });

    // Send via Socket.io for real-time delivery
    socket.emit("message:send", {
      sessionId: activeSessionId,
      content,
      senderType: "agent",
      senderId: user.id.toString(),
      senderName: user.name || "Agent",
    });

    // Also save to database via tRPC
    try {
      await sendMessageMutation.mutateAsync({
        sessionId: activeSessionId,
        content,
      });
    } catch (error) {
      console.error("Failed to save message:", error);
    }
  };

  const handleInputChange = (value: string) => {
    setMessageInput(value);

    if (!socket || !activeSessionId) return;

    // Send typing indicator
    socket.emit("typing:start", { sessionId: activeSessionId, senderType: "agent" });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing:stop", { sessionId: activeSessionId, senderType: "agent" });
    }, 2000);
  };

  const handleEndSession = () => {
    if (!activeSessionId || !socket) return;

    socket.emit("session:end", { sessionId: activeSessionId });
    setActiveSessionId(null);
    setMessages([]);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to access the agent dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Log In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Apply filters
  const filteredSessions = sessions.filter(session => {
    // Status filter
    if (statusFilter !== "all" && session.status !== statusFilter) {
      return false;
    }

    // Widget filter
    if (widgetFilter !== "all" && session.widgetId.toString() !== widgetFilter) {
      return false;
    }

    // Date filter
    if (dateFrom && new Date(session.startedAt) < dateFrom) {
      return false;
    }
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      if (new Date(session.startedAt) > endOfDay) {
        return false;
      }
    }

    // Search filter (by visitor name/email/id)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = session.visitorName?.toLowerCase().includes(query);
      const matchesEmail = session.visitorEmail?.toLowerCase().includes(query);
      const matchesId = session.visitorId.toLowerCase().includes(query);
      if (!matchesName && !matchesEmail && !matchesId) {
        return false;
      }
    }

    return true;
  });

  const activeSession = filteredSessions.find(s => s.id === activeSessionId);
  const waitingSessions = filteredSessions.filter(s => s.status === "waiting");
  const activeSessions = filteredSessions.filter(s => s.status === "active");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <a className="flex items-center gap-2">
              {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="h-8" />}
              <span className="text-xl font-bold text-slate-900">{APP_TITLE}</span>
            </a>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/widgets">
              <a className="text-slate-600 hover:text-slate-900">Widgets</a>
            </Link>
            <Link href="/dashboard">
              <a className="text-slate-600 hover:text-slate-900">Dashboard</a>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleNotifications}
              className="flex items-center gap-2"
            >
              {notificationsEnabled ? (
                <Bell className="h-4 w-4 text-blue-600" />
              ) : (
                <BellOff className="h-4 w-4 text-slate-400" />
              )}
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">{user?.name}</span>
              <Select value={agentStatus} onValueChange={(value: any) => handleStatusChange(value)}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4">
        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-120px)]">
          {/* Sessions List */}
          <div className="col-span-4">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">Chat Sessions</CardTitle>
                <CardDescription>
                  {waitingSessions.length} waiting • {activeSessions.length} active
                </CardDescription>
                
                {/* Filters */}
                <div className="space-y-3 mt-4">
                  {/* Search */}
                  <Input
                    placeholder="Search by name, email, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9"
                  />
                  
                  <div className="grid grid-cols-2 gap-2">
                    {/* Status Filter */}
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="waiting">Waiting</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="ended">Ended</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Widget Filter */}
                    <Select value={widgetFilter} onValueChange={setWidgetFilter}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Widget" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Widgets</SelectItem>
                        {widgetsQuery.data?.map((widget) => (
                          <SelectItem key={widget.id} value={widget.id.toString()}>
                            {widget.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range Filter */}
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="h-9 flex-1 justify-start text-left font-normal">
                          <Clock className="mr-2 h-4 w-4" />
                          {dateFrom ? format(dateFrom, "MMM d") : "From"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateFrom}
                          onSelect={setDateFrom}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="h-9 flex-1 justify-start text-left font-normal">
                          <Clock className="mr-2 h-4 w-4" />
                          {dateTo ? format(dateTo, "MMM d") : "To"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateTo}
                          onSelect={setDateTo}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Clear Filters */}
                  {(statusFilter !== "all" || widgetFilter !== "all" || dateFrom || dateTo || searchQuery) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-full"
                      onClick={() => {
                        setStatusFilter("all");
                        setWidgetFilter("all");
                        setDateFrom(undefined);
                        setDateTo(undefined);
                        setSearchQuery("");
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full">
                  <div className="space-y-2 p-4">
                    {waitingSessions.length === 0 && activeSessions.length === 0 && (
                      <div className="text-center py-8 text-slate-500">
                        <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No active sessions</p>
                      </div>
                    )}

                    {waitingSessions.map((session) => (
                      <Card
                        key={session.id}
                        className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                          activeSessionId === session.id ? "ring-2 ring-blue-500" : ""
                        }`}
                        onClick={() => handleAcceptSession(session.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-slate-400" />
                              <span className="font-medium text-sm">
                                {session.visitorName || `Visitor ${session.visitorId.slice(-6)}`}
                              </span>
                            </div>
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              Waiting
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="h-3 w-3" />
                            {new Date(session.startedAt).toLocaleTimeString()}
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {activeSessions.map((session) => (
                      <Card
                        key={session.id}
                        className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                          activeSessionId === session.id ? "ring-2 ring-blue-500" : ""
                        }`}
                        onClick={() => setActiveSessionId(session.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-slate-400" />
                              <span className="font-medium text-sm">
                                {session.visitorName || `Visitor ${session.visitorId.slice(-6)}`}
                              </span>
                            </div>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Active
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="h-3 w-3" />
                            {new Date(session.startedAt).toLocaleTimeString()}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="col-span-8">
            <Card className="h-full flex flex-col">
              {activeSession ? (
                <>
                  <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {activeSession.visitorName || `Visitor ${activeSession.visitorId.slice(-6)}`}
                        </CardTitle>
                        <CardDescription>
                          {activeSession.visitorEmail || "No email provided"}
                        </CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleEndSession}>
                        End Session
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 overflow-hidden p-0">
                    <ScrollArea className="h-full p-4">
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.senderType === "agent" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                message.senderType === "agent"
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-200 text-slate-900"
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p className="text-xs mt-1 opacity-70">
                                {new Date(message.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        {isTyping && (
                          <div className="flex justify-start">
                            <div className="bg-slate-200 rounded-lg px-4 py-2">
                              <div className="flex gap-1">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>
                  </CardContent>

                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Popover open={showCannedResponses} onOpenChange={setShowCannedResponses}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Zap className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="start">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Quick Replies</h4>
                            <ScrollArea className="h-48">
                              {cannedResponsesQuery.data && cannedResponsesQuery.data.length > 0 ? (
                                <div className="space-y-2">
                                  {cannedResponsesQuery.data.map((response: any) => (
                                    <Button
                                      key={response.id}
                                      variant="ghost"
                                      className="w-full justify-start text-left h-auto py-2"
                                      onClick={() => {
                                        setMessageInput(response.content);
                                        setShowCannedResponses(false);
                                      }}
                                    >
                                      <div>
                                        <div className="font-medium text-sm">{response.title}</div>
                                        <div className="text-xs text-slate-500 truncate">{response.content}</div>
                                      </div>
                                    </Button>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-slate-500">No quick replies yet</p>
                              )}
                            </ScrollArea>
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Input
                        placeholder="Type your message..."
                        value={messageInput}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                        className="flex-1"
                      />
                      <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No session selected</p>
                    <p className="text-sm">Select a session from the list to start chatting</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
