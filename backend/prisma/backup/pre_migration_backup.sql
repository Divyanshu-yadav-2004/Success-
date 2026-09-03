-- ============================================================
-- PRE-MIGRATION BACKUP — Success MP Online Neon Database
-- Generated: 2026-08-07
-- Purpose: Complete restore script for ALL 9 existing rows
--          (3 Roles, 3 Users, 3 GovernmentServices)
--
-- HOW TO RESTORE:
--   1. Connect to Neon via psql or any PostgreSQL client
--   2. Run this entire file
--   3. All 9 rows will be re-inserted (ON CONFLICT DO NOTHING
--      ensures idempotency if rows already exist)
-- ============================================================

-- ── ROLES (old "Role" table) ──────────────────────────────
INSERT INTO "Role" (id, name, description, permissions, "createdAt", "updatedAt")
VALUES
  (
    '5b550332-0d97-46ad-8c92-2f6229764db8',
    'ADMIN',
    'Super Administrator with full system control',
    '["users:read","users:write","users:delete","roles:read","roles:write","documents:read","documents:verify","documents:delete","applications:read","applications:write","applications:assign","applications:approve","payments:read","payments:write","admin:analytics","admin:logs"]'::jsonb,
    '2026-07-28 15:50:01.831',
    '2026-07-28 15:50:01.831'
  ),
  (
    '89bbdd0a-0a7c-4b32-9473-9de3c652d702',
    'STAFF',
    'Government Officer and Application Verifier',
    '["users:read","documents:read","documents:verify","applications:read","applications:write","applications:approve","payments:read"]'::jsonb,
    '2026-07-28 15:50:02.791',
    '2026-07-28 15:50:02.791'
  ),
  (
    '85f6295f-32f6-475c-bbeb-d89c32900632',
    'USER',
    'Citizen / Public Applicant',
    '["documents:read","documents:upload","applications:read","applications:create","payments:create","payments:read"]'::jsonb,
    '2026-07-28 15:50:03.023',
    '2026-07-28 15:50:03.023'
  )
ON CONFLICT (id) DO NOTHING;

-- ── USERS (old "User" table) ──────────────────────────────
INSERT INTO "User" (id, email, "passwordHash", "firstName", "lastName", phone, "nationalId",
                    role, status, "isEmailVerified", "isPhoneVerified", "avatarUrl",
                    "createdAt", "updatedAt")
VALUES
  (
    'e6e6e746-099f-4005-9924-51fb41b7407f',
    'admin@gov.in',
    '$2b$10$MN3mHrQDr2Vb5v1N83h0Ne5W9bFBLjYlNvS4VXyXKCVyzaHqL/2fS',
    'System',
    'Administrator',
    '+919876543210',
    'GOV-ADM-001',
    'ADMIN',
    'ACTIVE',
    true,
    true,
    NULL,
    '2026-07-28 15:50:03.327',
    '2026-07-28 15:50:03.327'
  ),
  (
    '0b6f6151-10c1-44ca-a283-1a3a3d507e40',
    'staff@gov.in',
    '$2b$10$/QarX6dG9Hc/UREkiv0TmeGANwxqeCDiD0MFUVGxjKkpZLKUJi8cG',
    'Rajesh',
    'Kumar',
    '+919876543211',
    'GOV-STF-001',
    'STAFF',
    'ACTIVE',
    true,
    true,
    NULL,
    '2026-07-28 15:50:05.615',
    '2026-07-28 15:50:05.615'
  ),
  (
    '75cc0fb7-f5f3-4e67-a797-ba707b820938',
    'applicant@citizen.in',
    '$2b$10$MAnW8DfZH2cgSmdS8PIkWO8uRTI9207TDdcG8ZSgv5.MO8cns8DTu',
    'Ananya',
    'Sharma',
    '+919876543212',
    'AADHAAR-1234-5678-9012',
    'USER',
    'ACTIVE',
    true,
    true,
    NULL,
    '2026-07-28 15:50:06.757',
    '2026-07-28 15:50:06.757'
  )
ON CONFLICT (id) DO NOTHING;

-- ── GOVERNMENT SERVICES (old "GovernmentService" table) ───
INSERT INTO "GovernmentService" (id, title, code, description, category,
                                  "feeAmount", "processingDays", "requiredDocuments",
                                  "isActive", "createdAt", "updatedAt")
VALUES
  (
    '4738d594-e3ea-46fd-9433-0e159f49c50a',
    'Income Certificate',
    'INC-CERT-01',
    'Official certificate verifying annual family income for welfare schemes.',
    'Revenue & Social Welfare',
    50,
    7,
    '["IDENTITY_PROOF","ADDRESS_PROOF","INCOME_CERTIFICATE","TAX_RETURNS"]'::jsonb,
    true,
    '2026-07-28 15:50:07.944',
    '2026-07-28 15:50:07.944'
  ),
  (
    '4cd9aea2-0a97-4d6c-b8d7-ed51d003c418',
    'Caste & Community Certificate',
    'CST-CERT-02',
    'Certificate issued to verify caste identity for reservation and official purposes.',
    'Social Justice',
    30,
    10,
    '["IDENTITY_PROOF","ADDRESS_PROOF","CASTE_CERTIFICATE"]'::jsonb,
    true,
    '2026-07-28 15:50:08.418',
    '2026-07-28 15:50:08.418'
  ),
  (
    'afc7351b-2294-4f61-b0a5-eb9ff6433f67',
    'Commercial Business License',
    'BIZ-LIC-03',
    'Registration and license for establishing commercial business enterprises.',
    'Commerce & Industry',
    500,
    14,
    '["IDENTITY_PROOF","ADDRESS_PROOF","BUSINESS_LICENSE","TAX_RETURNS"]'::jsonb,
    true,
    '2026-07-28 15:50:08.650',
    '2026-07-28 15:50:08.650'
  )
ON CONFLICT (id) DO NOTHING;

-- ── END OF BACKUP ─────────────────────────────────────────
-- To verify restore: 
--   SELECT COUNT(*) FROM "Role";        -- should be 3
--   SELECT COUNT(*) FROM "User";        -- should be 3
--   SELECT COUNT(*) FROM "GovernmentService"; -- should be 3
