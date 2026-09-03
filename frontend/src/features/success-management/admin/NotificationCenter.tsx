import React, { useEffect, useState } from "react";
import { Bell, CheckCircle2, AlertCircle, Mail, MessageSquare, RefreshCw, Loader2 } from "lucide-react";
import { fetchDeliveryLogs } from "./admin-api";
import { DeliveryLogItem } from "../types";

export const NotificationCenter: React.FC = () => {
  const [logs, setLogs] = useState<DeliveryLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDeliveryLogs();
      setLogs(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Notification Audit Center
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trail of all in-app notifications and dispatched email notifications to citizens
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 self-start sm:self-auto cursor-pointer shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Notifications
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span>Loading notification log history...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-xs font-bold">
            Error: {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs">
            No notification logs recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="p-4">Application No</th>
                  <th className="p-4">Citizen Recipient</th>
                  <th className="p-4">Service Name</th>
                  <th className="p-4">Channel</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-mono font-bold text-blue-700">
                      {log.applicationNo}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{log.customerName}</p>
                      <p className="text-[10px] text-slate-400">{log.customerEmail}</p>
                    </td>
                    <td className="p-4 text-slate-700">{log.serviceName}</td>
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded font-bold text-[10px] inline-flex items-center gap-1">
                        {log.channel === "EMAIL" ? <Mail className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                        {log.channel}
                      </span>
                    </td>
                    <td className="p-4">
                      {log.status === "SENT" ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> SENT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 font-bold text-[11px] bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full" title={log.error || ""}>
                          <AlertCircle className="w-3 h-3" /> FAILED
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-400 text-[11px]">
                      {new Date(log.createdAt).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
