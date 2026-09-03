import React, { useState } from "react";
import {
  Search,
  Bell,
  ShieldCheck,
  Menu,
  Database,
  User,
  LogOut,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { AdminViewSection } from "./AdminSidebar";

interface AdminHeaderProps {
  currentView: AdminViewSection;
  onToggleMobileSidebar: () => void;
  onSearchQuery?: (q: string) => void;
  user: any;
  onLogout: () => void;
  unreadNotificationsCount?: number;
}

const VIEW_TITLES: Record<AdminViewSection, { title: string; subtitle: string }> = {
  overview: {
    title: "Executive Dashboard",
    subtitle: "Real-time citizen service operations & system health across Madhya Pradesh",
  },
  applications: {
    title: "Application Operations",
    subtitle: "Manage, review, process, and track all submitted citizen service applications",
  },
  "document-delivery": {
    title: "Document Delivery Workspace",
    subtitle: "Upload official certificates and deliver them directly to citizens with auto notification",
  },
  notifications: {
    title: "Notification Center",
    subtitle: "Audit log and dispatch history for in-app alerts and official emails",
  },
  announcements: {
    title: "Smart Announcements",
    subtitle: "Broadcast targeted updates and new service announcements to citizens",
  },
  citizens: {
    title: "Citizens Directory",
    subtitle: "Registered citizen users directory, contact profiles, and application history",
  },
  services: {
    title: "Services Catalog",
    subtitle: "Government service configurations, fee structures, and field requirements",
  },
  staff: {
    title: "Staff & Role Management",
    subtitle: "Internal staff members, permission assignments, and operational activity",
  },
  reports: {
    title: "Reports & Performance Analytics",
    subtitle: "Application throughput, service performance breakdown, and revenue statistics",
  },
  "activity-logs": {
    title: "System Audit & Delivery Logs",
    subtitle: "Complete audit trail of system events, status changes, and notification dispatches",
  },
  settings: {
    title: "System Configuration",
    subtitle: "Platform settings, database connection health, and mailer configuration",
  },
};

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  currentView,
  onToggleMobileSidebar,
  onSearchQuery,
  user,
  onLogout,
  unreadNotificationsCount = 0,
}) => {
  const [search, setSearch] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const meta = VIEW_TITLES[currentView] || {
    title: "Admin Panel",
    subtitle: "Success MP Online Operations",
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    if (onSearchQuery) onSearchQuery(val);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
      {/* Left: Mobile Menu Button & Breadcrumb Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Admin</span>
            <span>/</span>
            <span className="text-blue-600 truncate">{meta.title}</span>
          </div>
          <h1 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight truncate">
            {meta.title}
          </h1>
        </div>
      </div>

      {/* Right: Search, Database Status Indicator, Notification Bell, User Avatar */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Global Search input */}
        <div className="relative hidden md:block w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search applications, users..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-600 focus:bg-white transition-colors"
          />
        </div>

        {/* Database Status Pill */}
        <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-bold shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <Database className="w-3.5 h-3.5" />
          <span>Neon DB Online</span>
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu((prev) => !prev)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {(user?.profile?.fullName || user?.email || "A").charAt(0).toUpperCase()}
            </div>
            <div className="hidden lg:block text-left text-xs leading-tight">
              <p className="font-bold text-slate-900 truncate max-w-[120px]">
                {user?.profile?.fullName || "Admin"}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">
                {user?.role?.name || user?.role || "ADMIN"}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.profile?.fullName || "System Administrator"}
                </p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>
              <div className="space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Role: {user?.role?.name || user?.role || "ADMIN"}
                </div>
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
