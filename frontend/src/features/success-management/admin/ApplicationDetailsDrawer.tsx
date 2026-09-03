import React, { useRef, useState } from "react";
import {
  X,
  FileText,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  Send,
  Save,
  Loader2,
  ShieldCheck,
  Building2,
  Calendar,
  CreditCard,
} from "lucide-react";
import { formatApplicationId } from "@/lib/receipt";
import { ApplicationTimeline } from "../applications/ApplicationTimeline";

interface ApplicationDetailsDrawerProps {
  application: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (
    appId: string,
    newStatus: "pending" | "processed" | "approved" | "rejected" | "completed",
    notes?: string,
  ) => Promise<any>;
  onDeliverClick: (app: any) => void;
}

export const ApplicationDetailsDrawer: React.FC<ApplicationDetailsDrawerProps> = ({
  application,
  isOpen,
  onClose,
  onUpdateStatus,
  onDeliverClick,
}) => {
  const [adminNotes, setAdminNotes] = useState<string>(
    application?.admin_notes || application?.adminNotes || "",
  );
  const [savingNotes, setSavingNotes] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const statusRequestInFlight = useRef(false);

  if (!isOpen || !application) return null;

  const applicantName =
    application.form_data?.applicant_name ||
    application.form_data?.fullName ||
    application.applicant_name ||
    application.user?.profile?.fullName ||
    "Applicant";

  const applicantEmail =
    application.user?.email || application.form_data?.email || "N/A";

  const isCompleted =
    application.status === "completed" ||
    application.status === "approved" ||
    application.status === "COMPLETED" ||
    application.status === "APPROVED";

  const handleSaveNotesClick = async () => {
    setSavingNotes(true);
    try {
      const currentStatus =
        application.status === "approved" || application.status === "APPROVED"
          ? "approved"
          : application.status === "rejected" || application.status === "REJECTED"
          ? "rejected"
          : application.status === "completed" || application.status === "COMPLETED"
          ? "completed"
          : "pending";

      await onUpdateStatus(application.id, currentStatus, adminNotes);
      alert("Notes saved successfully!");
    } catch (err: any) {
      alert(`Error saving notes: ${err.message || String(err)}`);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleStatusChange = async (
    targetStatus: "pending" | "processed" | "approved" | "rejected" | "completed",
  ) => {
    // The ref closes the small window before React rerenders, ensuring one
    // status request per click even when an operator double-clicks quickly.
    if (statusRequestInFlight.current) return;
    statusRequestInFlight.current = true;
    setUpdatingStatus(targetStatus);
    setStatusError(null);
    try {
      await onUpdateStatus(application.id, targetStatus, adminNotes);
    } catch (err: any) {
      setStatusError(err.message || "Unable to update the application status. Please try again.");
    } finally {
      statusRequestInFlight.current = false;
      setUpdatingStatus(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl overflow-y-auto flex flex-col relative animate-in slide-in-from-right duration-250">
        {/* Drawer Header */}
        <div className="p-6 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950 px-2.5 py-0.5 rounded border border-blue-800">
                {formatApplicationId(application.application_no || application.applicationNo || application.id)}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  isCompleted
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : application.status === "rejected" || application.status === "REJECTED"
                    ? "bg-red-500/20 text-red-300 border border-red-500/30"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}
              >
                {application.status}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              {application.service?.name || application.service_type || "Service Application"}
            </h2>
            <p className="text-xs text-slate-400">
              Submitted by <strong className="text-slate-200">{applicantName}</strong> &bull; {new Date(application.created_at || application.createdAt).toLocaleString("en-IN")}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Step-by-step Timeline */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" /> Application Workflow Timeline
            </h3>
            <ApplicationTimeline
              status={application.status}
              createdAt={application.created_at || application.createdAt}
              completedAt={application.completed_at || application.completedAt || application.updated_at || application.updatedAt}
            />
          </div>

          {/* Citizen Details Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <User className="w-4 h-4 text-blue-600" /> Citizen Applicant Details
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Full Name</span>
                <span className="font-bold text-slate-900">{applicantName}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Email Address</span>
                <span className="font-semibold text-slate-900">{applicantEmail}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Service Fee Amount</span>
                <span className="font-bold text-slate-900">&#8377;{application.amount || application.service?.fee || 0}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Payment Status</span>
                <span className="font-bold text-emerald-600 uppercase">
                  {application.payment_status || application.paymentStatus || "SUCCESS"}
                </span>
              </div>
            </div>
          </div>

          {/* Form Data Fields */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <FileText className="w-4 h-4 text-blue-600" /> Form Submission Data
            </h3>
            <div className="space-y-2 text-xs">
              {Object.entries(application.form_data || {}).map(([key, val]) => (
                <div key={key} className="flex justify-between items-center border-b border-slate-100 pb-1.5 last:border-0">
                  <span className="text-slate-500 font-medium capitalize">
                    {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}
                  </span>
                  <span className="font-bold text-slate-900 text-right max-w-[280px] truncate">
                    {String(val)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Notes & Workflow Actions */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" /> Admin Case Actions & Review Notes
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Internal Operational Notes
              </label>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add verification notes, missing document remarks, or internal staff review comments..."
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-600"
              />
              <button
                onClick={handleSaveNotesClick}
                disabled={savingNotes}
                className="mt-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                {savingNotes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Notes
              </button>
            </div>

            <div className="pt-2 border-t border-slate-200/80">
              <p className="text-xs font-bold text-slate-700 mb-2">Update Application Status:</p>
              {statusError && (
                <p role="alert" className="mb-2 text-xs font-medium text-red-700">{statusError}</p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleStatusChange("pending")}
                  disabled={updatingStatus !== null}
                  className="px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-xs transition cursor-pointer"
                >
                  Set Pending Review
                </button>

                <button
                  onClick={() => handleStatusChange("processed")}
                  disabled={updatingStatus !== null}
                  className="px-3 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 disabled:opacity-70 text-emerald-800 font-bold text-xs transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  {updatingStatus === "processed" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {updatingStatus === "processed" ? "Processing..." : application.status === "processed" ? "Processed" : "Mark Processed"}
                </button>

                <button
                  onClick={() => handleStatusChange("approved")}
                  disabled={updatingStatus !== null}
                  className="px-3 py-2 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold text-xs transition cursor-pointer"
                >
                  Approve Application
                </button>

                <button
                  onClick={() => handleStatusChange("rejected")}
                  disabled={updatingStatus !== null}
                  className="px-3 py-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-800 font-bold text-xs transition cursor-pointer"
                >
                  Reject Submission
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onDeliverClick(application);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition cursor-pointer ml-auto"
                >
                  <Send className="w-3.5 h-3.5" /> 🚀 Deliver Final Document
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
