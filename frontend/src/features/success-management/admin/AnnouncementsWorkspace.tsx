import React, { useEffect, useState } from "react";
import { Megaphone, Plus, Send, CheckCircle2, Clock, Users, Loader2 } from "lucide-react";
import { fetchAnnouncements } from "../announcements/announcements-api";
import { AnnouncementItem } from "../types";
import { AnnouncementFormModal } from "../announcements/AnnouncementFormModal";

export const AnnouncementsWorkspace: React.FC = () => {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await fetchAnnouncements();
      setAnnouncements(data || []);
    } catch (err) {
      console.error("Error loading announcements", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-indigo-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-indigo-800/80 border border-indigo-700/80 rounded-full text-[11px] font-bold text-indigo-200 uppercase tracking-wider">
            Broadcast Communication Engine
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold mt-2 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-indigo-300" />
            Smart Announcements
          </h2>
          <p className="text-xs text-indigo-200 mt-1 max-w-xl">
            Broadcast policy updates, new government service launches, and emergency notifications directly to citizens via in-app feeds and email notifications.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Create & Broadcast Announcement
        </button>
      </div>

      {/* Broadcasted History Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            Published Announcements History
          </h3>
          <span className="text-xs font-semibold text-slate-400">
            Total Broadcasts: {announcements.length}
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span>Loading broadcast announcements...</span>
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs">
            No announcements published yet. Click above to create your first announcement.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {announcements.map((anc) => (
              <div key={anc.id} className="p-5 hover:bg-slate-50 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      TARGET: {anc.targetType}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Published {new Date(anc.createdAt).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{anc.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2">{anc.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showModal && (
        <AnnouncementFormModal
          isOpen={true}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            loadAnnouncements();
            alert("Announcement broadcasted successfully!");
          }}
        />
      )}
    </div>
  );
};
