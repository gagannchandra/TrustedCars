import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth, type UserRole } from "../context/AuthContext";
import { CITIES } from "../data/cities";

export default function AuthPage() {
  const [params] = useSearchParams();
  const redirect = params.get("redirect") || "/";
  const initialMode = (params.get("mode") as "login" | "register") || "login";
  
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [authMethod, setAuthMethod] = useState<"password" | "otp">("password");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  
  const { login, loginWithOTP, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    role: "buyer" as UserRole,
    otp: "",
    city: "Mumbai",
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirect);
    }
  }, [isAuthenticated, navigate, redirect]);

  useEffect(() => {
    if (otpTimer > 0) {
      const t = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [otpTimer]);

  const validatePhone = (phone: string) => {
    const clean = phone.replace(/\D/g, "");
    return clean.length === 10 || (clean.length === 12 && clean.startsWith("91"));
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 10);
    if (cleaned.length >= 5) {
      return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return cleaned;
  };

  const handleSendOTP = async () => {
    if (!validatePhone(formData.phone)) {
      setErrors({ phone: "Please enter a valid 10-digit phone number" });
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 600));
    setOtpSent(true);
    setStep("otp");
    setOtpTimer(30);
    setIsSubmitting(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError("");

    if (!validatePhone(formData.phone)) {
      setErrors({ phone: "Please enter a valid 10-digit phone number" });
      return;
    }

    if (authMethod === "password") {
      if (!formData.password) {
        setErrors({ password: "Password is required" });
        return;
      }
      setIsSubmitting(true);
      const result = await login(formData.phone, formData.password);
      setIsSubmitting(false);
      if (result.success) {
        navigate(redirect);
      } else {
        setGlobalError(result.error || "Login failed");
      }
    } else {
      handleSendOTP();
    }
  };

  const handleOTPVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError("");
    
    if (formData.otp.length !== 6) {
      setErrors({ otp: "Please enter the 6-digit OTP" });
      return;
    }

    setIsSubmitting(true);
    const result = await loginWithOTP(formData.phone, formData.otp);
    setIsSubmitting(false);
    
    if (result.success) {
      navigate(redirect);
    } else {
      setGlobalError(result.error || "Invalid OTP");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError("");

    const newErrors: Record<string, string> = {};
    
    if (formData.name.length < 2) newErrors.name = "Please enter your full name";
    if (!validatePhone(formData.phone)) newErrors.phone = "Please enter a valid 10-digit phone number";
    if (!formData.email.includes("@")) newErrors.email = "Please enter a valid email address";
    if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    const result = await register({
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      city: formData.city,
    });
    setIsSubmitting(false);

    if (result.success) {
      navigate(redirect);
    } else {
      setGlobalError(result.error || "Registration failed");
    }
  };

  return (
    <div className="grid min-h-[calc(100vh-9rem)] lg:grid-cols-2">
      {/* Left side - form */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to home
          </Link>

          {globalError && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              {globalError}
            </div>
          )}

          {mode === "login" && step === "form" && (
            <>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h1>
              <p className="mt-1 text-slate-600">Sign in to access your saved cars, enquiries, and inspections.</p>
              
              <form onSubmit={handleLogin} className="mt-8 space-y-4">
                <div className="flex gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => setAuthMethod("password")}
                    className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
                      authMethod === "password" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
                    }`}
                  >
                    Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMethod("otp")}
                    className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
                      authMethod === "otp" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
                    }`}
                  >
                    OTP
                  </button>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Phone Number</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">+91</span>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                      placeholder="98765 43210"
                      className={`tc-input pl-12 ${errors.phone ? "border-red-300 bg-red-50" : ""}`}
                    />
                  </div>
                  {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
                </div>

                {authMethod === "password" && (
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-700">Password</label>
                      <button type="button" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                        Forgot?
                      </button>
                    </div>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter your password"
                      className={`tc-input ${errors.password ? "border-red-300 bg-red-50" : ""}`}
                    />
                    {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="tc-btn tc-btn-dark h-12 w-full text-base"
                >
                  {isSubmitting ? <Spinner /> : authMethod === "password" ? "Sign in" : "Send OTP"}
                </button>
              </form>

              <div className="my-6 flex items-center gap-3 text-xs text-slate-500">
                <div className="h-px flex-1 bg-slate-200" />
                OR CONTINUE WITH
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <SocialButton provider="google" />
                <SocialButton provider="apple" />
                <SocialButton provider="facebook" />
              </div>

              <p className="mt-6 text-center text-sm text-slate-600">
                New to TrustedCars?{" "}
                <button onClick={() => setMode("register")} className="font-semibold text-brand-600 hover:text-brand-700">
                  Create an account
                </button>
              </p>

              <DemoCredentials />
            </>
          )}

          {mode === "login" && step === "otp" && (
            <>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Verify OTP</h1>
              <p className="mt-1 text-slate-600">Enter the 6-digit code we sent to your phone.</p>
              
              <form onSubmit={handleOTPVerify} className="mt-8 space-y-5">
                <div className="rounded-lg border border-brand-200 bg-brand-50 p-3 text-center">
                  <p className="text-xs text-brand-700">OTP sent to</p>
                  <p className="font-semibold text-brand-900">+91 {formData.phone}</p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">One-time password</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={formData.otp}
                    onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, "") })}
                    placeholder="123456"
                    className={`tc-input text-center font-mono text-2xl tracking-[0.5em] ${errors.otp ? "border-red-300 bg-red-50" : ""}`}
                    autoFocus
                  />
                  {errors.otp && <p className="mt-1 text-xs text-red-600">{errors.otp}</p>}
                </div>

                <button type="submit" disabled={isSubmitting} className="tc-btn tc-btn-dark h-12 w-full text-base">
                  {isSubmitting ? <Spinner /> : "Verify & Sign in"}
                </button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => setStep("form")}
                    className="text-slate-600 hover:text-slate-900"
                  >
                    ← Change number
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (otpTimer === 0) {
                        setOtpTimer(30);
                      }
                    }}
                    disabled={otpTimer > 0}
                    className={`font-semibold ${otpTimer > 0 ? "text-slate-400" : "text-brand-600 hover:text-brand-700"}`}
                  >
                    {otpTimer > 0 ? `Resend in ${otpTimer}s` : "Resend OTP"}
                  </button>
                </div>
              </form>
            </>
          )}

          {mode === "register" && (
            <>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create your account</h1>
              <p className="mt-1 text-slate-600">Join 42,000+ car buyers and sellers across India.</p>
              
              <form onSubmit={handleRegister} className="mt-8 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Full name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your full name"
                    className={`tc-input ${errors.name ? "border-red-300 bg-red-50" : ""}`}
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Phone number</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">+91</span>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                      placeholder="98765 43210"
                      className={`tc-input pl-12 ${errors.phone ? "border-red-300 bg-red-50" : ""}`}
                    />
                  </div>
                  {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Email address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="you@example.com"
                    className={`tc-input ${errors.email ? "border-red-300 bg-red-50" : ""}`}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimum 6 characters"
                    className={`tc-input ${errors.password ? "border-red-300 bg-red-50" : ""}`}
                  />
                  {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">City</label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="tc-input"
                  >
                    {CITIES.filter((c) => c.active).map((c) => (
                      <option key={c.slug} value={c.name}>{c.name}, {c.state}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">I want to</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "buyer" as UserRole, label: "Buy a car", desc: "Browse & purchase" },
                      { value: "seller" as UserRole, label: "Sell my car", desc: "List & get offers" },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                          formData.role === opt.value ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={opt.value}
                          checked={formData.role === opt.value}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                          className="sr-only"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-slate-900">{opt.label}</div>
                          <div className="text-xs text-slate-500">{opt.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="tc-btn tc-btn-dark h-12 w-full text-base">
                  {isSubmitting ? <Spinner /> : "Create account"}
                </button>

                <p className="text-xs text-slate-500">
                  By signing up, you agree to our{" "}
                  <a href="#" className="text-brand-600 hover:underline">Terms</a> and{" "}
                  <a href="#" className="text-brand-600 hover:underline">Privacy Policy</a>
                </p>
              </form>

              <p className="mt-6 text-center text-sm text-slate-600">
                Already have an account?{" "}
                <button onClick={() => setMode("login")} className="font-semibold text-brand-600 hover:text-brand-700">
                  Sign in
                </button>
              </p>
            </>
          )}
        </div>
      </div>

      {/* Right side - branding */}
      <div className="relative hidden overflow-hidden bg-brand-500 lg:block">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, white 0%, transparent 30%), radial-gradient(circle at 80% 70%, white 0%, transparent 30%)`
        }} />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 13l1.5-4.5A2 2 0 016.4 7h11.2a2 2 0 011.9 1.5L21 13v5a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H6v1a1 1 0 01-1 1H4a1 1 0 01-1-1v-5z" />
                <circle cx="7.5" cy="15.5" r="1.2" fill="currentColor" />
                <circle cx="16.5" cy="15.5" r="1.2" fill="currentColor" />
              </svg>
            </div>
            <h2 className="mt-8 text-4xl font-bold leading-tight">
              The most trusted way to buy and sell pre-owned cars.
            </h2>
            <p className="mt-4 text-lg text-white/90">
              Every car is 200-point inspected, comes with warranty, and has a 7-day money-back guarantee.
            </p>
          </div>

          <div className="space-y-5">
            {[
              { stat: "48,200+", label: "Cars sold" },
              { stat: "42,000+", label: "Verified customers" },
              { stat: "200-point", label: "Inspection on every car" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 border-t border-white/20 pt-4">
                <div className="text-2xl font-bold">{item.stat}</div>
                <div className="text-sm text-white/80">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function SocialButton({ provider }: { provider: "google" | "apple" | "facebook" }) {
  const labels = { google: "Google", apple: "Apple", facebook: "Facebook" };
  return (
    <button
      type="button"
      className="flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
    >
      {provider === "google" && (
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      )}
      {provider === "apple" && (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-2.96 1.8-2.46 5.98.22 7.13-.57 1.5-1.31 2.99-2.27 4.08zm-5.85-15.1c.07-2.04 1.76-3.79 3.75-3.87.29 2.32-1.93 4.48-3.75 3.87z"/>
        </svg>
      )}
      {provider === "facebook" && (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#1877F2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )}
      <span className="hidden sm:inline">{labels[provider]}</span>
    </button>
  );
}

function DemoCredentials() {
  return (
    <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Demo accounts</div>
      <div className="mt-2 space-y-1.5 text-xs text-slate-700">
        <div className="flex justify-between">
          <span><code className="rounded bg-white px-1">98765 43210</code> Buyer</span>
          <span className="text-slate-500">demo1234</span>
        </div>
        <div className="flex justify-between">
          <span><code className="rounded bg-white px-1">98765 43211</code> Seller</span>
          <span className="text-slate-500">demo1234</span>
        </div>
        <div className="flex justify-between">
          <span><code className="rounded bg-white px-1">98765 43212</code> Admin</span>
          <span className="text-slate-500">demo1234</span>
        </div>
        <div className="pt-1 text-[11px] text-slate-500">Or use OTP <code className="rounded bg-white px-1">123456</code></div>
      </div>
    </div>
  );
}
