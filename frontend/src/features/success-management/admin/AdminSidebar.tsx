import React from "react";
import {
  LayoutDashboard,
  FileText,
  Send,
  Bell,
  Megaphone,
  Users,
  Briefcase,
  UserCheck,
  BarChart3,
  ListFilter,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { BrandLogo } from "../branding/BrandLogo";

export type AdminViewSection =
  | "overview"
  | "applications"
  | "document-delivery"
  | "notifications"
  | "announcements"
  | "citizens"
  | "services"
  | "staff"
  | "reports"
  | "activity-logs"
  | "settings";

interface AdminSidebarProps {
  currentView: AdminViewSection;
  onSelectView: (view: AdminViewSection) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  user: any;
  onLogout: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentView,
  onSelectView,
  collapsed,
  onToggleCollapse,
  user,
  onLogout,
}) => {
  const navGroups = [
    {
      title: "OVERVIEW",
      items: [
        { id: "overview" as AdminViewSection, label: "Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "OPERATIONS",
      items: [
        { id: "applications" as AdminViewSection, label: "Applications", icon: FileText },
        { id: "document-delivery" as AdminViewSection, label: "Document Delivery", icon: Send },
        { id: "notifications" as AdminViewSection, label: "Notifications", icon: Bell },
        { id: "announcements" as AdminViewSection, label: "Smart Announcements", icon: Megaphone },
      ],
    },
    {
      title: "MANAGEMENT",
      items: [
        { id: "citizens" as AdminViewSection, label: "Citizens / Users", icon: Users },
        { id: "services" as AdminViewSection, label: "Services Catalog", icon: Briefcase },
        { id: "staff" as AdminViewSection, label: "Staff & Roles", icon: UserCheck },
      ],
    },
    {
      title: "INSIGHTS",
      items: [
        { id: "reports" as AdminViewSection, label: "Reports & Analytics", icon: BarChart3 },
        { id: "activity-logs" as AdminViewSection, label: "Activity / Delivery Logs", icon: ListFilter },
      ],
    },
    {
      title: "SYSTEM",
      items: [
        { id: "settings" as AdminViewSection, label: "System Settings", icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={`bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-all duration-300 relative z-30 shrink-0 select-none ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Header Logo */}
      <div className="min-h-[64px] py-3 flex items-center justify-between px-3.5 border-b border-slate-800 shrink-0">
        {!collapsed ? (
          <div className="flex items-center min-w-0 flex-1 mr-1">
            <BrandLogo variant="dark" showTagline={true} isAdmin={true} />
          </div>
        ) : (
          <div className="w-10 h-10 flex items-center justify-center mx-auto">
            <img
              src="/logo.png"
              alt="SUCCESS MP ONLINE"
              className="w-9 h-9 rounded-full"
              style={{ objectFit: "contain" }}
            />
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-none">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2">
                {group.title}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition cursor-pointer group relative ${
                    isActive
                      ? "bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/25"
                      : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {isActive && !collapsed && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white ml-auto shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Admin Profile Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className={`flex items-center gap-3 p-2 rounded-xl bg-slate-800/60 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
            {(user?.profile?.fullName || user?.email || "A").charAt(0).toUpperCase()}
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-100 truncate">
                {user?.profile?.fullName || "System Admin"}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate">
                  {user?.role?.name || user?.role || "ADMIN"}
                </span>
              </div>
            </div>
          )}

          {!collapsed && (
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-red-400 transition cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
