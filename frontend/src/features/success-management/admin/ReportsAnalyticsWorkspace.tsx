import React, { useEffect, useState } from "react";
import { BarChart3, TrendingUp, DollarSign, CheckCircle2, Clock, FileText, Loader2, Users } from "lucide-react";
import { fetchAdminStats } from "./admin-api";
import { AdminDashboardStats } from "../types";

export const ReportsAnalyticsWorkspace: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2 text-xs">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span>Generating analytical reports...</span>
      </div>
    );
  }

  const completionRate = stats?.totalApplications
    ? Math.round((stats.completedCount / stats.totalApplications) * 100)
    : 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          Service Operations Performance & Analytics
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Application throughput velocity, service volume distribution, and revenue summary
        </p>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Portal Applications
          </span>
          <p className="text-3xl font-black text-slate-900">{stats?.totalApplications || 0}</p>
          <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +100% Verified Submissions
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Completion Rate
          </span>
          <p className="text-3xl font-black text-emerald-600">{completionRate}%</p>
          <p className="text-xs text-slate-500 font-medium">Successfully processed & delivered</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Revenue Collected
          </span>
          <p className="text-3xl font-black text-slate-900">&#8377;{stats?.totalRevenue || 0}</p>
          <p className="text-xs text-blue-600 font-medium">Verified Razorpay / Portal Fee</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Registered Citizen Base
          </span>
          <p className="text-3xl font-black text-slate-900">{stats?.totalUsers || 0}</p>
          <p className="text-xs text-slate-500 font-medium">Active Portal Accounts</p>
        </div>
      </div>

      {/* Service Performance Volume Breakdown */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">
          Service Demand Volume & Share
        </h3>

        <div className="space-y-4">
          {stats?.serviceWiseStats?.map((st) => {
            const percentage = stats.totalApplications
              ? Math.round((st.count / stats.totalApplications) * 100)
              : 0;

            return (
              <div key={st.serviceId} className="space-y-1.5 text-xs">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>{st.serviceName} ({st.serviceCode})</span>
                  <span>{st.count} Applications ({percentage}%)</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(percentage, 5)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
