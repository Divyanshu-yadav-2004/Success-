import { useState } from "react";
import { Link } from "react-router-dom";
import { LifeBuoy, LogOut, User, Check, X, Globe, Menu } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "919479336535";

export default function Navbar() {
  const { user, profile, isAdmin, signOut, updateProfile } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [address, setAddress] = useState(profile?.address || "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const displayName = profile?.full_name || user?.email || "User";
  const initial = displayName.charAt(0).toUpperCase();

  const handleOpenModal = () => {
    setFullName(profile?.full_name || "");
    setPhone(profile?.phone || "");
    setAddress(profile?.address || "");
    setMsg(null);
    setShowModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const { error } = await updateProfile({
      full_name: fullName,
      phone,
      address,
    });
    setSaving(false);
    if (error) {
      setMsg(`${t.navbar.error}: ${error}`);
    } else {
      setMsg(t.navbar.profileUpdated);
      setTimeout(() => setShowModal(false), 1200);
    }
  };

  return (
    <>
      {/* ── Professional government-portal header ───────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div
          className="mx-auto flex items-center justify-between"
          style={{ maxWidth: 1280, height: 72, paddingLeft: 20, paddingRight: 20 }}
        >

          {/* ── LEFT: Logo + brand text ─────────────────────────────────────── */}
          <Link to="/" className="flex items-center gap-3 shrink-0 min-w-0" style={{ textDecoration: "none" }}>
            {/* Official circular logo — 40×40 px, never distorted */}
            <img
              src="/logo.png"
              alt="SUCCESS MP ONLINE"
              style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "contain", flexShrink: 0, display: "block" }}
              draggable={false}
            />

            {/* Two-line brand block */}
            <div className="leading-none min-w-0">
              <p
                className="font-extrabold tracking-tight text-[#0f2d5c] whitespace-nowrap"
                style={{ fontSize: 16, lineHeight: "1.2" }}
              >
                SUCCESS MP ONLINE
              </p>
              <p
                className="hidden sm:block text-slate-400 font-medium whitespace-nowrap mt-0.5"
                style={{ fontSize: 11, lineHeight: "1.3" }}
              >
                Government Services Portal
              </p>
            </div>
          </Link>

          {/* ── RIGHT: Desktop Navigation ───────────────────────────────────── */}
          <nav className="hidden sm:flex items-center" style={{ gap: 16 }}>

            {/* Support */}
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors rounded-lg px-3 py-2 hover:bg-slate-50"
              style={{ fontSize: 14, fontWeight: 500, textDecoration: "none" }}
            >
              <LifeBuoy style={{ width: 18, height: 18, flexShrink: 0 }} />
              <span className="hidden sm:inline">{t.navbar.support}</span>
            </a>

            {/* Language Switcher - Exact match toggle */}
            <div className="flex items-center justify-center shrink-0">
              <LanguageToggle size="md" />
            </div>

            {/* Thin divider */}
            <span className="hidden sm:block w-px bg-slate-200 mx-2" style={{ height: 24 }} />

            {/* Profile avatar + name */}
            <button
              onClick={handleOpenModal}
              className="flex items-center gap-2.5 text-slate-600 hover:text-slate-900 transition-colors rounded-lg px-3 py-2 hover:bg-slate-50 cursor-pointer"
              title={t.navbar.viewOrEditProfile}
              style={{ fontSize: 14, fontWeight: 500 }}
            >
              {/* 38 px circular avatar */}
              <div
                className="bg-[#1e40af] text-white font-bold flex items-center justify-center shrink-0"
                style={{ width: 36, height: 36, borderRadius: "50%", fontSize: 14, lineHeight: 1 }}
              >
                {initial}
              </div>
              <span
                className="hidden md:inline font-semibold text-slate-700 max-w-[140px] truncate"
                style={{ fontSize: 14 }}
              >
                {displayName}
              </span>
            </button>

            {/* Thin divider */}
            <span className="hidden sm:block w-px bg-slate-200 mx-2" style={{ height: 24 }} />

            {/* Logout */}
            <button
              onClick={signOut}
              className="flex items-center gap-2 text-slate-500 hover:text-red-600 transition-colors rounded-lg px-3 py-2 hover:bg-red-50 cursor-pointer"
              style={{ fontSize: 14, fontWeight: 500 }}
            >
              <LogOut style={{ width: 18, height: 18, flexShrink: 0 }} />
              <span className="hidden sm:inline">{t.navbar.logout}</span>
            </button>

          </nav>

          {/* ── RIGHT: Mobile Navigation ─────────────────────────────────────── */}
          <div className="flex sm:hidden items-center gap-2 shrink-0">
            {/* Language Switcher - Exact match toggle */}
            <LanguageToggle size="sm" />

            {/* Hamburger Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="flex items-center justify-center p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            >
              <Menu style={{ width: 24, height: 24 }} />
            </button>
          </div>

          {/* ── Mobile Menu Dropdown ─────────────────────────────────────────── */}
          {showMobileMenu && (
            <div className="sm:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-lg z-50">
              <div className="px-4 py-3 space-y-2">
                {/* Support */}
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg px-3 py-2.5 transition-colors"
                  style={{ fontSize: 14, fontWeight: 500, textDecoration: "none" }}
                >
                  <LifeBuoy style={{ width: 18, height: 18, flexShrink: 0 }} />
                  {t.navbar.support}
                </a>

                {/* Profile */}
                <button
                  onClick={() => {
                    handleOpenModal();
                    setShowMobileMenu(false);
                  }}
                  className="flex items-center gap-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg px-3 py-2.5 transition-colors w-full text-left cursor-pointer"
                  style={{ fontSize: 14, fontWeight: 500 }}
                >
                  <div
                    className="bg-[#1e40af] text-white font-bold flex items-center justify-center shrink-0"
                    style={{ width: 36, height: 36, borderRadius: "50%", fontSize: 14, lineHeight: 1 }}
                  >
                    {initial}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-700">{displayName}</span>
                    <span className="text-xs text-slate-500">{t.navbar.myProfile}</span>
                  </div>
                </button>

                {/* Logout */}
                <button
                  onClick={() => {
                    signOut();
                    setShowMobileMenu(false);
                  }}
                  className="flex items-center gap-3 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg px-3 py-2.5 transition-colors w-full text-left cursor-pointer"
                  style={{ fontSize: 14, fontWeight: 500 }}
                >
                  <LogOut style={{ width: 18, height: 18, flexShrink: 0 }} />
                  {t.navbar.logout}
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Edit Profile Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{t.navbar.myProfile}</h3>
                <p className="text-xs text-slate-500">
                  {t.navbar.updateContactDetails}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t.navbar.fullName}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none"
                  placeholder={t.navbar.enterFullName}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t.navbar.phoneNumber}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none"
                  placeholder={t.navbar.enterPhone}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t.navbar.address}
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-none"
                  placeholder={t.navbar.enterAddress}
                />
              </div>

              <div className="pt-2">
                <p className="text-xs text-slate-400">
                  {t.navbar.role}:{" "}
                  <span className="font-bold text-slate-700 uppercase">
                    {profile?.role || "user"}
                  </span>
                </p>
              </div>

              {msg && (
                <p
                  className={`text-xs p-2.5 rounded-xl ${
                    msg.includes(t.navbar.error)
                      ? "bg-red-50 text-red-600"
                      : "bg-emerald-50 text-emerald-700 font-semibold"
                  }`}
                >
                  {msg}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-xs"
                >
                  {t.navbar.cancel}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-700/20"
                >
                  {saving ? (
                    t.navbar.saving
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> {t.navbar.saveChanges}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
