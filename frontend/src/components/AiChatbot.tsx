import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/apiClient";
import {
  Bot,
  X,
  Send,
  Loader2,
  Sparkles,
  FileText,
  UserCheck,
  RefreshCw,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import ChatMessageContent from "@/components/ChatMessageContent";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export default function AiChatbot() {
  const { session, profile, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Namaste ${profile?.full_name || "Citizen"}! I am your official Success MP Online AI Assistant. How can I help you with your application or government services today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Only render if authenticated
  if (!session) return null;

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input.trim();
    if (!query || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      // Prepare history payload for API
      const historyPayload = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await apiRequest<{ reply: string }>("/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message: query,
          history: historyPayload,
        }),
      });

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res.reply || "I have retrieved your request.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Sorry, I encountered an issue accessing the server database: ${err.message || "Network error"}. Please try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: "assistant",
        content: `Namaste ${
          profile?.full_name || "Citizen"
        }! I am your official Success MP Online AI Assistant. How can I help you with your application or government services today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-24 z-50">
          <button
            onClick={() => setIsOpen(true)}
            className="group flex items-center gap-2.5 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white px-4 py-3 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 border border-blue-400/30"
            aria-label="Open AI Assistant"
          >
            <div className="relative flex items-center justify-center">
              <Bot className="w-6 h-6 text-yellow-300 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-blue-900" />
            </div>
            <span className="font-medium text-sm pr-1 hidden sm:inline-block">
              AI Portal Assistant
            </span>
            <Sparkles className="w-4 h-4 text-yellow-300 opacity-80 group-hover:rotate-12 transition-transform" />
          </button>
        </div>
      )}

      {/* Chat Window Container */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 flex flex-col w-auto sm:w-[400px] h-[520px] max-h-[85vh] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 text-white p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center relative">
                <Bot className="w-6 h-6 text-yellow-300" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-sm tracking-wide">
                    Success MP AI Assistant
                  </h3>
                  {isAdmin && (
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-400/30">
                      ADMIN
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-blue-200/80">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Real-time DB Connection</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                title="Reset Chat Session"
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close Assistant"
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Action Chips */}
          <div className="bg-slate-50 border-b border-slate-100 p-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => handleSend("Check my applications")}
              disabled={loading}
              className="flex items-center gap-1 text-[11px] font-medium bg-white text-blue-700 hover:bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full whitespace-nowrap transition shadow-sm"
            >
              <FileText className="w-3 h-3" />
              My Applications
            </button>
            <button
              onClick={() => handleSend("What is my profile details?")}
              disabled={loading}
              className="flex items-center gap-1 text-[11px] font-medium bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap transition shadow-sm"
            >
              <UserCheck className="w-3 h-3" />
              My Profile
            </button>
            {isAdmin && (
              <button
                onClick={() => handleSend("List all portal applications")}
                disabled={loading}
                className="flex items-center gap-1 text-[11px] font-medium bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-full whitespace-nowrap transition shadow-sm"
              >
                <Sparkles className="w-3 h-3 text-amber-600" />
                All Portal Apps
              </button>
            )}
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-gradient-to-b from-slate-50/50 to-white">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-blue-900 text-yellow-300 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "bg-blue-700 text-white rounded-br-none"
                      : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-none"
                  }`}
                >
                  <ChatMessageContent content={msg.content} role={msg.role} />
                  <div
                    className={`text-[10px] mt-1.5 text-right font-medium ${
                      msg.role === "user" ? "text-blue-200" : "text-slate-400"
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 items-center text-slate-500 text-xs py-2">
                <div className="w-7 h-7 rounded-lg bg-blue-900 text-yellow-300 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200 px-3.5 py-2 rounded-2xl rounded-bl-none flex items-center gap-2 text-slate-600">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="font-medium text-xs">Querying database...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-slate-200">
            <div className="flex items-center gap-2 bg-slate-100/80 rounded-xl px-3 py-1.5 border border-slate-200 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about application status, services..."
                className="flex-1 bg-transparent text-xs sm:text-sm text-slate-800 focus:outline-none"
                disabled={loading}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="p-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-40 disabled:hover:bg-blue-700 transition"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="text-[10px] text-center text-slate-400 mt-1.5">
              Success MP Online Official Assistant • Live Database Verified
            </div>
          </div>
        </div>
      )}
    </>
  );
}
