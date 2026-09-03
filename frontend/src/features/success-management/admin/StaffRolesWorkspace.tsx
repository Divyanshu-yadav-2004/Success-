import React from "react";
import { UserCheck, ShieldCheck, Lock, CheckCircle2, User as UserIcon } from "lucide-react";

export const StaffRolesWorkspace: React.FC = () => {
  const staffMembers = [
    {
      id: "stf-01",
      name: "System Administrator",
      email: "admin@gov.in",
      empId: "GOV-ADM-001",
      role: "SUPER_ADMIN",
      dept: "Executive IT Operations",
      status: "ACTIVE",
    },
    {
      id: "stf-02",
      name: "Rajesh Kumar",
      email: "staff@gov.in",
      empId: "GOV-STF-001",
      role: "STAFF",
      dept: "Citizen Verification Cell",
      status: "ACTIVE",
    },
    {
      id: "stf-03",
      name: "Success MP Admin",
      email: "admin@successmponline.in",
      empId: "GOV-ADM-002",
      role: "SUPER_ADMIN",
      dept: "Portal Operations",
      status: "ACTIVE",
    },
  ];

  const rolesMatrix = [
    { name: "SUPER_ADMIN", desc: "Full system control, database access, user management & broadcasts", badge: "bg-purple-100 text-purple-800 border-purple-200" },
    { name: "ADMIN", desc: "Service catalog management, staff management & application approval", badge: "bg-indigo-100 text-indigo-800 border-indigo-200" },
    { name: "STAFF", desc: "Document verification, application review & PDF document delivery", badge: "bg-blue-100 text-blue-800 border-blue-200" },
    { name: "OPERATOR", desc: "Kiosk application submission and status lookup", badge: "bg-slate-100 text-slate-800 border-slate-200" },
    { name: "USER", desc: "Citizen portal access, online service applications & document download", badge: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-blue-600" />
          Staff Members & Access Controls
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Authorized government staff accounts, employee identifiers, and role-based permissions
        </p>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Active Staff Roster</h3>
          <span className="text-xs font-semibold text-slate-400">Total Authorized Staff: {staffMembers.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-4">Staff Member</th>
                <th className="p-4">Employee ID</th>
                <th className="p-4">Department</th>
                <th className="p-4">Role Assigned</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {staffMembers.map((st) => (
                <tr key={st.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4">
                    <p className="font-bold text-slate-900">{st.name}</p>
                    <p className="text-[11px] text-slate-400">{st.email}</p>
                  </td>
                  <td className="p-4 font-mono font-bold text-blue-700">{st.empId}</td>
                  <td className="p-4 text-slate-600">{st.dept}</td>
                  <td className="p-4">
                    <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full text-[10px] font-bold">
                      {st.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[10px] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Matrix */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Lock className="w-4 h-4 text-blue-600" /> Role-Based Access Control (RBAC) Architecture
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rolesMatrix.map((r) => (
            <div key={r.name} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold border ${r.badge}`}>
                {r.name}
              </span>
              <p className="text-xs text-slate-600 mt-2">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
