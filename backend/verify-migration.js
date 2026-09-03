/**
 * verify-migration.js
 * Post-migration verification script for Success MP Online.
 * Run after migration SQL and prisma generate.
 *
 * Usage: node verify-migration.js
 */

// Use old Prisma client path or just raw SQL via DATABASE_URL
const { execSync } = require('child_process');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_GYxhB2zbu3KA@ep-royal-wave-aytc4klb-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

// We use dynamic require of the new Prisma client (must be generated first)
async function main() {
  let PrismaClient;
  try {
    PrismaClient = require('./node_modules/@prisma/client').PrismaClient;
  } catch(e) {
    console.error('ERROR: Prisma client not found. Run: npx prisma generate');
    process.exit(1);
  }

  const prisma = new PrismaClient({
    datasources: { db: { url: DATABASE_URL } }
  });

  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  Success MP Online — Migration Verification  ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  let allPassed = true;
  const fail = (msg) => { console.error(`  ✖ FAIL: ${msg}`); allPassed = false; };
  const pass = (msg) => console.log(`  ✓ PASS: ${msg}`);

  // ── 1. Table existence and row counts ──────────────────
  console.log('▶ 1. Row Counts\n');

  try {
    const tables = [
      { model: 'role',                  min: 3,  label: 'roles' },
      { model: 'user',                  min: 3,  label: 'users' },
      { model: 'userProfile',           min: 3,  label: 'user_profiles' },
      { model: 'service',               min: 3,  label: 'services' },
      { model: 'serviceCategory',       min: 1,  label: 'service_categories' },
      { model: 'application',           min: 0,  label: 'applications' },
      { model: 'payment',               min: 0,  label: 'payments' },
      { model: 'notification',          min: 0,  label: 'notifications' },
      { model: 'refreshToken',          min: 0,  label: 'refresh_tokens' },
      { model: 'auditLog',              min: 0,  label: 'audit_logs' },
      { model: 'passwordResetToken',    min: 0,  label: 'password_reset_tokens' },
      { model: 'announcement',          min: 0,  label: 'announcements' },
    ];

    for (const t of tables) {
      try {
        const count = await prisma[t.model].count();
        if (count < t.min) {
          fail(`${t.label}: expected >= ${t.min}, got ${count}`);
        } else {
          pass(`${t.label}: ${count} rows`);
        }
      } catch(e) {
        fail(`${t.label}: query failed — ${e.message}`);
      }
    }
  } catch(e) {
    fail(`Row count check failed: ${e.message}`);
  }

  // ── 2. Verify specific migrated data ───────────────────
  console.log('\n▶ 2. Migrated Data Verification\n');

  // Check existing 3 users by email
  const expectedUsers = [
    'admin@gov.in',
    'staff@gov.in',
    'applicant@citizen.in',
  ];
  for (const email of expectedUsers) {
    try {
      const u = await prisma.user.findUnique({
        where: { email },
        include: { role: true, profile: true },
      });
      if (!u) {
        fail(`User not found: ${email}`);
      } else {
        pass(`User ${email}: role=${u.role?.name}, profile.full_name=${u.profile?.fullName}`);
      }
    } catch(e) {
      fail(`User lookup ${email}: ${e.message}`);
    }
  }

  // Check admin@gov.in is now SUPER_ADMIN
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@gov.in' },
      include: { role: true },
    });
    if (!admin) {
      fail('admin@gov.in not found');
    } else if (admin.role?.name !== 'SUPER_ADMIN') {
      fail(`admin@gov.in role is ${admin.role?.name}, expected SUPER_ADMIN`);
    } else {
      pass(`admin@gov.in is correctly SUPER_ADMIN`);
    }
  } catch(e) {
    fail(`admin@gov.in role check: ${e.message}`);
  }

  // Check old services are present in new services table
  const expectedServiceCodes = ['INC-CERT-01', 'CST-CERT-02', 'BIZ-LIC-03'];
  for (const code of expectedServiceCodes) {
    try {
      const svc = await prisma.service.findUnique({ where: { code } });
      if (!svc) {
        fail(`Old service not found: ${code}`);
      } else {
        pass(`Old service ${code}: ${svc.name} (fee=₹${svc.fee}, active=${svc.active})`);
      }
    } catch(e) {
      fail(`Service lookup ${code}: ${e.message}`);
    }
  }

  // Check roles
  const expectedRoles = ['SUPER_ADMIN', 'STAFF', 'USER'];
  for (const roleName of expectedRoles) {
    try {
      const r = await prisma.role.findUnique({ where: { name: roleName } });
      if (!r) {
        fail(`Role not found: ${roleName}`);
      } else {
        pass(`Role ${roleName}: ${r.id}`);
      }
    } catch(e) {
      fail(`Role lookup ${roleName}: ${e.message}`);
    }
  }

  // ── 3. Foreign key relationships ───────────────────────
  console.log('\n▶ 3. Foreign Key Integrity\n');

  try {
    const usersWithRoles = await prisma.user.findMany({
      include: { role: true, profile: true },
    });
    for (const u of usersWithRoles) {
      if (!u.role) {
        fail(`User ${u.email} has no role FK`);
      } else {
        pass(`User ${u.email}: role FK = ${u.role.name}`);
      }
      if (!u.profile) {
        fail(`User ${u.email} has no user_profile`);
      } else {
        pass(`User ${u.email}: profile.full_name = "${u.profile.fullName}"`);
      }
    }
  } catch(e) {
    fail(`FK integrity check: ${e.message}`);
  }

  // ── 4. Check old tables are gone ───────────────────────
  console.log('\n▶ 4. Old Table Cleanup\n');

  const oldTables = ['User', 'Role', 'GovernmentService', 'Application',
    'ApplicationDocument', 'ApplicationHistory', 'Document',
    'Notification', 'Payment', 'RefreshToken', 'Session', 'AuditLog'];

  for (const tbl of oldTables) {
    try {
      await prisma.$queryRawUnsafe(`SELECT COUNT(*) FROM "${tbl}"`);
      fail(`Old table still exists: "${tbl}" — should have been dropped`);
    } catch(e) {
      pass(`Old table "${tbl}" correctly removed`);
    }
  }

  // ── Summary ────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════');
  if (allPassed) {
    console.log('✅  ALL CHECKS PASSED — Migration successful!');
  } else {
    console.log('❌  SOME CHECKS FAILED — Review output above');
    process.exit(1);
  }
  console.log('══════════════════════════════════════════════\n');

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
