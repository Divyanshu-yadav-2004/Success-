import React, { useState } from "react";
import { Send, FileUp, CheckCircle2, Clock, Search, Filter, Loader2, ShieldCheck } from "lucide-react";
import { Application } from "@/lib/types";
import { formatApplicationId } from "@/lib/receipt";
import { SERVICES } from "@/lib/services";

interface DocumentDeliveryWorkspaceProps {
  applications: Application[];
  loading: boolean;
  onDeliverClick: (app: Application) => void;
}

export const DocumentDeliveryWorkspace: React.FC<DocumentDeliveryWorkspaceProps> = ({
  applications,
  loading,
  onDeliverClick,
}) => {
  const [search, setSearch] = useState("");

  const deliveryQueue = applications.filter((app) => {
    const applicant =
      app.form_data?.applicant_name ||
      app.form_data?.fullName ||
      app.applicant_name ||
      app.profiles?.full_name ||
      "";
    const matchesSearch =
      search === "" ||
      formatApplicationId(app.application_no || app.id).toLowerCase().includes(search.toLowerCase()) ||
      applicant.toLowerCase().includes(search.toLowerCase()) ||
      app.service_type.toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Workspace Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 sm:p-8 rounded-3xl border border-blue-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-blue-800/80 border border-blue-700/80 rounded-full text-[11px] font-bold text-blue-200 uppercase tracking-wider">
            Official Document Delivery Hub
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold mt-2">
            Secure Citizen Document Dispatch
          </h2>
          <p className="text-xs text-blue-200 mt-1 max-w-xl">
            Upload processed PDF certificates (PAN Cards, Gumasta Licenses, Income Certificates, MSME) and automatically dispatch in-app alerts + confirmation emails to citizens.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-blue-950/60 p-4 rounded-2xl border border-blue-800/60 text-xs">
          <FileUp className="w-8 h-8 text-blue-400 shrink-0" />
          <div>
            <p className="font-bold text-white">Auto Email & In-App Alerts</p>
            <p className="text-[11px] text-blue-300">PDF download link dispatched directly upon confirmation</p>
          </div>
        </div>
      </div>

      {/* Control bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search queue by ID, citizen, service..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-600 focus:bg-white"
          />
        </div>

        <p className="text-xs text-slate-500 font-semibold">
          Showing <strong className="text-slate-900">{deliveryQueue.length}</strong> application records
        </p>
      </div>

      {/* Queue Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2 text-xs">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span>Loading delivery queue...</span>
        </div>
      ) : deliveryQueue.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 text-slate-400 text-xs">
          No applications in delivery queue matching query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deliveryQueue.map((app) => {
            const applicant =
              app.form_data?.applicant_name ||
              app.form_data?.fullName ||
              app.applicant_name ||
              app.profiles?.full_name ||
              "Applicant";
            const serviceConfig = SERVICES.find((s) => s.id === app.service_type);
            const isCompleted = app.status === "completed" || app.status === "approved";

            return (
              <div
                key={app.id}
                className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                      {formatApplicationId(app.application_no || app.id)}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isCompleted ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {isCompleted ? "✅ Delivered" : "⏳ Ready for Delivery"}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm">
                    {serviceConfig?.name || app.service_type}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Citizen: <strong className="text-slate-800">{applicant}</strong>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Submitted: {new Date(app.created_at).toLocaleDateString("en-IN")}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">&#8377;{app.amount || serviceConfig?.fee || 0}</span>
                  <button
                    onClick={() => onDeliverClick(app)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> {isCompleted ? "Re-deliver Document" : "Deliver Document"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
