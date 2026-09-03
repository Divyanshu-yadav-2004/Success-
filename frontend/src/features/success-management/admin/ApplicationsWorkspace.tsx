import React, { useState } from "react";
import {
  FileText,
  Search,
  Filter,
  ShieldCheck,
  Send,
  Loader2,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { Application } from "@/lib/types";
import { SERVICES } from "@/lib/services";
import { formatApplicationId } from "@/lib/receipt";

interface ApplicationsWorkspaceProps {
  applications: Application[];
  loading: boolean;
  error: string | null;
  onSelectApp: (app: Application) => void;
  onDeliverClick: (app: Application) => void;
}

export const ApplicationsWorkspace: React.FC<ApplicationsWorkspaceProps> = ({
  applications,
  loading,
  error,
  onSelectApp,
  onDeliverClick,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");

  const filtered = applications.filter((app) => {
    const matchesStatus =
      statusFilter === "all" ||
      app.status.toLowerCase() === statusFilter.toLowerCase();

    const matchesService =
      serviceFilter === "all" || app.service_type === serviceFilter;

    const applicantName =
      app.form_data?.applicant_name ||
      app.form_data?.fullName ||
      app.applicant_name ||
      app.profiles?.full_name ||
      "";

    const matchesSearch =
      searchQuery === "" ||
      formatApplicationId(app.application_no || app.id)
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      app.service_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      applicantName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesService && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, applicant name, service..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-600 focus:bg-white transition-colors"
          />
        </div>

        {/* Filter Selectors */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-600"
            >
              <option value="all">All Services</option>
              {SERVICES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {["all", "submitted", "pending", "completed", "rejected"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                  statusFilter === st
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Applications Operations Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span>Loading application records...</span>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-600 text-xs font-bold">
            Error loading applications: {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700">No applications match current query</p>
            <p className="text-slate-400">Try adjusting your search query or filter filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="p-4">Application ID</th>
                  <th className="p-4">Citizen Applicant</th>
                  <th className="p-4">Service</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Fee Amount</th>
                  <th className="p-4">Submission Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((app) => {
                  const applicant =
                    app.form_data?.applicant_name ||
                    app.form_data?.fullName ||
                    app.applicant_name ||
                    app.profiles?.full_name ||
                    "Applicant";

                  const serviceConfig = SERVICES.find((s) => s.id === app.service_type);
                  const isCompleted = app.status === "completed" || app.status === "approved";

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4">
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 text-xs">
                          {formatApplicationId(app.application_no || app.id)}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-900">{applicant}</p>
                        <p className="text-[11px] text-slate-400">{app.form_data?.email || "—"}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-slate-800">
                          {serviceConfig?.name || app.service_type}
                        </p>
                        <p className="text-[10px] text-slate-400">{serviceConfig?.tagline || ""}</p>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isCompleted
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : app.status === "rejected"
                              ? "bg-red-100 text-red-800 border border-red-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {isCompleted ? "✅ Completed / Delivered" : app.status}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-900">
                        &#8377;{app.amount || serviceConfig?.fee || 0}
                      </td>
                      <td className="p-4 text-slate-500">
                        {new Date(app.created_at).toLocaleDateString("en-IN")}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onSelectApp(app)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> Details
                          </button>
                          <button
                            onClick={() => onDeliverClick(app)}
                            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" /> Deliver
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
