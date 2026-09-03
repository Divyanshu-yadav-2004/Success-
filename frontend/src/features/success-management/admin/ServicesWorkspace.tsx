import React, { useState } from "react";
import { Briefcase, CreditCard, Search, CheckCircle2, Sliders, ShieldCheck } from "lucide-react";
import { SERVICES } from "@/lib/services";

export const ServicesWorkspace: React.FC = () => {
  const [search, setSearch] = useState("");

  const filtered = SERVICES.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.tagline.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            Government Services Catalog Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure active citizen services, official application fee structures, and document requirements
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-600 shadow-2xs"
          />
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((svc) => (
          <div
            key={svc.id}
            className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                {svc.id}
              </span>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                ACTIVE SERVICE
              </span>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-base">{svc.name}</h3>
              <p className="text-xs text-blue-600 font-medium">{svc.tagline}</p>
              <p className="text-xs text-slate-500 mt-2 line-clamp-2">{svc.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Service Fee</span>
                <span className="font-extrabold text-slate-900 text-lg">&#8377;{svc.fee}</span>
              </div>

              <button className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer">
                View Requirements
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
