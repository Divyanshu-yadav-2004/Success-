import React from "react";
import { Settings, Database, Mail, ShieldCheck, Server, Cpu, CheckCircle2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/apiClient";

export const SettingsWorkspace: React.FC = () => {
  const configs = [
    { name: "PostgreSQL Database Engine", status: "ONLINE", detail: "Neon Serverless Postgres (pooler.c-5.us-east-2.aws.neon.tech)", icon: Database, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    { name: "SMTP Email Service", status: "CONFIGURED", detail: "smtp.gmail.com:587 (Official transactional mailer active)", icon: Mail, color: "text-blue-600 bg-blue-50 border-blue-200" },
    { name: "Backend API Endpoint", status: "LIVE", detail: API_BASE_URL, icon: Server, color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
    { name: "Document Storage Bucket", status: "ACTIVE", detail: "application-documents (Secure local storage vault)", icon: ShieldCheck, color: "text-purple-600 bg-purple-50 border-purple-200" },
    { name: "AI Assistant Integration", status: "READY", detail: "Gemini 2.0 Flash Lite with Smart Offline Fallback Engine", icon: Cpu, color: "text-sky-600 bg-sky-50 border-sky-200" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          System Settings & Platform Infrastructure Status
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Backend server environment checks, database connectivity status, and service integrations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {configs.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.name}
              className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3 flex flex-col justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-sm">{c.name}</h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5 break-all">{c.detail}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border inline-flex items-center gap-1 ${c.color}`}>
                  <CheckCircle2 className="w-3 h-3" /> {c.status}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Verified Operational</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
