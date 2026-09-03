/**
 * prisma/seed.ts — Success MP Online
 *
 * SAFETY RULES (enforced in code):
 *   • Uses upsert ONLY — never truncate, never delete production data.
 *   • Idempotent: safe to run multiple times against production.
 *   • Will NOT overwrite existing user passwords.
 *   • Will NOT delete old services or old roles.
 *   • After migration: adds SUPER_ADMIN, ADMIN, OPERATOR roles (new rows),
 *     and 3 new seed services alongside the 3 migrated ones.
 *
 * Data decisions (per 2026-08-07 migration plan):
 *   • admin@gov.in is already in DB as SUPER_ADMIN — do NOT re-create.
 *   • Seed does NOT create admin@successmponline.in.
 *   • Old services (INC-CERT-01, CST-CERT-02, BIZ-LIC-03) are preserved
 *     by the migration SQL; seed only adds pan_card, gumasta_license, msme_registration.
 */

import { PrismaClient, RoleName } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("╔══════════════════════════════════════╗");
  console.log("║  Success MP Online — Database Seed   ║");
  console.log("╚══════════════════════════════════════╝\n");

  // ──────────────────────────────────────────────────────────
  // STEP 1: Roles — upsert all 5 roles
  // Existing roles from migration are SUPER_ADMIN, STAFF, USER.
  // Seed ensures ADMIN and OPERATOR also exist.
  // ──────────────────────────────────────────────────────────
  console.log("▶ Step 1: Seeding roles...");

  const roleDefinitions: { name: RoleName; description: string }[] = [
    { name: RoleName.SUPER_ADMIN, description: "Super Administrator with full system control" },
    { name: RoleName.ADMIN,       description: "Administrator for managing services and staff" },
    { name: RoleName.STAFF,       description: "Staff reviewer for citizen applications" },
    { name: RoleName.OPERATOR,    description: "Kiosk operator for application entry" },
    { name: RoleName.USER,        description: "Citizen user portal access" },
  ];

  const createdRoles: Record<string, string> = {};

  for (const roleDef of roleDefinitions) {
    const role = await prisma.role.upsert({
      where:  { name: roleDef.name },
      update: { description: roleDef.description },  // safe: just updates description
      create: roleDef,
    });
    createdRoles[roleDef.name] = role.id;
    console.log(`   ✓ ${roleDef.name}: ${role.id}`);
  }

  // ──────────────────────────────────────────────────────────
  // STEP 2: Service Category
  // ──────────────────────────────────────────────────────────
  console.log("\n▶ Step 2: Seeding service category...");

  const category = await prisma.serviceCategory.upsert({
    where:  { name: "Government Citizen Services" },
    update: {},
    create: {
      name:        "Government Citizen Services",
      description: "Official Madhya Pradesh Citizen Government Services",
    },
  });
  console.log(`   ✓ Category: ${category.name} (${category.id})`);

  // ──────────────────────────────────────────────────────────
  // STEP 3: Services — ONLY the 3 new seed services.
  // The 3 old services (INC-CERT-01, CST-CERT-02, BIZ-LIC-03)
  // are already in the DB from the migration SQL.
  // ──────────────────────────────────────────────────────────
  console.log("\n▶ Step 3: Seeding new services...");

  const newServicesData = [
    {
      code:        "pan_card",
      name:        "PAN Card Application",
      tagline:     "New PAN or Correction",
      description: "Apply for a new Permanent Account Number (PAN) or correct existing PAN details easily.",
      fee:         150,
      active:      true,
      categoryId:  category.id,
      fields: [
        { name: "fullName",   label: "Full Name",       type: "text", required: true, placeholder: "As per Aadhaar" },
        { name: "fatherName", label: "Father's Name",   type: "text", required: true },
        { name: "dob",        label: "Date of Birth",   type: "date", required: true },
        { name: "aadhaarNo",  label: "Aadhaar Number",  type: "text", required: true, placeholder: "12-digit Aadhaar" },
      ],
      documents: [
        { name: "aadhaar_card",    label: "Aadhaar Card",               description: "Clear copy of Aadhaar card front & back",    required: true },
        { name: "passport_photo",  label: "Passport Size Photograph",   description: "Recent passport photo",                       required: true },
        { name: "signature",       label: "Applicant Signature",        description: "Signature on white paper",                    required: true },
      ],
    },
    {
      code:        "gumasta_license",
      name:        "Gumasta License",
      tagline:     "Shop & Establishment Registration",
      description: "Register your shop or commercial establishment under the MP Shops & Establishments Act.",
      fee:         599,
      active:      true,
      categoryId:  category.id,
      fields: [
        { name: "enterpriseName", label: "Shop / Enterprise Name", type: "text",     required: true },
        { name: "ownerName",      label: "Owner Full Name",        type: "text",     required: true },
        { name: "category",       label: "Business Category",      type: "select",   required: true,
          options: ["Retail Trade","Wholesale Trade","Restaurant / Hotel","IT Services","Manufacturing / Workshop","Other Services"] },
        { name: "address",        label: "Shop Address",           type: "textarea", required: true, fullWidth: true },
        { name: "employeeCount",  label: "Number of Employees",    type: "text",     required: true, placeholder: "e.g. 5" },
      ],
      documents: [
        { name: "owner_id",         label: "Owner ID Proof (PAN / Aadhaar)", description: "Identity proof of shop owner",          required: true },
        { name: "shop_address_proof", label: "Shop Address Proof",           description: "Electricity bill / Rent agreement",     required: true },
        { name: "photo_outer",      label: "Shop Outer Board Photo",         description: "Photo of shop showing name board",       required: true },
      ],
    },
    {
      code:        "msme_registration",
      name:        "MSME / Udyam Registration",
      tagline:     "Free MSME Certificate",
      description: "Register your micro, small or medium enterprise with MSME Govt. of India for subsidies & loans.",
      fee:         199,
      active:      true,
      categoryId:  category.id,
      fields: [
        { name: "unitName",    label: "Enterprise / Unit Name",     type: "text", required: true },
        { name: "ownerName",   label: "Owner / Managing Partner",   type: "text", required: true },
        { name: "panNo",       label: "PAN Number",                 type: "text", required: true, placeholder: "10-digit PAN" },
        { name: "bankAccount", label: "Bank Account Number",        type: "text", required: true },
        { name: "ifscCode",    label: "Bank IFSC Code",             type: "text", required: true, placeholder: "e.g. SBIN0001234" },
      ],
      documents: [
        { name: "pan_card",      label: "PAN Card",                        description: "Copy of PAN card",                      required: true },
        { name: "bank_passbook", label: "Bank Passbook / Cancelled Cheque", description: "Proof of bank account",                required: true },
      ],
    },
  ];

  for (const svc of newServicesData) {
    const result = await prisma.service.upsert({
      where:  { code: svc.code },
      update: {
        name:        svc.name,
        tagline:     svc.tagline,
        description: svc.description,
        fee:         svc.fee,
        active:      svc.active,
        categoryId:  svc.categoryId,
        fields:      svc.fields,
        documents:   svc.documents,
      },
      create: svc,
    });
    console.log(`   ✓ ${result.code}: ${result.name} (fee: ₹${result.fee})`);
  }

  // ──────────────────────────────────────────────────────────
  // STEP 4: Verify existing migrated users are present
  // NOTE: We do NOT create admin@gov.in or staff@gov.in here —
  //       they are already in the DB from the migration.
  //       We only create a test user if it doesn't exist yet.
  // ──────────────────────────────────────────────────────────
  console.log("\n▶ Step 4: Verifying existing production users...");

  const existingUsers = await prisma.user.findMany({
    select: { id: true, email: true, role: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  console.log(`   Found ${existingUsers.length} existing user(s):`);
  for (const u of existingUsers) {
    console.log(`   • ${u.email} [${u.role?.name}]`);
  }

  // ──────────────────────────────────────────────────────────
  // STEP 5: Final summary
  // ──────────────────────────────────────────────────────────
  const finalCounts = {
    roles:    await prisma.role.count(),
    users:    await prisma.user.count(),
    services: await prisma.service.count(),
    categories: await prisma.serviceCategory.count(),
  };

  console.log("\n╔══════════════════════════════════════╗");
  console.log("║         Seed Complete ✓              ║");
  console.log("╚══════════════════════════════════════╝");
  console.log(`   roles:              ${finalCounts.roles}`);
  console.log(`   users:              ${finalCounts.users}`);
  console.log(`   services:           ${finalCounts.services}`);
  console.log(`   service_categories: ${finalCounts.categories}`);
}

main()
  .catch((e) => {
    console.error("\n✖ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
