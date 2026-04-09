"use client";

import { useState, useRef, useEffect } from "react";
import { adminProfile, updateAdminProfile, generateOTP, loadPersistedAvatar } from "@/lib/adminAuth";
import AdminModal from "@/components/admin/AdminModal";
import { FormField, Input, FormActions } from "@/components/admin/FormField";
import {
  User, Mail, Phone, Shield, Pencil, Lock,
  Eye, EyeOff, CheckCircle2, AlertCircle,
  Loader2, RefreshCw, ShieldCheck, Camera, X,
} from "lucide-react";

// ─── types ────────────────────────────────────────────────────────────────────
type PwStep = "idle" | "otp-send" | "otp-verify" | "new-pw" | "done";

const OTP_LEN = 6;
const RESEND_SECS = 60;

// ─────────────────────────────────────────────────────────────────────────────
export default function ProfilePage() {

  // ── force re-render after profile update ──
  const [, forceRender] = useState(0);

  // ── avatar upload ──
  const [avatarSrc, setAvatarSrc] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPersistedAvatar();
    setAvatarSrc(adminProfile.avatar);
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      updateAdminProfile({ avatar: result });
      setAvatarSrc(result);
      forceRender((n) => n + 1);
    };
    reader.readAsDataURL(file);
    // reset so the same file can be re-selected
    e.target.value = "";
  };

  const handleRemoveAvatar = () => {
    updateAdminProfile({ avatar: "" });
    setAvatarSrc("");
    forceRender((n) => n + 1);
  };

  // ── profile edit ──
  const [profileModal, setProfileModal] = useState(false);
  const [pName, setPName] = useState(adminProfile.name);
  const [pEmail, setPEmail] = useState(adminProfile.email);
  const [pPhone, setPPhone] = useState(adminProfile.phone);
  const [pRole, setPRole] = useState(adminProfile.role);
  const [profileSaved, setProfileSaved] = useState(false);

  // ── change-password modal ──
  const [pwModal, setPwModal] = useState(false);
  const [pwStep, setPwStep] = useState<PwStep>("idle");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LEN).fill(""));
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [pwError, setPwError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── OTP refs ──
  const otpRefs: (HTMLInputElement | null)[] = [];

  // ─── timer ───────────────────────────────────────────────────────────────
  let timerInterval: ReturnType<typeof setInterval>;
  const startTimer = () => {
    setResendTimer(RESEND_SECS);
    timerInterval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) { clearInterval(timerInterval); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const simulate = (ms = 600) => new Promise((r) => setTimeout(r, ms));

  // ─── profile save ─────────────────────────────────────────────────────────
  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateAdminProfile({ name: pName, email: pEmail, phone: pPhone, role: pRole });
    setProfileModal(false);
    setProfileSaved(true);
    forceRender((n) => n + 1);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const openProfileModal = () => {
    setPName(adminProfile.name);
    setPEmail(adminProfile.email);
    setPPhone(adminProfile.phone);
    setPRole(adminProfile.role);
    setProfileModal(true);
  };

  // ─── change password flow ─────────────────────────────────────────────────
  const openPwModal = () => {
    setPwStep("otp-send");
    setOtp(Array(OTP_LEN).fill(""));
    setOtpError(""); setOtpSuccess(false);
    setNewPw(""); setConfirmPw(""); setPwError("");
    // Auto-send OTP immediately
    const code = generateOTP();
    setGeneratedOtp(code);
    console.info(`[DEV] Password-change OTP: ${code}`);
    startTimer();
    setPwModal(true);
  };

  // OTP input handlers
  const handleOtpChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp]; next[idx] = digit; setOtp(next);
    setOtpError("");
    if (digit && idx < OTP_LEN - 1) otpRefs[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (otp[idx]) { const n = [...otp]; n[idx] = ""; setOtp(n); }
      else if (idx > 0) otpRefs[idx - 1]?.focus();
    } else if (e.key === "ArrowLeft" && idx > 0) otpRefs[idx - 1]?.focus();
    else if (e.key === "ArrowRight" && idx < OTP_LEN - 1) otpRefs[idx + 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LEN).split("");
    const next = Array(OTP_LEN).fill("");
    digits.forEach((d, i) => { next[i] = d; });
    setOtp(next);
    otpRefs[Math.min(digits.length, OTP_LEN - 1)]?.focus();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const entered = otp.join("");
    if (entered.length < OTP_LEN) { setOtpError("Enter all 6 digits."); return; }
    setLoading(true);
    await simulate(500);
    setLoading(false);
    if (entered === generatedOtp) {
      setOtpSuccess(true);
      await simulate(600);
      setOtpSuccess(false);
      setNewPw(""); setConfirmPw(""); setPwError("");
      setPwStep("new-pw");
    } else {
      setOtpError("Incorrect OTP. Please try again.");
      setOtp(Array(OTP_LEN).fill(""));
      setTimeout(() => otpRefs[0]?.focus(), 50);
    }
  };

  const handleResend = () => {
    if (resendTimer > 0) return;
    const code = generateOTP();
    setGeneratedOtp(code);
    console.info(`[DEV] New Password-change OTP: ${code}`);
    setOtp(Array(OTP_LEN).fill(""));
    setOtpError("");
    startTimer();
    setTimeout(() => otpRefs[0]?.focus(), 50);
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    if (newPw.length < 6) { setPwError("Password must be at least 6 characters."); return; }
    if (newPw !== confirmPw) { setPwError("Passwords do not match."); return; }
    setLoading(true);
    await simulate(600);
    updateAdminProfile({ password: newPw });
    setLoading(false);
    setPwStep("done");
  };

  // ─── strength ────────────────────────────────────────────────────────────
  const pwScore = (pw: string) =>
    (pw.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(pw) ? 1 : 0) +
    (/[0-9]/.test(pw) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(pw) ? 1 : 0);

  const strengthColors = ["bg-destructive", "bg-orange-400", "bg-yellow-400", "bg-blue-500", "bg-green-500"];
  const strengthLabels = ["Too short", "Weak", "Fair", "Good", "Strong"];
  const strengthText = ["text-destructive", "text-orange-500", "text-yellow-600", "text-blue-600", "text-green-600"];
  const score = pwScore(newPw);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Admin Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">View and manage your admin account details.</p>
      </div>

      {/* Saved toast */}
      {profileSaved && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          <CheckCircle2 size={15} /> Profile updated successfully.
        </div>
      )}

      {/* ── Profile card ── */}
      <div className="bg-background border border-border rounded-2xl overflow-hidden">
        {/* Top banner */}
        {/* <div className="h-24 bg-gradient-to-r from-foreground to-foreground/80 relative">
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--primary)) 1px,transparent 1px)," +
                "linear-gradient(90deg,hsl(var(--primary)) 1px,transparent 1px)",
              backgroundSize: "30px 30px",
            }}
          />
        </div> */}

        {/* Avatar + info */}
        <div className="px-4 sm:px-8 pb-6 sm:pb-8">
          {/* Avatar row */}
          <div className="my-4 flex items-end justify-between gap-4">

            {/* Clickable avatar with camera overlay */}
            <div className="relative group flex-shrink-0">
              {/* Hidden file input */}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />

              {/* Avatar circle */}
              <div className="w-20 h-20 rounded-2xl bg-primary border-4 border-background shadow-lg overflow-hidden flex items-center justify-center">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-white font-heading select-none">
                    {adminProfile.avatarInitial}
                  </span>
                )}
              </div>

              {/* Camera overlay — click to upload */}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Change photo"
              >
                <Camera size={20} className="text-white" />
              </button>

              {/* Remove badge — only shown when a photo is set */}
              {avatarSrc && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center shadow hover:bg-destructive/80 transition-colors"
                  title="Remove photo"
                >
                  <X size={11} />
                </button>
              )}
            </div>

            <button
              onClick={openProfileModal}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Pencil size={14} />
              <span className="hidden sm:inline">Edit Profile</span>
              <span className="sm:hidden">Edit</span>
            </button>
          </div>

          {/* Name & role */}
          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl font-heading font-bold text-foreground">{adminProfile.name}</h2>
            <span className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              <Shield size={11} /> {adminProfile.role}
            </span>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailCard icon={<Mail size={16} className="text-primary" />} label="Email Address" value={adminProfile.email} />
            <DetailCard icon={<Phone size={16} className="text-primary" />} label="Phone Number" value={adminProfile.phone || "—"} />
            <DetailCard icon={<User size={16} className="text-primary" />} label="Full Name" value={adminProfile.name} />
            <DetailCard icon={<Shield size={16} className="text-primary" />} label="Role" value={adminProfile.role} />
          </div>
        </div>
      </div>

      {/* ── Security card ── */}
      <div className="bg-background border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
              <Lock size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Password</p>
              <p className="text-xs text-muted-foreground">Last changed: this session</p>
            </div>
          </div>
          <button
            onClick={openPwModal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-colors shadow-sm"
          >
            <Lock size={14} /> Change Password
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          MODAL: Edit Profile
      ══════════════════════════════════════════ */}
      <AdminModal title="Edit Profile" isOpen={profileModal} onClose={() => setProfileModal(false)}>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <FormField label="Full Name" required>
            <Input value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Admin User" required />
          </FormField>
          <FormField label="Email Address" required>
            <Input type="email" value={pEmail} onChange={(e) => setPEmail(e.target.value)} placeholder="admin@brightocity.com" required />
          </FormField>
          <FormField label="Phone Number">
            <Input value={pPhone} onChange={(e) => setPPhone(e.target.value)} placeholder="+1 555-0100" />
          </FormField>
          <FormField label="Role">
            <Input value={pRole} onChange={(e) => setPRole(e.target.value)} placeholder="Super Administrator" />
          </FormField>
          <FormActions onCancel={() => setProfileModal(false)} isEdit />
        </form>
      </AdminModal>

      {/* ══════════════════════════════════════════
          MODAL: Change Password (OTP flow)
      ══════════════════════════════════════════ */}
      <AdminModal
        title={
          pwStep === "otp-send" ? "Verify Identity" :
            pwStep === "otp-verify" ? "Enter OTP" :
              pwStep === "new-pw" ? "Set New Password" :
                pwStep === "done" ? "Password Updated" : "Change Password"
        }
        isOpen={pwModal}
        onClose={() => setPwModal(false)}
      >

        {/* ── Step: OTP sent, enter code ── */}
        {(pwStep === "otp-send" || pwStep === "otp-verify") && (
          <div className="space-y-5">
            <div className="p-3.5 rounded-lg bg-primary/8 border border-primary/20 text-sm text-foreground">
              <p>An OTP has been sent to <span className="font-semibold">{adminProfile.email}</span>.</p>
              <p className="text-xs text-muted-foreground mt-0.5">Check your browser console for the code (dev mode).</p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-5" noValidate>
              {/* OTP boxes */}
              <div className="flex items-center justify-center gap-2" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => { setPwStep("otp-verify"); handleOtpChange(i, e.target.value); }}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className={`w-11 text-center text-lg font-bold rounded-xl border-2 bg-background text-foreground
                      focus:outline-none transition-all duration-150
                      ${otpSuccess
                        ? "border-green-500 bg-green-50 text-green-700"
                        : otpError
                          ? "border-destructive"
                          : digit
                            ? "border-primary bg-primary/5"
                            : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
                      }`}
                    style={{ height: "3rem" }}
                    aria-label={`OTP digit ${i + 1}`}
                  />
                ))}
              </div>

              {otpError && (
                <p className="flex items-center justify-center gap-1.5 text-sm text-destructive">
                  <AlertCircle size={13} /> {otpError}
                </p>
              )}
              {otpSuccess && (
                <p className="flex items-center justify-center gap-1.5 text-sm text-green-600">
                  <CheckCircle2 size={13} /> OTP verified!
                </p>
              )}

              <button
                type="submit"
                disabled={loading || otp.join("").length < OTP_LEN}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
              >
                {loading ? <><Loader2 size={14} className="animate-spin" /> Verifying…</> : "Verify OTP"}
              </button>

              {/* Resend */}
              <div className="flex items-center justify-center gap-1.5 text-sm">
                <span className="text-muted-foreground">Didn't receive it?</span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendTimer > 0}
                  className={`flex items-center gap-1 font-medium transition-colors ${resendTimer > 0 ? "text-muted-foreground cursor-not-allowed" : "text-primary hover:underline"
                    }`}
                >
                  <RefreshCw size={12} />
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Step: new password ── */}
        {pwStep === "new-pw" && (
          <form onSubmit={handleSetPassword} className="space-y-4" noValidate>
            {pwError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/8 border border-destructive/20 text-destructive text-sm">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" /> {pwError}
              </div>
            )}

            <FormField label="New Password" required>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type={showNew ? "text" : "password"}
                  value={newPw}
                  onChange={(e) => { setNewPw(e.target.value); setPwError(""); }}
                  placeholder="Minimum 6 characters"
                  required
                  className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
                <button type="button" onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {newPw.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < score ? strengthColors[score] : "bg-border"}`} />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${strengthText[score]}`}>{strengthLabels[score]}</p>
                </div>
              )}
            </FormField>

            <FormField label="Confirm New Password" required>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type={showConf ? "text" : "password"}
                  value={confirmPw}
                  onChange={(e) => { setConfirmPw(e.target.value); setPwError(""); }}
                  placeholder="Re-enter new password"
                  required
                  className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
                <button type="button" onClick={() => setShowConf((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showConf ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </FormField>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={() => setPwModal(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-60 text-white transition-colors flex items-center gap-2">
                {loading ? <><Loader2 size={14} className="animate-spin" />Updating…</> : "Update Password"}
              </button>
            </div>
          </form>
        )}

        {/* ── Step: done ── */}
        {pwStep === "done" && (
          <div className="text-center space-y-4 py-2">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-100 border-4 border-green-200 flex items-center justify-center">
                <ShieldCheck size={28} className="text-green-600" />
              </div>
            </div>
            <div>
              <p className="font-semibold text-foreground text-lg">Password Changed!</p>
              <p className="text-sm text-muted-foreground mt-1">Your password has been updated successfully.</p>
            </div>
            <button
              onClick={() => { setPwModal(false); setPwStep("idle"); }}
              className="w-full bg-primary hover:bg-primary/90 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </AdminModal>
    </div>
  );
}

// ─── small sub-component ────────────────────────────────────────────────────
function DetailCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border">
      <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-foreground mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}
