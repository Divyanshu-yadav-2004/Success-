import React, { useState } from "react";
import { AdminSidebar, AdminViewSection } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";

// Import all workspace view components
import { AdminDashboard } from "./AdminDashboard";
import { ApplicationsWorkspace } from "./ApplicationsWorkspace";
import { DocumentDeliveryWorkspace } from "./DocumentDeliveryWorkspace";
import { NotificationCenter } from "./NotificationCenter";
import { AnnouncementsWorkspace } from "./AnnouncementsWorkspace";
import { CitizensWorkspace } from "./CitizensWorkspace";
import { ServicesWorkspace } from "./ServicesWorkspace";
import { StaffRolesWorkspace } from "./StaffRolesWorkspace";
import { ReportsAnalyticsWorkspace } from "./ReportsAnalyticsWorkspace";
import { ActivityLogsWorkspace } from "./ActivityLogsWorkspace";
import { SettingsWorkspace } from "./SettingsWorkspace";
import { ApplicationDetailsDrawer } from "./ApplicationDetailsDrawer";

import { Application } from "@/lib/types";

interface AdminShellProps {
  user: any;
  onLogout: () => void;
  applications: Application[];
  loadingApplications: boolean;
  applicationsError: string | null;
  onUpdateStatus: (
    appId: string,
    newStatus: "pending" | "processed" | "approved" | "rejected" | "completed",
    notes?: string,
  ) => Promise<Application>;
  onDeliverClick: (app: any) => void;
}

export const AdminShell: React.FC<AdminShellProps> = ({
  user,
  onLogout,
  applications,
  loadingApplications,
  applicationsError,
  onUpdateStatus,
  onDeliverClick,
}) => {
  const [currentView, setCurrentView] = useState<AdminViewSection>("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);

  const handleSelectView = (view: AdminViewSection) => {
    setCurrentView(view);
    setMobileSidebarOpen(false);
  };

  const handleStatusUpdate = async (
    appId: string,
    newStatus: "pending" | "processed" | "approved" | "rejected" | "completed",
    notes?: string,
  ) => {
    const updated = await onUpdateStatus(appId, newStatus, notes);
    setSelectedApp((current: any | null) => (current?.id === appId ? updated : current));
    return updated;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex antialiased text-slate-900">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:flex shrink-0">
        <AdminSidebar
          currentView={currentView}
          onSelectView={handleSelectView}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          user={user}
          onLogout={onLogout}
        />
      </div>

      {/* Mobile Drawer Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-950/60 backdrop-blur-xs">
          <div className="w-64 h-full animate-in slide-in-from-left duration-200 shadow-2xl">
            <AdminSidebar
              currentView={currentView}
              onSelectView={handleSelectView}
              collapsed={false}
              onToggleCollapse={() => setMobileSidebarOpen(false)}
              user={user}
              onLogout={onLogout}
            />
          </div>
          <div className="flex-1" onClick={() => setMobileSidebarOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <AdminHeader
          currentView={currentView}
          onToggleMobileSidebar={() => setMobileSidebarOpen((v) => !v)}
          user={user}
          onLogout={onLogout}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentView === "overview" && (
            <AdminDashboard onDeliverClick={onDeliverClick} />
          )}

          {currentView === "applications" && (
            <ApplicationsWorkspace
              applications={applications}
              loading={loadingApplications}
              error={applicationsError}
              onSelectApp={(app) => setSelectedApp(app)}
              onDeliverClick={onDeliverClick}
            />
          )}

          {currentView === "document-delivery" && (
            <DocumentDeliveryWorkspace
              applications={applications}
              loading={loadingApplications}
              onDeliverClick={onDeliverClick}
            />
          )}

          {currentView === "notifications" && <NotificationCenter />}
          {currentView === "announcements" && <AnnouncementsWorkspace />}
          {currentView === "citizens" && <CitizensWorkspace />}
          {currentView === "services" && <ServicesWorkspace />}
          {currentView === "staff" && <StaffRolesWorkspace />}
          {currentView === "reports" && <ReportsAnalyticsWorkspace />}
          {currentView === "activity-logs" && <ActivityLogsWorkspace />}
          {currentView === "settings" && <SettingsWorkspace />}
        </main>
      </div>

      {/* Application Details Case-Management Side Drawer */}
      {selectedApp && (
        <ApplicationDetailsDrawer
          application={selectedApp}
          isOpen={true}
          onClose={() => setSelectedApp(null)}
          onUpdateStatus={handleStatusUpdate}
          onDeliverClick={onDeliverClick}
        />
      )}
    </div>
  );
};
