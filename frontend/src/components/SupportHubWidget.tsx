import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/apiClient";
import {
  X,
  Send,
  Loader2,
  FileText,
  UserCheck,
  RefreshCw,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import ChatMessageContent from "@/components/ChatMessageContent";

const WHATSAPP_NUMBER = "917415921990";
const DEFAULT_WA_MESSAGE =
  "Hello! I have a query regarding MP Online services (PAN, Udyam, Gumasta, MSME).";
const HELPLINE_NUMBER = "9479336535";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

/* ==========================================================================
   CUSTOM LUCIDE-STYLE VECTOR ICONS
   ========================================================================== */

/** 3-Node Connected Support Hub Core Icon */
function SupportHubIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer Orbit Path */}
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeDasharray="2.5 2.5"
        className="opacity-70"
      />
      {/* Node 1: AI (Top) */}
      <circle cx="12" cy="4.5" r="2.2" fill="#60A5FA" />
      {/* Node 2: WhatsApp (Bottom Left) */}
      <circle cx="5.5" cy="16" r="2.2" fill="#34D399" />
      {/* Node 3: Call (Bottom Right) */}
      <circle cx="18.5" cy="16" r="2.2" fill="#FBBF24" />
      {/* Center Sparkle Core */}
      <path
        d="M12 8.8L12.7 10.9L14.8 11.6L12.7 12.3L12 14.4L11.3 12.3L9.2 11.6L11.3 10.9L12 8.8Z"
        fill="currentColor"
      />
      {/* Connecting rays */}
      <line x1="12" y1="6.7" x2="12" y2="8.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="7.4" y1="14.8" x2="10" y2="12.9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="16.6" y1="14.8" x2="14" y2="12.9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** Futuristic AI / Robot Face + Sparkle Icon */
function FuturisticAiIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Futuristic Robot Head Frame */}
      <rect
        x="3.5"
        y="6.5"
        width="17"
        height="12"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      {/* Glowing Visor Line */}
      <path
        d="M6.5 11.5H17.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Dual Cyber Eye Spheres */}
      <circle cx="9" cy="11.5" r="1.25" fill="#FEF08A" />
      <circle cx="15" cy="11.5" r="1.25" fill="#FEF08A" />
      {/* Antenna & Sparkle Emitter */}
      <line
        x1="12"
        y1="6.5"
        x2="12"
        y2="3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 1.8L12.4 2.6L13.2 3L12.4 3.4L12 4.2L11.6 3.4L10.8 3L11.6 2.6L12 1.8Z"
        fill="#FDE047"
      />
      {/* Audio Mesh Smile */}
      <path
        d="M9.5 15.5C10.2 16 11.1 16.3 12 16.3C12.9 16.3 13.8 16 14.5 15.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Lateral Sensor Nodes */}
      <rect x="1.5" y="10" width="2" height="5" rx="1" fill="currentColor" opacity="0.8" />
      <rect x="20.5" y="10" width="2" height="5" rx="1" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

/** Custom WhatsApp Chat Bubble + Embedded Phone Icon */
function WhatsAppCustomIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Distinctive Speech Bubble Body */}
      <path
        d="M12 3C7.03 3 3 7.03 3 12C3 13.67 3.46 15.23 4.26 16.58L3.25 20.25L7.05 19.27C8.35 19.98 9.84 20.4 11.41 20.4H12C16.97 20.4 21 16.37 21 11.4C21 6.43 16.97 3 12 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Embedded WhatsApp Handset Vector */}
      <path
        d="M8.6 8.9C8.4 8.4 8.2 8.4 8 8.4C7.8 8.4 7.6 8.4 7.4 8.6C7.2 8.8 6.7 9.3 6.7 10.3C6.7 11.3 7.4 12.3 7.5 12.5C7.6 12.6 8.9 14.7 11 15.6C12.7 16.3 13.1 16.1 13.5 16.1C13.9 16.1 14.8 15.6 15 15.1C15.2 14.6 15.2 14.2 15.1 14.1C15 14 14.8 13.9 14.5 13.8C14.2 13.6 12.9 13 12.7 12.9C12.5 12.8 12.3 12.8 12.2 13C12 13.2 11.6 13.7 11.4 13.9C11.3 14.1 11.1 14.1 10.8 14C10.5 13.8 9.6 13.5 8.5 12.6C7.7 11.8 7.1 10.9 7 10.6C6.9 10.4 7 10.2 7.1 10.1C7.2 10 7.4 9.8 7.5 9.6C7.6 9.5 7.6 9.4 7.7 9.2C7.8 9.1 7.7 9 7.6 8.9Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Elegant Phone Handset + Radiating Signal Waves Icon */
function PhoneWaveIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Modern Tilted Handset */}
      <path
        d="M13.5 15.5C12.1 14.7 10.8 13.5 10 12.1L11.4 10.7C11.7 10.4 11.8 9.9 11.6 9.5L10.3 5.4C10.1 4.8 9.5 4.4 8.9 4.5L5.4 5.2C4.7 5.3 4.2 5.9 4.3 6.6C4.9 13.6 10.4 19.1 17.4 19.7C18.1 19.8 18.7 19.3 18.8 18.6L19.5 15.1C19.6 14.5 19.2 13.9 18.6 13.7L14.5 12.4C14.1 12.2 13.6 12.3 13.3 12.6L13.5 15.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner Signal Wave */}
      <path
        d="M15.5 5.5C17.2 6.8 18.2 8.8 18.2 11"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Outer Signal Wave */}
      <path
        d="M18.5 2.5C21 4.8 22.5 8 22.5 11.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.75"
      />
    </svg>
  );
}

/* ==========================================================================
   SUPPORT HUB WIDGET COMPONENT
   ========================================================================== */

export default function SupportHubWidget() {
  const { session, profile, isAdmin } = useAuth();

  // Navigation menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Chatbot State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Namaste ${
        profile?.full_name || "Citizen"
      }! I am your official Success MP Online AI Assistant. How can I help you with your application or government services today?`,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (chatOpen) {
      scrollToBottom();
    }
  }, [messages, chatOpen]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  // Handle AI Chat send
  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input.trim();
    if (!query || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
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
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Sorry, I encountered an issue accessing the server database: ${
          err.message || "Network error"
        }. Please try again.`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
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
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  if (!session) return null;

  return (
    <div ref={menuRef} className="fixed bottom-4 right-4 z-[70] select-none">
      {/* ====================================================================
          1. AI CHATBOT WINDOW (Renders when AI Assistant option selected)
         ==================================================================== */}
      {chatOpen && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 flex flex-col w-auto sm:w-[420px] h-[540px] max-h-[85vh] max-w-[calc(100vw-2rem)] bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 text-white p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center relative shadow-lg shadow-blue-500/20">
                <FuturisticAiIcon className="w-5 h-5 text-white" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm tracking-wide">
                    Success MP AI Assistant
                  </h3>
                  {isAdmin && (
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-400/30">
                      ADMIN
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-blue-200/80">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verified Database AI</span>
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
                onClick={() => setChatOpen(false)}
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
              className="flex items-center gap-1 text-[11px] font-semibold bg-white text-blue-700 hover:bg-blue-50 border border-blue-200 px-3 py-1 rounded-full whitespace-nowrap transition shadow-sm"
            >
              <FileText className="w-3 h-3" />
              My Applications
            </button>
            <button
              onClick={() => handleSend("What is my profile details?")}
              disabled={loading}
              className="flex items-center gap-1 text-[11px] font-semibold bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 px-3 py-1 rounded-full whitespace-nowrap transition shadow-sm"
            >
              <UserCheck className="w-3 h-3" />
              My Profile
            </button>
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
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    <FuturisticAiIcon className="w-4 h-4 text-yellow-300" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
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
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <FuturisticAiIcon className="w-4 h-4 text-yellow-300" />
                </div>
                <div className="bg-white border border-slate-200 px-3.5 py-2 rounded-2xl rounded-bl-none flex items-center gap-2 text-slate-600 shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="font-semibold text-xs">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-slate-200">
            <div className="flex items-center gap-2 bg-slate-100/90 rounded-2xl px-3.5 py-2 border border-slate-200 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about status, documents, or fees..."
                className="flex-1 bg-transparent text-xs sm:text-sm text-slate-800 focus:outline-none"
                disabled={loading}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 transition shadow-md shadow-blue-600/20"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          2. EXPANDABLE 3-OPTION SUPPORT MENU (SEQUENTIAL SPRING ANIMATION)
         ==================================================================== */}
      <div className="flex flex-col items-end gap-3 mb-3">
        {/* OPTION 3: CALL US (Top) */}
        <div
          style={{
            transitionDelay: menuOpen ? "140ms" : "0ms",
          }}
          className={`flex items-center gap-3 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform ${
            menuOpen
              ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
              : "opacity-0 translate-y-6 scale-75 pointer-events-none"
          }`}
        >
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 text-slate-900 shadow-xl px-3.5 py-1.5 rounded-2xl text-right transition group-hover:border-amber-400">
            <p className="text-xs font-bold leading-tight">Call Helpline</p>
            <p className="text-[10px] text-slate-500 font-medium">
              9479336535
            </p>
          </div>
          <a
            href={`tel:${HELPLINE_NUMBER}`}
            onClick={() => setMenuOpen(false)}
            aria-label="Call Helpline"
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-110 active:scale-95 transition-all duration-200 group border border-amber-300/40"
          >
            <PhoneWaveIcon className="w-6 h-6 text-white group-hover:rotate-12 transition-transform duration-300" />
          </a>
        </div>

        {/* OPTION 2: WHATSAPP CHAT (Middle) */}
        <div
          style={{
            transitionDelay: menuOpen ? "80ms" : "40ms",
          }}
          className={`flex items-center gap-3 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform ${
            menuOpen
              ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
              : "opacity-0 translate-y-6 scale-75 pointer-events-none"
          }`}
        >
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 text-slate-900 shadow-xl px-3.5 py-1.5 rounded-2xl text-right">
            <p className="text-xs font-bold leading-tight">WhatsApp Chat</p>
            <p className="text-[10px] text-slate-500 font-medium">
              Official WhatsApp support
            </p>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
              DEFAULT_WA_MESSAGE
            )}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => setMenuOpen(false)}
            aria-label="Chat on WhatsApp"
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-110 active:scale-95 transition-all duration-200 group border border-emerald-300/40"
          >
            <WhatsAppCustomIcon className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" />
          </a>
        </div>

        {/* OPTION 1: AI ASSISTANT (Bottom) */}
        <div
          style={{
            transitionDelay: menuOpen ? "20ms" : "80ms",
          }}
          className={`flex items-center gap-3 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform ${
            menuOpen
              ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
              : "opacity-0 translate-y-6 scale-75 pointer-events-none"
          }`}
        >
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 text-slate-900 shadow-xl px-3.5 py-1.5 rounded-2xl text-right">
            <div className="flex items-center justify-end gap-1">
              <p className="text-xs font-bold leading-tight">AI Assistant</p>
              <span className="text-[10px] text-yellow-500">✨</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              Instant AI guidance 24/7
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setChatOpen(true);
            }}
            aria-label="Open AI Assistant"
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-110 active:scale-95 transition-all duration-200 group border border-indigo-300/40"
          >
            <FuturisticAiIcon className="w-6 h-6 text-yellow-300 group-hover:rotate-12 transition-transform duration-300" />
          </button>
        </div>
      </div>

      {/* ====================================================================
          3. MAIN FLOATING SUPPORT HUB BUTTON (TRIGGERS MENU EXPANSION)
         ==================================================================== */}
      <button
        type="button"
        onClick={() => {
          if (chatOpen) {
            setChatOpen(false);
          } else {
            setMenuOpen((prev) => !prev);
          }
        }}
        aria-label="Toggle Support Hub"
        className="relative group flex items-center justify-center w-12 h-12 rounded-full bg-white/95 text-slate-700 shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all duration-300 border border-slate-200/80 focus:outline-none z-[70]"
      >
        {/* Glowing Outer Ring Pulse */}
        <span className="absolute -inset-1 rounded-full border border-blue-200/80 opacity-70 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Dynamic Inner Icon: Morphs into Close 'X' or Support Hub Icon */}
        <div
          className={`relative z-10 flex items-center justify-center transition-transform duration-300 ${
            menuOpen || chatOpen ? "rotate-90 scale-110" : "rotate-0 scale-100"
          }`}
        >
          {menuOpen || chatOpen ? (
            <X className="w-5 h-5 text-slate-700 stroke-[2.5]" />
          ) : (
            <SupportHubIcon className="w-5 h-5 text-slate-700" />
          )}
        </div>

        {/* Status indicator dot */}
        {!menuOpen && !chatOpen && (
          <span className="absolute top-1 right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white z-20 shadow-sm" />
        )}
      </button>
    </div>
  );
}
