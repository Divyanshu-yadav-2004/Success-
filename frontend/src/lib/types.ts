export type ServiceType =
  | "pan_card"
  | "gumasta_license"
  | "msme_registration";

export interface DocumentRequirement {
  name: string;
  label: string;
  description: string;
  required: boolean;
}

export interface ServiceConfig {
  id: ServiceType;
  name: string;
  tagline: string;
  description: string;
  fee: number;
  icon: string;
  accent: string;
  fields: ServiceField[];
  documents: DocumentRequirement[];
}

export interface ServiceField {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "textarea" | "select" | "date";
  placeholder?: string;
  required: boolean;
  options?: string[];
  helpText?: string;
  fullWidth?: boolean;
}

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  address: string;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  application_no?: string;
  user_id: string;
  service_type: ServiceType;
  form_data: Record<string, any>;
  documents?: Record<string, any>;
  status: "pending" | "processed" | "approved" | "rejected" | "completed";
  admin_notes?: string;
  created_at: string;
  updated_at?: string;
  completed_at?: string | null;
  
  // Helpers for convenience
  applicant_name?: string;
  applicant_email?: string;
  applicant_phone?: string;
  details?: Record<string, string>;
  amount?: number;
  payment_status?: "pending" | "paid";
  payment_id?: string | null;
  email_sent?: boolean;
  email_message?: string;
  profiles?: Profile;
  service?: any;
}

export interface ApplicationStatusHistory {
  id: string;
  application_id: string;
  old_status?: string;
  new_status: string;
  changed_by?: string;
  changed_at: string;
}

export function normalizeApplication(app: any): Application {
  const rawStatus = (app.status || "pending").toString().toLowerCase();
  const status: "pending" | "processed" | "approved" | "rejected" | "completed" = rawStatus.includes("completed")
    ? "completed"
    : rawStatus.includes("processed")
    ? "processed"
    : rawStatus.includes("approved")
    ? "approved"
    : rawStatus.includes("reject")
    ? "rejected"
    : "pending";

  const serviceType = (app.service?.code || app.service_type || "pan_card") as ServiceType;
  const applicantName =
    app.user?.profile?.fullName ||
    app.formData?.applicant_name ||
    app.form_data?.applicant_name ||
    "Applicant";

  const appNo = app.applicationNo || app.application_no || "";

  return {
    id: app.id,
    application_no: appNo,
    user_id: app.userId || app.user_id || "",
    service_type: serviceType,
    service: app.service,
    form_data: app.formData || app.form_data || {},
    documents: app.documents || {},
    status,
    admin_notes: app.adminNotes || app.admin_notes || "",
    created_at: app.createdAt || app.created_at || new Date().toISOString(),
    updated_at: app.updatedAt || app.updated_at,
    completed_at: app.completedAt || app.completed_at || null,
    applicant_name: applicantName,
    applicant_email: app.user?.email || app.formData?.applicant_email || "",
    applicant_phone: app.user?.phone || app.user?.profile?.phone || "",
    amount: app.amount || app.service?.fee || 0,
    payment_status: app.paymentStatus === "SUCCESS" || app.payment_status === "paid" ? "paid" : "pending",
    payment_id: app.paymentId || app.payment_id || null,
    email_sent: app.emailSent !== undefined ? app.emailSent : true,
    email_message: app.emailMessage,
    profiles: {
      id: app.user?.id || app.userId || "",
      full_name: applicantName,
      phone: app.user?.phone || "",
      address: app.user?.profile?.address || "",
      role: app.user?.role?.name === "ADMIN" || app.user?.role?.name === "SUPER_ADMIN" ? "admin" : "user",
      created_at: app.createdAt || new Date().toISOString(),
      updated_at: app.updatedAt || new Date().toISOString(),
    },
  };
}
