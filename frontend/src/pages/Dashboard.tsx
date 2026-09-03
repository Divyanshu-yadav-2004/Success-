import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  Building2,
  Store,
  Factory,
  ArrowRight,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  ShieldCheck,
  Search,
  Filter,
  FileText,
  Save,
  User as UserIcon,
  Copy,
  Check,
  Download,
  Send,
  Megaphone,
  ListFilter,
  LayoutDashboard,
  Users,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { SERVICES } from "@/lib/services";
import { formatApplicationId, downloadReceipt } from "@/lib/receipt";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { apiRequest, API_BASE_URL, getAuthHeaders } from "@/lib/apiClient";
import { normalizeApplication, type Application } from "@/lib/types";
import type { LucideIcon } from "lucide-react";

// Import modular Success Management Feature components
import {
  BrandLogo,
  WelcomeBanner,
  ApplicationTimeline,
  AdminDashboard,
  AdminUsers,
  AdminDeliveryLogs,
  DeliverDocumentModal,
  AnnouncementFormModal,
  AdminShell,
} from "@/features/success-management";

const ICONS: Record<string, LucideIcon> = {
  CreditCard,
  Building2,
  Store,
  Factory,
};

type AdminTab = "overview" | "applications" | "users" | "announcements" | "logs";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut } = useAuth();
  const { t } = useLanguage();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Admin states & tabs
  const [adminTab, setAdminTab] = useState<AdminTab>("overview");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Document delivery modal states
  const [deliveringApp, setDeliveringApp] = useState<any | null>(null);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState<boolean>(false);

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<any[]>("/applications");
      const fetched = (data || []).map(normalizeApplication);
      setApplications(fetched);

      const notesMap: Record<string, string> = {};
      fetched.forEach((app) => {
        notesMap[app.id] = app.admin_notes || "";
      });
      setAdminNotes(notesMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user, isAdmin]);

  const handleUpdateStatus = async (
    appId: string,
    newStatus: "pending" | "processed" | "approved" | "rejected" | "completed",
  ): Promise<Application> => {
    setUpdatingId(appId);
    const previousApplication = applications.find((app) => app.id === appId);
    if (!previousApplication) {
      setUpdatingId(null);
      throw new Error("Application is no longer available.");
    }

    const notes = adminNotes[appId] || "";
    const optimisticApplication: Application = {
      ...previousApplication,
      status: newStatus,
      admin_notes: notes,
      updated_at: new Date().toISOString(),
    };

    // The list and details drawer update immediately; there is no full detail
    // refetch after a successful status patch.
    setApplications((prev) =>
      prev.map((item) => (item.id === appId ? optimisticApplication : item)),
    );
    try {
      const nestStatus =
        newStatus === "approved"
          ? "APPROVED"
          : newStatus === "rejected"
          ? "REJECTED"
          : newStatus === "completed"
          ? "COMPLETED"
          : newStatus === "processed"
          ? "PROCESSED"
          : "UNDER_REVIEW";

      const data = await apiRequest<any>(`/applications/${appId}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: nestStatus,
          adminNotes: notes,
        }),
      });

      const confirmedApplication: Application = {
        ...optimisticApplication,
        status: (data?.status || nestStatus).toLowerCase() as Application["status"],
        admin_notes: data?.adminNotes ?? notes,
        updated_at: data?.updatedAt || optimisticApplication.updated_at,
        completed_at: data?.completedAt || optimisticApplication.completed_at,
      };
      setApplications((prev) =>
        prev.map((item) => (item.id === appId ? confirmedApplication : item)),
      );
      return confirmedApplication;
    } catch (err) {
      // Restore exactly the state that was visible before this request.
      setApplications((prev) =>
        prev.map((item) => (item.id === appId ? previousApplication : item)),
      );
      throw err;
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveNotes = async (appId: string) => {
    setUpdatingId(appId);
    try {
      const notes = adminNotes[appId] || "";
      const currentApp = applications.find((a) => a.id === appId);
      const currentStatus =
        currentApp?.status === "approved"
          ? "APPROVED"
          : currentApp?.status === "rejected"
          ? "REJECTED"
          : currentApp?.status === "completed"
          ? "COMPLETED"
          : currentApp?.status === "processed"
          ? "PROCESSED"
          : "UNDER_REVIEW";

      await apiRequest<any>(`/applications/${appId}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: currentStatus,
          adminNotes: notes,
        }),
      });

      setApplications((prev) =>
        prev.map((item) =>
          item.id === appId ? { ...item, admin_notes: notes } : item,
        ),
      );
    } catch (err: any) {
      alert(`Failed to save notes: ${err.message || String(err)}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDownloadFinalDocument = async (docId: string, fileName: string) => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/documents/${docId}/download`, { headers });
      if (!res.ok) throw new Error("Unauthorized or download unavailable");
      const data = await res.json();

      if (data.downloadUrl) {
        const fullUrl = data.downloadUrl.startsWith("http")
          ? data.downloadUrl
          : `${API_BASE_URL.replace(/\/api\/v1$/, "")}${data.downloadUrl.startsWith("/") ? "" : "/"}${data.downloadUrl}`;
        window.open(fullUrl, "_blank");
      } else {
        alert("Document file path generated: " + (data.fileKey || fileName));
      }
    } catch (err: any) {
      alert("Error downloading document: " + err.message);
    }
  };

  const filteredApplications = applications.filter((app) => {
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const applicantName =
      app.form_data?.applicant_name ||
      app.applicant_name ||
      app.profiles?.full_name ||
      "";
    const appEmail = app.profiles?.full_name || app.form_data?.email || "";
    const matchesSearch =
      searchQuery === "" ||
      formatApplicationId(app.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.service_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appEmail.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const pendingCount = applications.filter((a) => a.status === "pending").length;
  const approvedCount = applications.filter((a) => a.status === "approved" || a.status === "completed").length;
  if (isAdmin) {
    return (
      <>
        <AdminShell
          user={user}
          onLogout={signOut}
          applications={applications}
          loadingApplications={loading}
          applicationsError={error}
          onUpdateStatus={async (appId, newStatus, notes) => {
            const updated = await handleUpdateStatus(appId, newStatus);
            if (notes) {
              setAdminNotes((prev) => ({ ...prev, [appId]: notes }));
            }
            return updated;
          }}
          onDeliverClick={(app) => setDeliveringApp(app)}
        />

        {/* Deliver Document Modal */}
        {deliveringApp && (
          <DeliverDocumentModal
            application={deliveringApp}
            isOpen={true}
            onClose={() => setDeliveringApp(null)}
            onSuccess={() => {
              fetchApplications();
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* CUSTOMER WELCOME BANNER */}
        {!isAdmin && <WelcomeBanner />}

        {/* ADMIN MANAGEMENT TABS HEADER */}
        {isAdmin && (
          <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs mb-8 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setAdminTab("overview")}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  adminTab === "overview"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" /> {t.admin.overviewDashboard}
              </button>

              <button
                onClick={() => setAdminTab("applications")}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  adminTab === "applications"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <FileText className="w-4 h-4" /> {t.admin.allApplications} ({applications.length})
              </button>

              <button
                onClick={() => setAdminTab("users")}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  adminTab === "users"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Users className="w-4 h-4" /> {t.admin.userManagement}
              </button>

              <button
                onClick={() => setAdminTab("logs")}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  adminTab === "logs"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <ListFilter className="w-4 h-4" /> {t.admin.deliveryLogs}
              </button>
            </div>

            <button
              onClick={() => setShowAnnouncementModal(true)}
              className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              <Megaphone className="w-4 h-4" /> {t.admin.publishAnnouncement}
            </button>
          </div>
        )}

        {/* ADMIN OVERVIEW TAB */}
        {isAdmin && adminTab === "overview" && (
          <AdminDashboard
            onDeliverClick={(app) => setDeliveringApp(app)}
          />
        )}

        {/* ADMIN USERS TAB */}
        {isAdmin && adminTab === "users" && <AdminUsers />}

        {/* ADMIN DELIVERY LOGS TAB */}
        {isAdmin && adminTab === "logs" && <AdminDeliveryLogs />}

        {/* ADMIN APPLICATIONS TAB */}
        {isAdmin && adminTab === "applications" && (
          <div className="mb-10">
            {/* Admin Header & Search/Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  {t.admin.allSystemSubmissions}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t.admin.manageCitizenSubmissions}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Search Bar */}
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.admin.searchByIdNameService}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-600"
                  />
                </div>

                {/* Filter Selector */}
                <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl">
                  <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${
                      statusFilter === "all"
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {t.admin.all}
                  </button>
                  <button
                    onClick={() => setStatusFilter("pending")}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${
                      statusFilter === "pending"
                        ? "bg-amber-600 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {t.admin.pending}
                  </button>
                  <button
                    onClick={() => setStatusFilter("completed")}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${
                      statusFilter === "completed"
                        ? "bg-emerald-600 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {t.admin.completed}
                  </button>
                </div>
              </div>
            </div>

            {/* Admin Applications List */}
            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
              {loading ? (
                <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin" /> {t.admin.loadingApplications}
                </div>
              ) : error ? (
                <div className="p-12 text-center text-red-600 text-xs">
                  {t.admin.errorLoadingApplications}: {error}
                </div>
              ) : filteredApplications.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  {t.admin.noApplicationsMatch}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredApplications.map((app) => {
                    const applicant =
                      app.form_data?.applicant_name ||
                      app.form_data?.fullName ||
                      app.applicant_name ||
                      app.profiles?.full_name ||
                      "Applicant";
                    const serviceConfig = SERVICES.find(
                      (s) => s.id === app.service_type,
                    );
                    const isCompleted = app.status === "completed" || app.status === "approved";
                    
                    // Get translated service name
                    const serviceKey = serviceConfig?.id === "pan_card" ? "panCard" : 
                                      serviceConfig?.id === "gumasta_license" ? "gumastaLicense" : 
                                      serviceConfig?.id === "msme_registration" ? "msmeRegistration" : "panCard";
                    const translatedServiceName = t.services[serviceKey as keyof typeof t.services] || serviceConfig?.name || app.service_type;

                    return (
                      <div
                        key={app.id}
                        className="p-5 hover:bg-slate-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                              {formatApplicationId(app.application_no || app.id)}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                isCompleted
                                  ? "bg-emerald-100 text-emerald-800"
                                  : app.status === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {isCompleted ? `✅ ${t.admin.completed} / ${t.admin.delivered}` : app.status}
                            </span>
                          </div>

                          <p className="font-bold text-slate-900 text-sm">
                            {translatedServiceName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {t.dashboard.applicant}: <strong className="text-slate-800">{applicant}</strong> · {t.dashboard.date}:{" "}
                            {new Date(app.created_at).toLocaleDateString("en-IN")}
                          </p>
                        </div>

                        {/* Admin Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                          >
                            {t.dashboard.details}
                          </button>

                          <button
                            onClick={() => setDeliveringApp(app)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" /> 🚀 {t.admin.deliverDocument}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CITIZEN AVAILABLE SERVICES SECTION */}
        {!isAdmin && (
          <div id="available-services">
            <div className="flex items-end justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {t.dashboard.availableServices}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {t.dashboard.selectServiceToStart}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {SERVICES.map((svc) => {
                const Icon = ICONS[svc.icon] ?? CreditCard;
                // Get translated service details
                const serviceKey = svc.id === "pan_card" ? "panCard" : 
                                  svc.id === "gumasta_license" ? "gumastaLicense" : 
                                  svc.id === "msme_registration" ? "msmeRegistration" : "panCard";
                const translatedName = t.services[serviceKey as keyof typeof t.services] || svc.name;
                const translatedTagline = svc.id === "pan_card" ? t.services.panCardTagline :
                                         svc.id === "gumasta_license" ? t.services.gumastaLicenseTagline :
                                         svc.id === "msme_registration" ? t.services.msmeRegistrationTagline : svc.tagline;
                const translatedDescription = svc.id === "pan_card" ? t.services.panCardDescription :
                                             svc.id === "gumasta_license" ? t.services.gumastaLicenseDescription :
                                             svc.id === "msme_registration" ? t.services.msmeRegistrationDescription : svc.description;
                
                return (
                  <button
                    key={svc.id}
                    onClick={() => navigate(`/service/${svc.id}`)}
                    className="group relative text-left bg-white rounded-3xl border border-slate-200/80 p-6 hover:shadow-xl hover:shadow-slate-300/40 hover:-translate-y-1 hover:border-transparent transition-all duration-300 ease-out flex flex-col overflow-hidden cursor-pointer"
                  >
                    <div
                      className={`absolute -right-10 -top-10 w-36 h-36 rounded-full bg-gradient-to-br ${svc.accent} opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500 pointer-events-none z-0`}
                    />
                    <div
                      className={`relative z-10 w-10 h-10 rounded-xl bg-gradient-to-br ${svc.accent} flex items-center justify-center text-white mb-4 shadow-sm group-hover:scale-105 transition-all duration-300 shrink-0`}
                    >
                      <Icon className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <h3 className="relative z-10 font-bold text-slate-900 text-lg leading-snug">
                      {translatedName}
                    </h3>
                    <p className="relative z-10 text-xs text-slate-400 mt-1 mb-3 font-semibold uppercase tracking-wider">
                      {translatedTagline}
                    </p>
                    <p className="relative z-10 text-sm text-slate-600 leading-relaxed flex-1">
                      {translatedDescription}
                    </p>
                    <div className="relative z-10 mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs text-slate-400 font-medium">{t.dashboard.fee}</span>
                        <span className="text-xl font-extrabold text-slate-900">
                          &#8377;{svc.fee}
                        </span>
                      </div>
                      <span
                        className={`flex items-center gap-1.5 text-sm font-bold bg-gradient-to-r ${svc.accent} bg-clip-text text-transparent group-hover:gap-2.5 transition-all`}
                      >
                        {t.dashboard.applyNow}
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Customer Recent Applications */}
            <h2 className="text-xl font-bold text-slate-900 mb-5">
              {t.dashboard.mySubmittedApplications}
            </h2>
            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
              {loading ? (
                <div className="p-10 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin" /> {t.dashboard.loadingApplications}
                </div>
              ) : applications.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-sm">
                  {t.dashboard.noApplicationsFound}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {applications.map((app) => {
                    const svc = SERVICES.find((s) => s.id === app.service_type);
                    const isDelivered = app.status === "completed" || app.status === "approved";
                    const amount = app.form_data?.amount || svc?.fee || 0;
                    
                    // Get translated service name
                    const serviceKey = svc?.id === "pan_card" ? "panCard" : 
                                      svc?.id === "gumasta_license" ? "gumastaLicense" : 
                                      svc?.id === "msme_registration" ? "msmeRegistration" : "panCard";
                    const translatedServiceName = t.services[serviceKey as keyof typeof t.services] || svc?.name || app.service_type;

                    return (
                      <div
                        key={app.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-slate-50 transition gap-4"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200 text-xs">
                              {formatApplicationId(app.application_no || app.id)}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                isDelivered
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {isDelivered ? `✅ ${t.dashboard.completed}` : `⏳ ${t.dashboard.processing}`}
                            </span>
                          </div>
                          <p className="font-bold text-slate-900 text-sm">
                            {translatedServiceName}
                          </p>
                          {isDelivered && (
                            <p className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100 inline-flex items-center gap-1.5 mt-1">
                              🎉 {t.dashboard.documentArrived}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
                          >
                            {t.dashboard.viewApplication}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Customer & Admin Application Details Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {formatApplicationId(selectedApp.application_no || selectedApp.id)}
                </span>
                <h3 className="font-bold text-slate-900 text-lg mt-1">
                  {(() => {
                    const svc = SERVICES.find((s) => s.id === selectedApp.service_type);
                    const serviceKey = svc?.id === "pan_card" ? "panCard" : 
                                      svc?.id === "gumasta_license" ? "gumastaLicense" : 
                                      svc?.id === "msme_registration" ? "msmeRegistration" : "panCard";
                    return t.services[serviceKey as keyof typeof t.services] || svc?.name || selectedApp.service_type;
                  })()}
                </h3>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1 rounded-full hover:bg-slate-100"
              >
                &times;
              </button>
            </div>

            <div className="space-y-5 text-xs">
              {/* Application Timeline Component */}
              <ApplicationTimeline
                status={selectedApp.status}
                createdAt={selectedApp.created_at}
                completedAt={selectedApp.completed_at || selectedApp.updated_at}
              />

              {/* Delivery Action Banner for Completed Apps */}
              {(selectedApp.status === "completed" || selectedApp.status === "approved") && (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-center space-y-2">
                  <p className="font-bold text-emerald-900 text-sm">
                    🎉 {t.dashboard.documentArrived}
                  </p>
                  <p className="text-emerald-700 text-xs">
                    Your official certificate/document is ready to view and download securely.
                  </p>
                  <button
                    onClick={() =>
                      handleDownloadFinalDocument(
                        selectedApp.id,
                        `${selectedApp.service_type}_document.pdf`,
                      )
                    }
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs inline-flex items-center gap-1.5 shadow-md shadow-emerald-700/20 cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> {t.dashboard.downloadPdfDocument}
                  </button>
                </div>
              )}

              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2">
                  {t.dashboard.submittedInformation}
                </h4>
                <div className="bg-slate-50 p-3.5 rounded-2xl space-y-2">
                  {Object.entries(selectedApp.form_data || {}).map(([key, val]) => (
                    <div key={key} className="flex justify-between border-b border-slate-200/50 pb-1 last:border-0">
                      <span className="text-slate-500 font-medium capitalize">
                        {key.replace(/([A-Z])/g, " $1")}
                      </span>
                      <span className="text-slate-900 font-semibold max-w-[220px] truncate">
                        {String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                {t.dashboard.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deliver Document Modal */}
      {deliveringApp && (
        <DeliverDocumentModal
          application={deliveringApp}
          isOpen={true}
          onClose={() => setDeliveringApp(null)}
          onSuccess={() => {
            fetchApplications();
          }}
        />
      )}

      {/* Admin Announcement Modal */}
      {showAnnouncementModal && (
        <AnnouncementFormModal
          isOpen={true}
          onClose={() => setShowAnnouncementModal(false)}
          onSuccess={() => {
            alert("Announcement broadcasted successfully!");
          }}
        />
      )}
    </div>
  );
}
