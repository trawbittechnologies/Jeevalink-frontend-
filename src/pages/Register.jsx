import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../store/authStore.js";
import { useAppStore } from "../store/appStore.js";
import { ArrowLeft, UserPlus, Droplets, Shield, Phone, CheckCircle2, Loader2, Heart } from "lucide-react";
import confetti from "canvas-confetti";
import api from "../store/api.js";
import CameraCapture from "../components/CameraCapture.jsx";
import JeevaLinkLogo from "../components/JeevaLinkLogo.jsx";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["male", "female", "transgender"];

function computeAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export default function Register() {
  const [role, setRole] = useState("user"); // 'user' or 'hospital'
  const [step, setStep] = useState(1); // 1=credentials, 2=OTP, 3=personal details
  const [submitting, setSubmitting] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpAttemptsLeft, setOtpAttemptsLeft] = useState(2);
  const [errors, setErrors] = useState({});
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const { register: registerUser, loading } = useAuthStore();
  const { triggerToast } = useAppStore();
  const navigate = useNavigate();

  // Form data state
  const [form, setForm] = useState({
    fullName: "",
    mobileNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    bloodGroup: "",
    dateOfBirth: "",
    gender: "",
    weight: "",
    pincode: "",
    postOffice: "",
    place: "",
    district: "",
    fullAddress: "",
    idProofFront: null,
    idProofBack: null,
    profilePicture: null,
  });

  const idFrontRef = useRef();
  const idBackRef = useRef();

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const clearError = (key) => setErrors((e) => { const n = { ...e }; delete n[key]; return n; });

  // ── Validation ───────────────────────────────────────────────────────
  const validateStep1 = () => {
    const errs = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 2) errs.fullName = "Minimum 2 characters";
    if (!/^[6-9]\d{9}$/.test(form.mobileNumber)) errs.mobileNumber = "Valid 10-digit Indian mobile required";
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Valid email required";
    if (!form.password || form.password.length < 6) errs.password = "Minimum 6 characters";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = () => {
    const errs = {};
    if (role === "user") {
      if (!form.bloodGroup) errs.bloodGroup = "Blood group is required";
      if (!form.dateOfBirth) {
        errs.dateOfBirth = "Date of birth is required";
      } else {
        const age = computeAge(form.dateOfBirth);
        if (age === null || age < 18) errs.dateOfBirth = "You must be at least 18 years old to register as a blood donor";
      }
      if (!form.gender) errs.gender = "Gender is required";
      if (!form.idProofFront) errs.idProofFront = "ID Proof front image is required";
      if (!form.idProofBack) errs.idProofBack = "ID Proof back image is required";
      if (!form.profilePicture) errs.profilePicture = "Profile photo is required";
    }
    if (!form.pincode || form.pincode.length !== 6) errs.pincode = "Valid 6-digit PIN code required";
    if (!form.district) errs.district = "District is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── OTP Flow ─────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!validateStep1()) return;
    setOtpSending(true);
    try {
      const res = await api.post("/otp/send", { mobile: form.mobileNumber });
      if (res.data.success) {
        setOtpAttemptsLeft(res.data.attempts_left ?? 1);
        setStep(2);
        triggerToast(`OTP sent to +91 ${form.mobileNumber}`, "success");
      } else {
        triggerToast(res.data.message || "Failed to send OTP", "error");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "OTP send failed. Try again.";
      triggerToast(msg, "error");
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setErrors({ otp: "Enter the 6-digit OTP" });
      return;
    }
    setOtpVerifying(true);
    try {
      const res = await api.post("/otp/verify", { mobile: form.mobileNumber, otp: otpCode });
      if (res.data.success) {
        setOtpVerified(true);
        clearError("otp");
        triggerToast("Mobile number verified! ✅", "success");
        setTimeout(() => setStep(3), 600);
      } else {
        setErrors({ otp: res.data.message || "Invalid OTP" });
      }
    } catch (err) {
      setErrors({ otp: err.response?.data?.message || "Verification failed" });
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpAttemptsLeft <= 0) {
      triggerToast("Maximum OTP requests reached. Please wait 10 minutes.", "error");
      return;
    }
    await handleSendOtp();
  };

  // ── Pincode Lookup ───────────────────────────────────────────────────
  const onPincodeBlur = async (e) => {
    const pin = e.target.value;
    if (pin.length === 6) {
      setPincodeLoading(true);
      try {
        const res = await api.get(`/location/pincode/${pin}`);
        if (res.data.success) {
          setField("district", res.data.district);
          if (!form.place) setField("place", res.data.district);
        }
      } catch (err) {
        console.warn("Pincode lookup failed:", err);
      } finally {
        setPincodeLoading(false);
      }
    }
  };

  // ── Final Submit ─────────────────────────────────────────────────────
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep3()) return;
    setSubmitting(true);
    const finalData = {
      full_name:    form.fullName,
      mobile:       form.mobileNumber,
      email:        form.email,
      password:     form.password,
      role,
      blood_group:  form.bloodGroup || null,
      dob:          form.dateOfBirth || null,
      sex:          form.gender || null,
      weight:       form.weight || null,
      pincode:      form.pincode,
      post_office:  form.postOffice || null,
      place:        form.place || null,
      district:     form.district,
      full_address: form.fullAddress || null,
      id_proof_front:  form.idProofFront,
      id_proof_back:   form.idProofBack,
      profile_picture: form.profilePicture,
    };
    const res = await registerUser(finalData);
    setSubmitting(false);
    if (res.success) {
      if (role === "hospital") {
        triggerToast("Registration submitted! Awaiting administrator approval.", "success");
        navigate("/hospital/dashboard");
      } else {
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 }, colors: ["#DC2626", "#B91C1C", "#ffffff"] });
        triggerToast("Welcome to JeevaLink! 🎉", "success");
        navigate("/donor/dashboard");
      }
    } else {
      triggerToast(res.message || "Registration failed. Try again.", "error");
    }
  };

  // ── Shared input class ───────────────────────────────────────────────
  const inputCls = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition";
  const errCls   = "text-[10px] text-red-500 font-bold mt-1 pl-1 block";

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 hero-gradient flex-col justify-center px-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="mb-12">
            <JeevaLinkLogo size={44} textClassName="text-2xl" light={true} />
          </div>
          <h1 className="text-4xl font-black text-white mb-5">
            Join 12,000+<br />
            <span className="inline-flex items-center gap-2">Lifesavers <Heart className="w-8 h-8 fill-current text-red-200 inline-block" /></span>
          </h1>
          <p className="text-red-200 text-lg leading-relaxed mb-8">
            Register and become part of Kerala's largest DYFI blood donation network. Free, fast, and forever.
          </p>
          {/* Steps indicator */}
          <div className="space-y-3">
            {[
              { n: 1, label: "Create Account", done: step > 1 },
              { n: 2, label: "Verify Mobile (OTP)", done: otpVerified },
              { n: 3, label: "Personal Details", done: false },
            ].map(({ n, label, done }) => (
              <div key={n} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${step >= n ? "bg-white text-red-600 border-white" : "bg-white/10 text-white/50 border-white/20"}`}>
                  {done ? "✓" : n}
                </div>
                <span className={`text-sm font-semibold ${step >= n ? "text-white" : "text-white/40"}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">

            {/* ─── STEP 1 — Account Credentials ─── */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
                <div className="mb-8">
                  <h2 className="text-3xl font-black text-gray-900 mb-1">Create Account</h2>
                  <p className="text-gray-500 text-sm">Step 1 of 3 — Choose your role and set credentials</p>
                </div>

                {/* Role selector */}
                <div className="flex gap-3 mb-6">
                  {[
                    { val: "user",     label: "Blood Donor" },
                    { val: "hospital", label: "Hospital / Org" },
                  ].map(({ val, label }) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRole(val)}
                      className={`flex-1 py-3 px-4 rounded-2xl text-sm font-bold border-2 transition-all ${role === val ? "border-red-500 bg-red-50 text-red-700" : "border-slate-200 bg-white text-gray-500 hover:border-red-200"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <div>
                    <input
                      className={inputCls}
                      placeholder="Full Name"
                      value={form.fullName}
                      onChange={(e) => { setField("fullName", e.target.value); clearError("fullName"); }}
                    />
                    {errors.fullName && <span className={errCls}>{errors.fullName}</span>}
                  </div>
                  <div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-semibold">+91</span>
                      <input
                        className={inputCls + " pl-12"}
                        placeholder="Mobile Number"
                        maxLength={10}
                        value={form.mobileNumber}
                        onChange={(e) => { setField("mobileNumber", e.target.value.replace(/\D/g, "")); clearError("mobileNumber"); }}
                      />
                    </div>
                    {errors.mobileNumber && <span className={errCls}>{errors.mobileNumber}</span>}
                  </div>
                  <div>
                    <input
                      className={inputCls}
                      type="email"
                      placeholder="Email Address"
                      value={form.email}
                      onChange={(e) => { setField("email", e.target.value); clearError("email"); }}
                    />
                    {errors.email && <span className={errCls}>{errors.email}</span>}
                  </div>
                  <div>
                    <input
                      className={inputCls}
                      type="password"
                      placeholder="Password (min 6 chars)"
                      value={form.password}
                      onChange={(e) => { setField("password", e.target.value); clearError("password"); }}
                    />
                    {errors.password && <span className={errCls}>{errors.password}</span>}
                  </div>
                  <div>
                    <input
                      className={inputCls}
                      type="password"
                      placeholder="Confirm Password"
                      value={form.confirmPassword}
                      onChange={(e) => { setField("confirmPassword", e.target.value); clearError("confirmPassword"); }}
                    />
                    {errors.confirmPassword && <span className={errCls}>{errors.confirmPassword}</span>}
                  </div>

                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpSending}
                    className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-500 text-white font-bold rounded-2xl shadow-lg shadow-red-200 flex items-center justify-center gap-2 hover:from-red-700 hover:to-rose-600 transition-all disabled:opacity-60"
                  >
                    {otpSending ? <><Loader2 className="w-4 h-4 animate-spin" />Sending OTP…</> : <><Phone className="w-4 h-4" />Continue — Verify Mobile</>}
                  </button>

                  <p className="text-center text-sm text-gray-500">
                    Already have an account?{" "}
                    <Link to="/login" className="text-red-600 font-bold hover:underline">Sign In</Link>
                  </p>
                </div>
              </motion.div>
            )}

            {/* ─── STEP 2 — OTP Verification ─── */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
                <div className="mb-8 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {otpVerified
                      ? <CheckCircle2 className="w-8 h-8 text-green-500" />
                      : <Shield className="w-8 h-8 text-red-500" />}
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 mb-1">Verify Mobile</h2>
                  <p className="text-gray-500 text-sm">
                    Step 2 of 3 — Enter the 6-digit OTP sent to<br />
                    <strong className="text-gray-800">+91 {form.mobileNumber}</strong>
                  </p>
                  <p className="text-xs text-amber-600 mt-1">⏱ OTP is valid for 1 minute only</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <input
                      className={inputCls + " text-center text-2xl font-bold tracking-[0.5em]"}
                      placeholder="------"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, "")); clearError("otp"); }}
                    />
                    {errors.otp && <span className={errCls + " text-center block"}>{errors.otp}</span>}
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={otpVerifying || otpVerified}
                    className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:from-red-700 hover:to-rose-600 transition-all disabled:opacity-60"
                  >
                    {otpVerifying
                      ? <><Loader2 className="w-4 h-4 animate-spin" />Verifying…</>
                      : otpVerified
                        ? <><CheckCircle2 className="w-4 h-4" />Verified! Proceeding…</>
                        : "Verify OTP"}
                  </button>

                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3 h-3" /> Back
                    </button>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={otpSending || otpAttemptsLeft <= 0}
                      className="text-red-600 font-bold hover:underline disabled:opacity-40"
                    >
                      {otpSending ? "Sending…" : `Resend OTP (${otpAttemptsLeft} left)`}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── STEP 3 — Personal Details ─── */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <button type="button" onClick={() => setStep(2)} className="text-gray-400 hover:text-gray-600">
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <h2 className="text-3xl font-black text-gray-900">Personal Details</h2>
                  </div>
                  <p className="text-gray-500 text-sm pl-6">Step 3 of 3 — Tell us about yourself</p>
                </div>

                <form onSubmit={handleFinalSubmit} className="space-y-4">
                  {role === "user" && (
                    <>
                      {/* Blood Group */}
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Blood Group *</label>
                        <div className="grid grid-cols-4 gap-2">
                          {BLOOD_GROUPS.map((bg) => (
                            <button
                              key={bg}
                              type="button"
                              onClick={() => { setField("bloodGroup", bg); clearError("bloodGroup"); }}
                              className={`py-2 rounded-xl text-sm font-bold border-2 transition-all ${form.bloodGroup === bg ? "border-red-500 bg-red-50 text-red-700" : "border-slate-200 text-gray-500 hover:border-red-200"}`}
                            >
                              {bg}
                            </button>
                          ))}
                        </div>
                        {errors.bloodGroup && <span className={errCls}>{errors.bloodGroup}</span>}
                      </div>

                      {/* Date of Birth */}
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Date of Birth * (must be 18+)</label>
                        <input
                          type="date"
                          className={inputCls}
                          max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]}
                          value={form.dateOfBirth}
                          onChange={(e) => { setField("dateOfBirth", e.target.value); clearError("dateOfBirth"); }}
                        />
                        {errors.dateOfBirth && <span className={errCls}>{errors.dateOfBirth}</span>}
                      </div>

                      {/* Gender */}
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Gender *</label>
                        <div className="grid grid-cols-3 gap-2">
                          {GENDERS.map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => { setField("gender", g); clearError("gender"); }}
                              className={`py-2 rounded-xl text-xs font-bold border-2 capitalize transition-all ${form.gender === g ? "border-red-500 bg-red-50 text-red-700" : "border-slate-200 text-gray-500 hover:border-red-200"}`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                        {errors.gender && <span className={errCls}>{errors.gender}</span>}
                      </div>

                      {/* Weight */}
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Weight (kg) — optional</label>
                        <input
                          type="number"
                          className={inputCls}
                          placeholder="e.g. 65"
                          min={30}
                          max={250}
                          value={form.weight}
                          onChange={(e) => setField("weight", e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {/* PIN Code */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">PIN Code *</label>
                    <div className="relative">
                      <input
                        className={inputCls}
                        placeholder="6-digit PIN Code"
                        maxLength={6}
                        value={form.pincode}
                        onChange={(e) => { setField("pincode", e.target.value.replace(/\D/g, "")); clearError("pincode"); }}
                        onBlur={onPincodeBlur}
                      />
                      {pincodeLoading && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                        </div>
                      )}
                    </div>
                    {errors.pincode && <span className={errCls}>{errors.pincode}</span>}
                  </div>

                  {/* Post Office */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Post Office — optional</label>
                    <input
                      className={inputCls}
                      placeholder="e.g. Palakkad HO"
                      value={form.postOffice}
                      onChange={(e) => setField("postOffice", e.target.value)}
                    />
                  </div>

                  {/* Place */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Place / Town — optional</label>
                    <input
                      className={inputCls}
                      placeholder="e.g. Ottapalam"
                      value={form.place}
                      onChange={(e) => setField("place", e.target.value)}
                    />
                  </div>

                  {/* District — auto-filled */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">District *</label>
                    <input
                      className={inputCls}
                      placeholder="District (auto-filled from PIN)"
                      value={form.district}
                      onChange={(e) => { setField("district", e.target.value); clearError("district"); }}
                    />
                    {errors.district && <span className={errCls}>{errors.district}</span>}
                  </div>

                  {/* Full Address */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Full Address — optional</label>
                    <textarea
                      className={inputCls + " resize-none"}
                      rows={2}
                      placeholder="House no, Street, Landmark…"
                      value={form.fullAddress}
                      onChange={(e) => setField("fullAddress", e.target.value)}
                    />
                  </div>

                  {role === "user" && (
                    <>
                      {/* ID Proof Front */}
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1.5">ID Proof — Front *</label>
                        <input
                          ref={idFrontRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => { setField("idProofFront", e.target.files[0]); clearError("idProofFront"); }}
                        />
                        <button
                          type="button"
                          onClick={() => idFrontRef.current.click()}
                          className={`w-full py-3 rounded-2xl border-2 border-dashed text-sm font-semibold transition-all ${form.idProofFront ? "border-green-400 bg-green-50 text-green-700" : "border-slate-300 text-gray-400 hover:border-red-400"}`}
                        >
                          {form.idProofFront ? `✓ ${form.idProofFront.name}` : "📷 Upload ID Front"}
                        </button>
                        {errors.idProofFront && <span className={errCls}>{errors.idProofFront}</span>}
                      </div>

                      {/* ID Proof Back */}
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1.5">ID Proof — Back *</label>
                        <input
                          ref={idBackRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => { setField("idProofBack", e.target.files[0]); clearError("idProofBack"); }}
                        />
                        <button
                          type="button"
                          onClick={() => idBackRef.current.click()}
                          className={`w-full py-3 rounded-2xl border-2 border-dashed text-sm font-semibold transition-all ${form.idProofBack ? "border-green-400 bg-green-50 text-green-700" : "border-slate-300 text-gray-400 hover:border-red-400"}`}
                        >
                          {form.idProofBack ? `✓ ${form.idProofBack.name}` : "📷 Upload ID Back"}
                        </button>
                        {errors.idProofBack && <span className={errCls}>{errors.idProofBack}</span>}
                      </div>

                      {/* Profile Photo */}
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Profile Photo (Selfie) *</label>
                        <CameraCapture
                          onCapture={(file) => { setField("profilePicture", file); clearError("profilePicture"); }}
                        />
                        {errors.profilePicture && <span className={errCls}>{errors.profilePicture}</span>}
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || loading}
                    className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-500 text-white font-bold rounded-2xl shadow-lg shadow-red-200 flex items-center justify-center gap-2 hover:from-red-700 hover:to-rose-600 transition-all disabled:opacity-60"
                  >
                    {submitting || loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" />Registering…</>
                      : <><UserPlus className="w-4 h-4" />Complete Registration</>}
                  </button>
                </form>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
