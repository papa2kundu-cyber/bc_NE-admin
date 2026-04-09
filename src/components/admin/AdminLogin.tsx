"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Eye, EyeOff, Lock, Mail, AlertCircle,
  Loader2, ArrowLeft, CheckCircle2, RefreshCw, ShieldCheck,
} from "lucide-react";
import { adminProfile, updateAdminProfile, generateOTP } from "@/lib/adminAuth";
import { authService } from "@/services";

// ─── step types ───────────────────────────────────────────────────────────────
type Step = "login" | "forgot-email" | "forgot-otp" | "forgot-newpw" | "forgot-done";

interface AdminLoginProps { onLogin: () => void; }

// ─── shared input class ───────────────────────────────────────────────────────
const inp =
  "w-full py-2.5 text-sm rounded-lg border border-border bg-background text-foreground " +
  "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 " +
  "focus:border-primary transition-colors";

// ─── OTP_LENGTH ───────────────────────────────────────────────────────────────
const OTP_LEN = 6;
const RESEND_SECS = 60;

// ─────────────────────────────────────────────────────────────────────────────
export default function AdminLogin({ onLogin }: AdminLoginProps) {

  // ── login state ──
  const [step, setStep] = useState<Step>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  // ── forgot-password state ──
  const [fpEmail, setFpEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LEN).fill(""));
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwError, setPwError] = useState("");

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── countdown for resend ──
  const startTimer = useCallback(() => {
    setResendTimer(RESEND_SECS);
    timerRef.current = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) { clearInterval(timerRef.current!); return 0; }
        return t - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // ── helpers ──
  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const simulate = (ms = 700) => new Promise((r) => setTimeout(r, ms));

  // ─────────────────────────────────────────────────────────────────────────
  //  STEP 1 – Sign in
  // ─────────────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await authService.login({ email, password });
      onLogin();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
        "Invalid email or password. Please try again.";
      setError(msg);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  STEP 2 – Forgot: verify email
  // ─────────────────────────────────────────────────────────────────────────
  const handleForgotEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    await simulate();
    if (fpEmail.trim().toLowerCase() !== adminProfile.email.toLowerCase()) {
      setLoading(false);
      setError("No admin account found with that email.");
      triggerShake();
      return;
    }
    const code = generateOTP();
    setGeneratedOtp(code);
    // In production: send via email API. Here we surface it in console + UI hint.
    console.info(`[DEV] OTP for ${fpEmail}: ${code}`);
    setOtp(Array(OTP_LEN).fill(""));
    setOtpError("");
    setOtpSuccess(false);
    setLoading(false);
    setStep("forgot-otp");
    startTimer();
    // Focus first OTP box after render
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  OTP box input handling
  // ─────────────────────────────────────────────────────────────────────────
  const handleOtpChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    setOtpError("");
    if (digit && idx < OTP_LEN - 1) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (otp[idx]) {
        const next = [...otp]; next[idx] = ""; setOtp(next);
      } else if (idx > 0) {
        otpRefs.current[idx - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < OTP_LEN - 1) {
      otpRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LEN).split("");
    const next = Array(OTP_LEN).fill("");
    digits.forEach((d, i) => { next[i] = d; });
    setOtp(next);
    otpRefs.current[Math.min(digits.length, OTP_LEN - 1)]?.focus();
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  STEP 3 – Verify OTP
  // ─────────────────────────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const entered = otp.join("");
    if (entered.length < OTP_LEN) { setOtpError("Please enter all 6 digits."); return; }
    setLoading(true);
    await simulate(500);
    setLoading(false);
    if (entered === generatedOtp) {
      setOtpSuccess(true);
      await simulate(600);
      setOtpSuccess(false);
      setNewPw(""); setConfirmPw(""); setPwError("");
      setStep("forgot-newpw");
    } else {
      setOtpError("Incorrect OTP. Please try again.");
      setOtp(Array(OTP_LEN).fill(""));
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    }
  };

  const handleResend = () => {
    if (resendTimer > 0) return;
    const code = generateOTP();
    setGeneratedOtp(code);
    console.info(`[DEV] New OTP for ${fpEmail}: ${code}`);
    setOtp(Array(OTP_LEN).fill(""));
    setOtpError("");
    startTimer();
    setTimeout(() => otpRefs.current[0]?.focus(), 50);
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  STEP 4 – Set new password
  // ─────────────────────────────────────────────────────────────────────────
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    if (newPw.length < 6) { setPwError("Password must be at least 6 characters."); return; }
    if (newPw !== confirmPw) { setPwError("Passwords do not match."); return; }
    setLoading(true);
    await simulate(600);
    updateAdminProfile({ password: newPw });
    setLoading(false);
    setStep("forgot-done");
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  LEFT PANEL (shared branding)
  // ─────────────────────────────────────────────────────────────────────────
  const LeftPanel = () => (
    <div className="hidden lg:flex lg:w-5/12 bg-black relative overflow-hidden flex-col items-center justify-center p-12 flex-shrink-0">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--primary)) 1px,transparent 1px)," +
            "linear-gradient(90deg,hsl(var(--primary)) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute bottom-[-60px] left-[-60px] w-56 h-56 rounded-full bg-primary/10 blur-2xl" />

      <div className="relative z-10 text-center space-y-6 max-w-xs">
        <div className="flex justify-center">
          <Image
            src="/images/logoWhite.png"
            alt="Brightocity Interior"
            width={160}
            height={44}
            className="object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-heading font-bold text-white leading-tight">
            Welcome back,<br /><span className="text-primary">Admin</span>
          </h1>
          <p className="text-white/50 text-sm leading-relaxed">
            Sign in to manage your Brightocity Interior content, team, and more.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <div className="w-2 h-2 rounded-full bg-primary" />
          <div className="flex-1 h-px bg-white/10" />
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {["Photos", "Videos", "Blocks", "Teams", "FAQs", "Reviews"].map((t) => (
            <span key={t} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs">{t}</span>
          ))}
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  //  BACK BUTTON
  // ─────────────────────────────────────────────────────────────────────────
  const BackBtn = ({ to, label = "Back" }: { to: Step; label?: string }) => (
    <button
      type="button"
      onClick={() => { setError(""); setOtpError(""); setPwError(""); setStep(to); }}
      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
    >
      <ArrowLeft size={14} /> {label}
    </button>
  );

  // ─────────────────────────────────────────────────────────────────────────
  //  STEP INDICATOR  (shown in forgot steps)
  // ─────────────────────────────────────────────────────────────────────────
  const StepDots = ({ current }: { current: 1 | 2 | 3 }) => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {([1, 2, 3] as const).map((n) => (
        <div
          key={n}
          className={`rounded-full transition-all duration-300 ${n < current
            ? "w-6 h-2 bg-primary"
            : n === current
              ? "w-8 h-2 bg-primary"
              : "w-2 h-2 bg-border"
            }`}
        />
      ))}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex bg-muted/30">
      <LeftPanel />

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Image src="/images/logo.png" alt="Brightocity Interior" width={1920} height={1080} className="object-contain w-80 h-20 md:w-40 md:h-10" />
          </div>

          {/* ══════════════════════════════════════════════════════════════
              STEP: login
          ══════════════════════════════════════════════════════════════ */}
          {step === "login" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl md:text-left text-center font-heading font-bold text-foreground">Admin <span className="text-primary">Sign In</span></h2>
                <p className="text-sm md:text-left text-center text-muted-foreground mt-1">Enter your credentials to access the admin panel.</p>
              </div>

              <div className={`bg-background border border-border rounded-2xl p-8 shadow-sm ${shake ? "animate-[shake_0.5s_ease-in-out]" : ""}`}>
                <form onSubmit={handleLogin} className="space-y-5" noValidate>
                  {error && <Alert msg={error} />}

                  {/* Email */}
                  <Field label="Email Address" htmlFor="l-email">
                    <IconInput icon={<Mail size={15} />}>
                      <input id="l-email" type="email" autoComplete="email" required
                        value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }}
                        placeholder="admin@brightocity.com"
                        className={`${inp} pl-9 pr-4`} />
                    </IconInput>
                  </Field>

                  {/* Password */}
                  <Field label="Password" htmlFor="l-pw">
                    <IconInput icon={<Lock size={15} />} right={
                      <TogglePw show={showPw} onToggle={() => setShowPw((v) => !v)} />
                    }>
                      <input id="l-pw" type={showPw ? "text" : "password"} autoComplete="current-password" required
                        value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
                        placeholder="Enter your password"
                        className={`${inp} pl-9 pr-10`} />
                    </IconInput>
                  </Field>

                  {/* Forgot link */}
                  <div className="flex justify-end -mt-2">
                    <button type="button"
                      onClick={() => { setFpEmail(""); setError(""); setStep("forgot-email"); }}
                      className="text-xs text-primary hover:underline">
                      Forgot password?
                    </button>
                  </div>

                  <SubmitBtn loading={loading} label="Sign In" loadingLabel="Signing in…" />
                </form>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                This area is restricted to authorised administrators only.
              </p>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              STEP: forgot-email  (enter registered email)
          ══════════════════════════════════════════════════════════════ */}
          {step === "forgot-email" && (
            <div className="space-y-6">
              <BackBtn to="login" label="Back to Sign In" />
              <div>
                <h2 className="text-2xl font-heading font-bold text-foreground">Reset Password</h2>
                <p className="text-sm text-muted-foreground mt-1">Enter your admin email address and we'll send you an OTP.</p>
              </div>

              <div className={`bg-background border border-border rounded-2xl p-8 shadow-sm ${shake ? "animate-[shake_0.5s_ease-in-out]" : ""}`}>
                <StepDots current={1} />
                <form onSubmit={handleForgotEmail} className="space-y-5" noValidate>
                  {error && <Alert msg={error} />}

                  <Field label="Registered Email Address" htmlFor="fp-email">
                    <IconInput icon={<Mail size={15} />}>
                      <input id="fp-email" type="email" autoComplete="email" required
                        value={fpEmail} onChange={(e) => { setFpEmail(e.target.value); setError(""); }}
                        placeholder="admin@brightocity.com"
                        className={`${inp} pl-9 pr-4`} />
                    </IconInput>
                  </Field>

                  <SubmitBtn loading={loading} label="Send OTP" loadingLabel="Sending…" />
                </form>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              STEP: forgot-otp  (enter 6-digit OTP)
          ══════════════════════════════════════════════════════════════ */}
          {step === "forgot-otp" && (
            <div className="space-y-6">
              <BackBtn to="forgot-email" label="Change email" />
              <div>
                <h2 className="text-2xl font-heading font-bold text-foreground">Enter OTP</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  A 6-digit code was sent to{" "}
                  <span className="font-medium text-foreground">{fpEmail}</span>.
                  {/* DEV hint – remove in production */}
                  <span className="ml-1 text-primary font-medium">(Check browser console for the code)</span>
                </p>
              </div>

              <div className="bg-background border border-border rounded-2xl p-8 shadow-sm">
                <StepDots current={2} />
                <form onSubmit={handleVerifyOtp} className="space-y-6" noValidate>

                  {/* OTP boxes */}
                  <div className="flex items-center justify-center gap-2.5" onPaste={handleOtpPaste}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className={`w-11 h-13 text-center text-lg font-bold rounded-xl border-2 bg-background text-foreground
                          focus:outline-none transition-all duration-150
                          ${otpSuccess
                            ? "border-green-500 bg-green-50 text-green-700"
                            : otpError
                              ? "border-destructive"
                              : digit
                                ? "border-primary bg-primary/5"
                                : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
                          }`}
                        style={{ height: "3.25rem" }}
                        aria-label={`OTP digit ${i + 1}`}
                      />
                    ))}
                  </div>

                  {/* OTP feedback */}
                  {otpError && (
                    <p className="flex items-center gap-1.5 text-sm text-destructive justify-center">
                      <AlertCircle size={14} /> {otpError}
                    </p>
                  )}
                  {otpSuccess && (
                    <p className="flex items-center gap-1.5 text-sm text-green-600 justify-center">
                      <CheckCircle2 size={14} /> OTP verified!
                    </p>
                  )}

                  <SubmitBtn
                    loading={loading}
                    label="Verify OTP"
                    loadingLabel="Verifying…"
                    disabled={otp.join("").length < OTP_LEN}
                  />

                  {/* Resend */}
                  <div className="flex items-center justify-center gap-1.5 text-sm">
                    <span className="text-muted-foreground">Didn't receive it?</span>
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendTimer > 0}
                      className={`flex items-center gap-1 font-medium transition-colors ${resendTimer > 0
                        ? "text-muted-foreground cursor-not-allowed"
                        : "text-primary hover:underline"
                        }`}
                    >
                      <RefreshCw size={13} className={resendTimer > 0 ? "" : "animate-none"} />
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              STEP: forgot-newpw  (set new password)
          ══════════════════════════════════════════════════════════════ */}
          {step === "forgot-newpw" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-heading font-bold text-foreground">Set New Password</h2>
                <p className="text-sm text-muted-foreground mt-1">Choose a strong new password for your admin account.</p>
              </div>

              <div className="bg-background border border-border rounded-2xl p-8 shadow-sm">
                <StepDots current={3} />
                <form onSubmit={handleSetPassword} className="space-y-5" noValidate>
                  {pwError && <Alert msg={pwError} />}

                  <Field label="New Password" htmlFor="np-pw">
                    <IconInput icon={<Lock size={15} />} right={
                      <TogglePw show={showNewPw} onToggle={() => setShowNewPw((v) => !v)} />
                    }>
                      <input id="np-pw" type={showNewPw ? "text" : "password"} required
                        value={newPw}
                        onChange={(e) => { setNewPw(e.target.value); setPwError(""); }}
                        placeholder="Minimum 6 characters"
                        className={`${inp} pl-9 pr-10`} />
                    </IconInput>
                    {/* Strength bar */}
                    {newPw.length > 0 && <StrengthBar pw={newPw} />}
                  </Field>

                  <Field label="Confirm New Password" htmlFor="np-confirm">
                    <IconInput icon={<Lock size={15} />} right={
                      <TogglePw show={showConfirmPw} onToggle={() => setShowConfirmPw((v) => !v)} />
                    }>
                      <input id="np-confirm" type={showConfirmPw ? "text" : "password"} required
                        value={confirmPw}
                        onChange={(e) => { setConfirmPw(e.target.value); setPwError(""); }}
                        placeholder="Re-enter new password"
                        className={`${inp} pl-9 pr-10`} />
                    </IconInput>
                  </Field>

                  <SubmitBtn loading={loading} label="Update Password" loadingLabel="Updating…" />
                </form>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              STEP: forgot-done  (success)
          ══════════════════════════════════════════════════════════════ */}
          {step === "forgot-done" && (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-green-100 border-4 border-green-200 flex items-center justify-center">
                  <ShieldCheck size={36} className="text-green-600" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-heading font-bold text-foreground">Password Updated!</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Your admin password has been reset successfully. You can now sign in with your new password.
                </p>
              </div>
              <button
                onClick={() => {
                  setStep("login");
                  setEmail(fpEmail);
                  setPassword("");
                  setFpEmail("");
                }}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
              >
                Back to Sign In
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Shake keyframe */}
      <style jsx global>{`
        @keyframes shake {
          0%,100%{ transform:translateX(0) }
          15%    { transform:translateX(-6px) }
          30%    { transform:translateX(6px) }
          45%    { transform:translateX(-5px) }
          60%    { transform:translateX(5px) }
          75%    { transform:translateX(-3px) }
          90%    { transform:translateX(3px) }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Small sub-components
// ─────────────────────────────────────────────────────────────────────────────

function Alert({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-destructive/8 border border-destructive/20 text-destructive text-sm">
      <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
      <span>{msg}</span>
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

function IconInput({
  icon, right, children,
}: { icon: React.ReactNode; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">{icon}</span>
      {children}
      {right && <span className="absolute right-3 top-1/2 -translate-y-1/2">{right}</span>}
    </div>
  );
}

function TogglePw({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      className="text-muted-foreground hover:text-foreground transition-colors"
      aria-label={show ? "Hide password" : "Show password"}>
      {show ? <EyeOff size={15} /> : <Eye size={15} />}
    </button>
  );
}

function SubmitBtn({
  loading, label, loadingLabel, disabled = false,
}: { loading: boolean; label: string; loadingLabel: string; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
    >
      {loading ? <><Loader2 size={15} className="animate-spin" />{loadingLabel}</> : label}
    </button>
  );
}

function StrengthBar({ pw }: { pw: string }) {
  const score =
    (pw.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(pw) ? 1 : 0) +
    (/[0-9]/.test(pw) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(pw) ? 1 : 0);

  const labels = ["Too short", "Weak", "Fair", "Good", "Strong"];
  const colors = ["bg-destructive", "bg-orange-400", "bg-yellow-400", "bg-blue-500", "bg-green-500"];

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? colors[score] : "bg-border"}`} />
        ))}
      </div>
      <p className={`text-xs font-medium ${["text-destructive", "text-orange-500", "text-yellow-600", "text-blue-600", "text-green-600"][score]}`}>
        {labels[score]}
      </p>
    </div>
  );
}
