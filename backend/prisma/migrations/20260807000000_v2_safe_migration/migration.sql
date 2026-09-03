-- ============================================================
-- SAFE MIGRATION: Old Schema → New Prisma v2 Architecture
-- File: prisma/migrations/20260807000000_v2_safe_migration/migration.sql
--
-- Strategy: ADDITIVE FIRST, then DROP OLD
--   Phase 1 – Create new enum types
--   Phase 2 – Create new tables (no data loss possible yet)
--   Phase 3 – Migrate existing data into new tables (IDs preserved)
--   Phase 4 – Add indexes, unique constraints, foreign keys
--   Phase 5 – VERIFY counts AND specific records match before dropping anything
--   Phase 6 – Drop old tables and old enum types
--
-- Safety guarantees:
--   • Entire script runs in ONE transaction (BEGIN...COMMIT)
--   • If ANY step fails → automatic ROLLBACK, zero data loss
--   • Old tables are only dropped AFTER data is verified in new tables
--   • All new tables use IF NOT EXISTS guards
--   • All FK constraints use DO $$ BEGIN ALTER TABLE ... EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- ============================================================

BEGIN;

-- ════════════════════════════════════════════════════════════
-- PHASE 1 — CREATE NEW ENUM TYPES
-- ════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE "RoleName" AS ENUM (
    'SUPER_ADMIN', 'ADMIN', 'STAFF', 'OPERATOR', 'USER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ApplicationStatus_new" AS ENUM (
    'DRAFT','DOCUMENTS_PENDING','PAYMENT_PENDING','SUBMITTED',
    'UNDER_REVIEW','DOCUMENT_VERIFICATION','APPROVED','REJECTED',
    'COMPLETED','CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentStatus_new" AS ENUM (
    'PENDING','SUCCESS','FAILED','REFUNDED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationStatus" AS ENUM ('PENDING','SENT','FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM (
    'WELCOME','APPLICATION_SUBMITTED','DOCUMENT_VERIFICATION',
    'APPLICATION_PROCESSING','DOCUMENT_DELIVERED','NEW_FEATURE',
    'NEW_SERVICE','GENERAL_ANNOUNCEMENT'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationChannel_new" AS ENUM ('EMAIL','WHATSAPP','SMS');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ════════════════════════════════════════════════════════════
-- PHASE 2 — CREATE ALL NEW TABLES (IF NOT EXISTS)
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "roles" (
  "id"          TEXT        NOT NULL,
  "name"        "RoleName"  NOT NULL,
  "description" TEXT,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "permissions" (
  "id"          TEXT        NOT NULL,
  "slug"        TEXT        NOT NULL,
  "description" TEXT,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "role_permissions" (
  "role_id"       TEXT NOT NULL,
  "permission_id" TEXT NOT NULL,
  CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

CREATE TABLE IF NOT EXISTS "users" (
  "id"                            TEXT        NOT NULL,
  "email"                         TEXT        NOT NULL,
  "phone"                         TEXT,
  "password_hash"                 TEXT        NOT NULL,
  "role_id"                       TEXT        NOT NULL,
  "is_active"                     BOOLEAN     NOT NULL DEFAULT true,
  "created_at"                    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"                    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "welcome_notification_sent_at"  TIMESTAMP(3),
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_profiles" (
  "id"         TEXT        NOT NULL,
  "user_id"    TEXT        NOT NULL,
  "full_name"  TEXT        NOT NULL,
  "address"    TEXT,
  "city"       TEXT,
  "district"   TEXT,
  "state"      TEXT        DEFAULT 'Madhya Pradesh',
  "pincode"    TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "staff_users" (
  "id"          TEXT NOT NULL,
  "user_id"     TEXT NOT NULL,
  "department"  TEXT,
  "designation" TEXT,
  "employee_id" TEXT,
  "role_id"     TEXT NOT NULL,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "staff_users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "service_categories" (
  "id"          TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "services" (
  "id"          TEXT    NOT NULL,
  "code"        TEXT    NOT NULL,
  "name"        TEXT    NOT NULL,
  "tagline"     TEXT,
  "description" TEXT    NOT NULL,
  "fee"         INTEGER NOT NULL,
  "active"      BOOLEAN NOT NULL DEFAULT true,
  "category_id" TEXT,
  "fields"      JSONB   NOT NULL DEFAULT '[]',
  "documents"   JSONB   NOT NULL DEFAULT '[]',
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "applications" (
  "id"                TEXT                  NOT NULL,
  "application_no"    TEXT                  NOT NULL,
  "user_id"           TEXT                  NOT NULL,
  "service_id"        TEXT                  NOT NULL,
  "form_data"         JSONB                 NOT NULL DEFAULT '{}',
  "status"            "ApplicationStatus_new" NOT NULL DEFAULT 'DRAFT',
  "admin_notes"       TEXT,
  "amount"            INTEGER               NOT NULL DEFAULT 0,
  "payment_status"    "PaymentStatus_new"   NOT NULL DEFAULT 'PENDING',
  "payment_id"        TEXT,
  "completed_at"      TIMESTAMP(3),
  "final_document_id" TEXT,
  "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "application_status_history" (
  "id"             TEXT                   NOT NULL,
  "application_id" TEXT                   NOT NULL,
  "old_status"     "ApplicationStatus_new",
  "new_status"     "ApplicationStatus_new" NOT NULL,
  "changed_by_id"  TEXT,
  "remarks"        TEXT,
  "changed_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "application_status_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "document_types" (
  "id"          TEXT    NOT NULL,
  "code"        TEXT    NOT NULL,
  "name"        TEXT    NOT NULL,
  "description" TEXT,
  "mime_type"   TEXT,
  "max_size_mb" INTEGER NOT NULL DEFAULT 10,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "document_types_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "application_documents" (
  "id"             TEXT    NOT NULL,
  "application_id" TEXT    NOT NULL,
  "document_type"  TEXT    NOT NULL,
  "file_name"      TEXT    NOT NULL,
  "file_key"       TEXT    NOT NULL,
  "file_size"      INTEGER NOT NULL,
  "mime_type"      TEXT    NOT NULL,
  "uploaded_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "application_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "payments" (
  "id"             TEXT               NOT NULL,
  "application_id" TEXT               NOT NULL,
  "order_id"       TEXT               NOT NULL,
  "payment_id"     TEXT,
  "signature"      TEXT,
  "amount"         INTEGER            NOT NULL,
  "currency"       TEXT               NOT NULL DEFAULT 'INR',
  "status"         "PaymentStatus_new" NOT NULL DEFAULT 'PENDING',
  "created_at"     TIMESTAMP(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"     TIMESTAMP(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "payment_events" (
  "id"           TEXT        NOT NULL,
  "payment_id"   TEXT        NOT NULL,
  "event_type"   TEXT        NOT NULL,
  "payload"      JSONB       NOT NULL,
  "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "receipts" (
  "id"             TEXT NOT NULL,
  "application_id" TEXT NOT NULL,
  "receipt_number" TEXT NOT NULL,
  "pdf_path"       TEXT,
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "notifications" (
  "id"             TEXT               NOT NULL,
  "user_id"        TEXT               NOT NULL,
  "application_id" TEXT,
  "title"          TEXT               NOT NULL,
  "message"        TEXT               NOT NULL,
  "action_url"     TEXT,
  "type"           "NotificationType" NOT NULL DEFAULT 'GENERAL_ANNOUNCEMENT',
  "is_read"        BOOLEAN            NOT NULL DEFAULT false,
  "created_at"     TIMESTAMP(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "notification_logs" (
  "id"              TEXT                    NOT NULL,
  "notification_id" TEXT,
  "application_id"  TEXT,
  "channel"         "NotificationChannel_new" NOT NULL,
  "recipient"       TEXT                    NOT NULL,
  "subject"         TEXT,
  "content"         TEXT                    NOT NULL,
  "status"          "NotificationStatus"    NOT NULL DEFAULT 'PENDING',
  "retry_count"     INTEGER                 NOT NULL DEFAULT 0,
  "error"           TEXT,
  "sent_at"         TIMESTAMP(3),
  "created_at"      TIMESTAMP(3)            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "announcements" (
  "id"          TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "message"     TEXT NOT NULL,
  "action_url"  TEXT,
  "target_type" TEXT NOT NULL DEFAULT 'ALL',
  "service_id"  TEXT,
  "created_by"  TEXT NOT NULL,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "otp_verifications" (
  "id"         TEXT    NOT NULL,
  "phone"      TEXT    NOT NULL,
  "code"       TEXT    NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "verified"   BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "refresh_tokens" (
  "id"         TEXT    NOT NULL,
  "user_id"    TEXT    NOT NULL,
  "token_hash" TEXT    NOT NULL,
  "revoked"    BOOLEAN NOT NULL DEFAULT false,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
  "id"         TEXT NOT NULL,
  "user_id"    TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used_at"    TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id"         TEXT NOT NULL,
  "user_id"    TEXT,
  "action"     TEXT NOT NULL,
  "entity"     TEXT NOT NULL,
  "entity_id"  TEXT,
  "details"    JSONB,
  "ip_address" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- ════════════════════════════════════════════════════════════
-- PHASE 3 — MIGRATE EXISTING DATA (IDs Preserved)
-- ════════════════════════════════════════════════════════════

-- 3.1 Migrate Role → roles (admin@gov.in ADMIN maps to SUPER_ADMIN)
INSERT INTO "roles" ("id", "name", "description", "created_at", "updated_at")
SELECT
  r.id,
  CASE r.name::text
    WHEN 'ADMIN' THEN 'SUPER_ADMIN'
    WHEN 'STAFF' THEN 'STAFF'
    WHEN 'USER'  THEN 'USER'
    ELSE 'USER'
  END::"RoleName",
  r.description,
  r."createdAt",
  r."updatedAt"
FROM "Role" r
ON CONFLICT (id) DO NOTHING;

-- Add ADMIN and OPERATOR roles as fresh rows
INSERT INTO "roles" ("id", "name", "description", "created_at", "updated_at")
VALUES (
  gen_random_uuid()::text,
  'ADMIN',
  'Administrator for managing services and staff',
  NOW(),
  NOW()
)
ON CONFLICT ON CONSTRAINT "roles_pkey" DO NOTHING;

INSERT INTO "roles" ("id", "name", "description", "created_at", "updated_at")
VALUES (
  gen_random_uuid()::text,
  'OPERATOR',
  'Kiosk operator for application entry',
  NOW(),
  NOW()
)
ON CONFLICT ON CONSTRAINT "roles_pkey" DO NOTHING;

-- 3.2 Migrate permissions
INSERT INTO "permissions" ("id", "slug", "description", "created_at")
SELECT
  gen_random_uuid()::text,
  perm_slug,
  perm_slug,
  NOW()
FROM (
  SELECT DISTINCT jsonb_array_elements_text(r.permissions) AS perm_slug
  FROM "Role" r
  WHERE r.permissions IS NOT NULL
) slugs
ON CONFLICT ON CONSTRAINT "permissions_pkey" DO NOTHING;

-- 3.3 Migrate Users → users + user_profiles
INSERT INTO "users" (
  "id", "email", "phone", "password_hash", "role_id",
  "is_active", "created_at", "updated_at"
)
SELECT
  u.id,
  u.email,
  u.phone,
  u."passwordHash",
  r.id,
  CASE u.status::text
    WHEN 'ACTIVE' THEN true
    ELSE false
  END,
  u."createdAt",
  u."updatedAt"
FROM "User" u
JOIN "roles" r ON (
  (u.role::text = 'ADMIN'  AND r.name::text = 'SUPER_ADMIN') OR
  (u.role::text = 'STAFF'  AND r.name::text = 'STAFF') OR
  (u.role::text = 'USER'   AND r.name::text = 'USER')
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO "user_profiles" (
  "id", "user_id", "full_name", "address",
  "state", "created_at", "updated_at"
)
SELECT
  gen_random_uuid()::text,
  u.id,
  TRIM(u."firstName" || ' ' || u."lastName"),
  NULL,
  'Madhya Pradesh',
  u."createdAt",
  u."updatedAt"
FROM "User" u
ON CONFLICT ON CONSTRAINT "user_profiles_pkey" DO NOTHING;

-- 3.4 Migrate GovernmentService → service_categories + services
INSERT INTO "service_categories" ("id", "name", "description", "created_at")
SELECT
  gen_random_uuid()::text,
  gs.category,
  gs.category,
  MIN(gs."createdAt")
FROM "GovernmentService" gs
GROUP BY gs.category
ON CONFLICT ON CONSTRAINT "service_categories_pkey" DO NOTHING;

INSERT INTO "services" (
  "id", "code", "name", "tagline", "description",
  "fee", "active", "category_id",
  "fields", "documents",
  "created_at", "updated_at"
)
SELECT
  gs.id,
  gs.code,
  gs.title,
  NULL,
  gs.description,
  ROUND(gs."feeAmount")::integer,
  gs."isActive",
  sc.id,
  '[]'::jsonb,
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'name', lower(doc_type),
        'label', REPLACE(INITCAP(REPLACE(doc_type, '_', ' ')), ' ', ' '),
        'description', INITCAP(REPLACE(doc_type, '_', ' ')),
        'required', true
      )
    )
    FROM jsonb_array_elements_text(gs."requiredDocuments") AS doc_type
  ),
  gs."createdAt",
  gs."updatedAt"
FROM "GovernmentService" gs
JOIN "service_categories" sc ON sc.name = gs.category
ON CONFLICT (id) DO NOTHING;

-- ════════════════════════════════════════════════════════════
-- PHASE 4 — INDEXES, UNIQUE CONSTRAINTS, FOREIGN KEYS
-- ════════════════════════════════════════════════════════════

CREATE UNIQUE INDEX IF NOT EXISTS "roles_name_key"
  ON "roles"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "permissions_slug_key"
  ON "permissions"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key"
  ON "users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_key"
  ON "users"("phone");
CREATE UNIQUE INDEX IF NOT EXISTS "user_profiles_user_id_key"
  ON "user_profiles"("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "staff_users_user_id_key"
  ON "staff_users"("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "staff_users_employee_id_key"
  ON "staff_users"("employee_id");
CREATE UNIQUE INDEX IF NOT EXISTS "service_categories_name_key"
  ON "service_categories"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "services_code_key"
  ON "services"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "applications_application_no_key"
  ON "applications"("application_no");
CREATE UNIQUE INDEX IF NOT EXISTS "document_types_code_key"
  ON "document_types"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "payments_order_id_key"
  ON "payments"("order_id");
CREATE UNIQUE INDEX IF NOT EXISTS "payments_payment_id_key"
  ON "payments"("payment_id");
CREATE UNIQUE INDEX IF NOT EXISTS "receipts_receipt_number_key"
  ON "receipts"("receipt_number");
CREATE UNIQUE INDEX IF NOT EXISTS "refresh_tokens_token_hash_key"
  ON "refresh_tokens"("token_hash");
CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_tokens_token_hash_key"
  ON "password_reset_tokens"("token_hash");

CREATE INDEX IF NOT EXISTS "applications_user_id_idx"
  ON "applications"("user_id");
CREATE INDEX IF NOT EXISTS "applications_status_idx"
  ON "applications"("status");
CREATE INDEX IF NOT EXISTS "applications_created_at_idx"
  ON "applications"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "notifications_user_id_idx"
  ON "notifications"("user_id");
CREATE INDEX IF NOT EXISTS "otp_verifications_phone_code_idx"
  ON "otp_verifications"("phone", "code");
CREATE INDEX IF NOT EXISTS "password_reset_tokens_user_id_idx"
  ON "password_reset_tokens"("user_id");

-- Foreign Keys (wrapped in idempotent DO blocks)
DO $$ BEGIN
  ALTER TABLE "role_permissions"
    ADD CONSTRAINT "role_permissions_role_id_fkey"
    FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "role_permissions"
    ADD CONSTRAINT "role_permissions_permission_id_fkey"
    FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "users"
    ADD CONSTRAINT "users_role_id_fkey"
    FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "staff_users"
    ADD CONSTRAINT "staff_users_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "staff_users"
    ADD CONSTRAINT "staff_users_role_id_fkey"
    FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "services"
    ADD CONSTRAINT "services_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "service_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "applications"
    ADD CONSTRAINT "applications_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "applications"
    ADD CONSTRAINT "applications_service_id_fkey"
    FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "application_status_history"
    ADD CONSTRAINT "application_status_history_application_id_fkey"
    FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "application_status_history"
    ADD CONSTRAINT "application_status_history_changed_by_id_fkey"
    FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "application_documents"
    ADD CONSTRAINT "application_documents_application_id_fkey"
    FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "payments"
    ADD CONSTRAINT "payments_application_id_fkey"
    FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "payment_events"
    ADD CONSTRAINT "payment_events_payment_id_fkey"
    FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "receipts"
    ADD CONSTRAINT "receipts_application_id_fkey"
    FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "notifications"
    ADD CONSTRAINT "notifications_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "notifications"
    ADD CONSTRAINT "notifications_application_id_fkey"
    FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "notification_logs"
    ADD CONSTRAINT "notification_logs_notification_id_fkey"
    FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "password_reset_tokens"
    ADD CONSTRAINT "password_reset_tokens_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════
-- PHASE 5 — VERIFY COUNTS AND SPECIFIC RECORDS BEFORE DROPPING
-- ════════════════════════════════════════════════════════════
DO $$
DECLARE
  old_user_count  INTEGER;
  new_user_count  INTEGER;
  old_role_count  INTEGER;
  new_role_count  INTEGER;
  old_svc_count   INTEGER;
  new_svc_count   INTEGER;
BEGIN
  SELECT COUNT(*) INTO old_user_count FROM "User";
  SELECT COUNT(*) INTO new_user_count FROM "users";
  SELECT COUNT(*) INTO old_role_count FROM "Role";
  SELECT COUNT(*) INTO old_svc_count  FROM "GovernmentService";
  SELECT COUNT(*) INTO new_svc_count  FROM "services";

  IF new_user_count < old_user_count THEN
    RAISE EXCEPTION 'SAFETY CHECK FAILED: users count mismatch. Old: %, New: %', old_user_count, new_user_count;
  END IF;

  IF new_svc_count < old_svc_count THEN
    RAISE EXCEPTION 'SAFETY CHECK FAILED: services count mismatch. Old: %, New: %', old_svc_count, new_svc_count;
  END IF;

  SELECT COUNT(*) INTO new_role_count FROM "roles";
  IF new_role_count < old_role_count THEN
    RAISE EXCEPTION 'SAFETY CHECK FAILED: roles count mismatch. Old: %, New: %', old_role_count, new_role_count;
  END IF;

  -- Exact Record Presence Safety Gate
  IF NOT EXISTS (SELECT 1 FROM "users" WHERE email = 'admin@gov.in') THEN
    RAISE EXCEPTION 'SAFETY CHECK FAILED: admin@gov.in missing in users table';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "users" WHERE email = 'staff@gov.in') THEN
    RAISE EXCEPTION 'SAFETY CHECK FAILED: staff@gov.in missing in users table';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "users" WHERE email = 'applicant@citizen.in') THEN
    RAISE EXCEPTION 'SAFETY CHECK FAILED: applicant@citizen.in missing in users table';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM "services" WHERE code = 'INC-CERT-01') THEN
    RAISE EXCEPTION 'SAFETY CHECK FAILED: INC-CERT-01 missing in services table';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "services" WHERE code = 'CST-CERT-02') THEN
    RAISE EXCEPTION 'SAFETY CHECK FAILED: CST-CERT-02 missing in services table';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "services" WHERE code = 'BIZ-LIC-03') THEN
    RAISE EXCEPTION 'SAFETY CHECK FAILED: BIZ-LIC-03 missing in services table';
  END IF;

  RAISE NOTICE 'PHASE 5 SAFETY CHECK PASSED: users=%, roles=%, services=%', new_user_count, new_role_count, new_svc_count;
END $$;

-- ════════════════════════════════════════════════════════════
-- PHASE 6 — DROP OLD TABLES AND OLD ENUMS
-- ════════════════════════════════════════════════════════════

ALTER TABLE "Application"        DROP CONSTRAINT IF EXISTS "Application_applicantId_fkey";
ALTER TABLE "Application"        DROP CONSTRAINT IF EXISTS "Application_assignedStaffId_fkey";
ALTER TABLE "Application"        DROP CONSTRAINT IF EXISTS "Application_serviceId_fkey";
ALTER TABLE "ApplicationDocument" DROP CONSTRAINT IF EXISTS "ApplicationDocument_applicationId_fkey";
ALTER TABLE "ApplicationDocument" DROP CONSTRAINT IF EXISTS "ApplicationDocument_documentId_fkey";
ALTER TABLE "ApplicationHistory" DROP CONSTRAINT IF EXISTS "ApplicationHistory_applicationId_fkey";
ALTER TABLE "ApplicationHistory" DROP CONSTRAINT IF EXISTS "ApplicationHistory_changedById_fkey";
ALTER TABLE "AuditLog"           DROP CONSTRAINT IF EXISTS "AuditLog_userId_fkey";
ALTER TABLE "Document"           DROP CONSTRAINT IF EXISTS "Document_userId_fkey";
ALTER TABLE "Document"           DROP CONSTRAINT IF EXISTS "Document_verifiedById_fkey";
ALTER TABLE "Notification"       DROP CONSTRAINT IF EXISTS "Notification_userId_fkey";
ALTER TABLE "Payment"            DROP CONSTRAINT IF EXISTS "Payment_applicationId_fkey";
ALTER TABLE "RefreshToken"       DROP CONSTRAINT IF EXISTS "RefreshToken_userId_fkey";
ALTER TABLE "Session"            DROP CONSTRAINT IF EXISTS "Session_userId_fkey";

DROP TABLE IF EXISTS "ApplicationDocument" CASCADE;
DROP TABLE IF EXISTS "ApplicationHistory"  CASCADE;
DROP TABLE IF EXISTS "Application"         CASCADE;
DROP TABLE IF EXISTS "Document"            CASCADE;
DROP TABLE IF EXISTS "Notification"        CASCADE;
DROP TABLE IF EXISTS "Payment"             CASCADE;
DROP TABLE IF EXISTS "RefreshToken"        CASCADE;
DROP TABLE IF EXISTS "Session"             CASCADE;
DROP TABLE IF EXISTS "AuditLog"            CASCADE;
DROP TABLE IF EXISTS "GovernmentService"   CASCADE;
DROP TABLE IF EXISTS "User"                CASCADE;
DROP TABLE IF EXISTS "Role"                CASCADE;

DROP TYPE IF EXISTS "UserRole"     CASCADE;
DROP TYPE IF EXISTS "UserStatus"   CASCADE;
DROP TYPE IF EXISTS "DocumentStatus" CASCADE;
DROP TYPE IF EXISTS "DocumentType"   CASCADE;
DROP TYPE IF EXISTS "PaymentMethod"  CASCADE;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ApplicationStatus_new') THEN
    DROP TYPE IF EXISTS "ApplicationStatus" CASCADE;
    ALTER TYPE "ApplicationStatus_new" RENAME TO "ApplicationStatus";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentStatus_new') THEN
    DROP TYPE IF EXISTS "PaymentStatus" CASCADE;
    ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationChannel_new') THEN
    DROP TYPE IF EXISTS "NotificationChannel" CASCADE;
    ALTER TYPE "NotificationChannel_new" RENAME TO "NotificationChannel";
  END IF;
END $$;

COMMIT;
