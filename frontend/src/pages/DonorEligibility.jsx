import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { useAppStore } from '../store/appStore.js';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Heart, ShieldCheck, ShieldAlert, Calendar,
  ChevronLeft, ChevronRight, RefreshCw, CheckCircle2,
  AlertCircle, Info, Scale, Clock, Sparkles, ArrowLeft
} from 'lucide-react';

const QUESTIONS = [
  {
    id: 'age',
    title: 'Age Check',
    question: 'Are you between 18 and 65 years old?',
    description: 'Blood donation is medically safe and gentle on your body when you are between 18 and 65 years of age.',
    icon: Calendar,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200/80',
    expected: 'yes',
    failMessage: 'Donors must be between 18 and 65 years old to ensure a safe, comfortable donation.'
  },
  {
    id: 'weight',
    title: 'Body Weight',
    question: 'Do you weigh at least 50 kg (110 lbs)?',
    description: 'Weighing 50+ kg ensures your body has plenty of blood volume so you stay healthy and recover quickly.',
    icon: Scale,
    color: 'text-blue-600 bg-blue-50 border-blue-200/80',
    expected: 'yes',
    failMessage: 'A minimum weight of 50 kg is required to protect your health during and after donation.'
  },
  {
    id: 'cooldown',
    title: 'Donation Cooldown',
    question: 'Have you donated blood in the last 90 days (3 months)?',
    description: 'Your body needs about 90 days to rest and naturally rebuild its red blood cells and iron levels.',
    icon: Clock,
    color: 'text-amber-600 bg-amber-50 border-amber-200/80',
    expected: 'no',
    failMessage: 'A 90-day rest period is required between donations to keep your hemoglobin strong.'
  },
  {
    id: 'tattoos',
    title: 'Tattoos & Piercings',
    question: 'Have you received a tattoo or body piercing in the last 6 months?',
    description: 'A 6-month wait allows any fresh skin marks to heal completely, keeping both you and blood recipients safe.',
    icon: Info,
    color: 'text-purple-600 bg-purple-50 border-purple-200/80',
    expected: 'no',
    failMessage: 'Please allow 6 months for any new tattoo or piercing to heal before donating.'
  },
  {
    id: 'illness',
    title: 'Current Health',
    question: 'Are you currently feeling well, free from fever, infections, or antibiotics?',
    description: 'To protect your immune system and the patient receiving blood, you should feel 100% healthy on donation day.',
    icon: AlertCircle,
    color: 'text-rose-600 bg-rose-50 border-rose-200/80',
    expected: 'no',
    failMessage: 'You should be completely free of infection and off antibiotics before donating.'
  },
  {
    id: 'pregnancy',
    title: 'Pregnancy & Nursing',
    question: 'If applicable, are you currently pregnant or nursing a baby?',
    description: 'Mothers need all their nourishment and iron for themselves and their little ones, so we recommend waiting.',
    icon: Heart,
    color: 'text-pink-600 bg-pink-50 border-pink-200/80',
    expected: 'no',
    failMessage: 'Blood donation is deferred during pregnancy and nursing for maternal & infant safety.'
  }
];

export default function DonorEligibility() {
  const { user } = useAuthStore();
  const { saveEligibility } = useAppStore();

  const [isAssessing, setIsAssessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [saving, setSaving] = useState(false);

  const calculateAge = (dobString) => {
    if (!dobString) return null;
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const startAssessment = () => {
    const initialAnswers = {};
    const dobValue = user?.dob || user?.dateOfBirth;
    if (dobValue) {
      const age = calculateAge(dobValue);
      if (age !== null) {
        initialAnswers.age = (age >= 18 && age <= 65) ? 'yes' : 'no';
      }
    }
    if (user?.weight) {
      const weight = Number(user.weight);
      initialAnswers.weight = (weight >= 50) ? 'yes' : 'no';
    }
    if (user?.sex && user.sex !== 'female') {
      initialAnswers.pregnancy = 'na';
    }

    setAnswers(initialAnswers);
    setCurrentStep(0);
    setAssessmentResult(null);
    setIsAssessing(true);
  };

  const handleAnswer = (value) => {
    const newAnswers = { ...answers, [QUESTIONS[currentStep].id]: value };
    setAnswers(newAnswers);

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      evaluateEligibility(newAnswers);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const evaluateEligibility = (finalAnswers) => {
    const failedQuestions = [];
    
    QUESTIONS.forEach((q) => {
      const answer = finalAnswers[q.id];
      if (answer && answer !== q.expected) {
        // Special case: pregnancy can be answered as 'n/a' which is fine
        if (q.id === 'pregnancy' && answer === 'na') {
          return;
        }
        failedQuestions.push(q);
      }
    });

    const isEligible = failedQuestions.length === 0;
    setAssessmentResult({
      isEligible,
      failedQuestions
    });

    setIsAssessing(false);

    if (isEligible) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  };

  const handleSaveResult = async () => {
    if (!assessmentResult) return;
    setSaving(true);
    const status = assessmentResult.isEligible ? 'Eligible' : 'Ineligible';
    const res = await saveEligibility(status);
    setSaving(false);
    if (res.success) {
      setIsAssessing(false);
      setAssessmentResult(null);
    }
  };

  const currentQuestion = QUESTIONS[currentStep];
  const StepIcon = currentQuestion?.icon;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Navbar Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all p-4.5 rounded-3xl border /80 shadow-xs text-left">
        <div className="flex items-center gap-3">
          <Link
            to="/donor/dashboard"
            className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 flex items-center justify-center transition-all cursor-pointer shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Donor Portal</span>
              <span className="text-slate-300">•</span>
              <span className="text-[10px] font-bold text-rose-600">Health Check</span>
            </div>
            <h1 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-rose-600" /> Health & Donation Eligibility
            </h1>
          </div>
        </div>

        {/* Quick Status Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200/60 shrink-0">
          <span className="text-xs font-bold text-slate-500">Status:</span>
          <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
            user?.eligibilityStatus === 'Eligible'
              ? 'bg-emerald-100 text-emerald-800'
              : user?.eligibilityStatus === 'Ineligible'
              ? 'bg-rose-100 text-rose-800'
              : 'bg-amber-100 text-amber-800'
          }`}>
            {user?.eligibilityStatus || 'Pending Check'}
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!isAssessing && !assessmentResult ? (
          // Initial Screen: Display Current Status
          <motion.div
            key="status-screen"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="card p-6 md:p-8 text-left space-y-6"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                  user?.eligibilityStatus === 'Eligible'
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    : user?.eligibilityStatus === 'Ineligible'
                    ? 'bg-red-50 text-primary border border-red-100'
                    : 'bg-slate-50 text-slate-500 border border-slate-150'
                }`}>
                  {user?.eligibilityStatus === 'Eligible' ? (
                    <ShieldCheck className="w-8 h-8 animate-heartbeat fill-emerald-500/10" />
                  ) : user?.eligibilityStatus === 'Ineligible' ? (
                    <ShieldAlert className="w-8 h-8" />
                  ) : (
                    <Info className="w-8 h-8" />
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Current Status</span>
                  <h3 className="text-xl font-black text-gray-900 mt-0.5">
                    {user?.eligibilityStatus || 'Pending Check'}
                  </h3>
                  {user?.eligibilityCheckedAt && (
                    <p className="text-xs text-gray-400 mt-0.5 font-medium">
                      Last Checked: {new Date(user.eligibilityCheckedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={startAssessment}
                className="btn-primary w-full md:w-auto px-6"
              >
                <RefreshCw className="w-4 h-4" /> Start Health Check
              </button>
            </div>

            {/* Information Cards based on status */}
            {user?.eligibilityStatus === 'Eligible' ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex gap-3 text-emerald-950 text-xs leading-relaxed">
                  <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-emerald-900 mb-0.5">You are eligible to donate!</span>
                    Your health check is active and valid. Hospitals and requesters in your locality can find you when looking for active donors. Thank you for your willingness to save lives!
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs space-y-1">
                    <span className="font-bold text-gray-800 block">Available for Requests</span>
                    <p className="text-gray-500 leading-normal">Your status is currently set to "Available". Toggle this anytime from your dashboard if your availability changes.</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs space-y-1">
                    <span className="font-bold text-gray-800 block">JeevaPoints Booster</span>
                    <p className="text-gray-500 leading-normal">Donating blood earns you JeevaPoints which unlock special recognition certificates and healthcare benefit badges.</p>
                  </div>
                </div>
              </div>
            ) : user?.eligibilityStatus === 'Ineligible' ? (
              <div className="space-y-4">
                <div className="p-4 bg-red-50/50 border border-red-100 rounded-2xl flex gap-3 text-red-950 text-xs leading-relaxed">
                  <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-red-900 mb-0.5">Donation Deferral Active</span>
                    Based on your last assessment, you are temporarily ineligible to donate. This status helps prevent strain on your health and maintains recipient safety.
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed pl-1">
                  💡 We recommend consulting with a general physician if you have underlying symptoms. You can retake this test at any time when your medical conditions clear or cooldown requirements are satisfied.
                </p>
              </div>
            ) : (
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl text-center space-y-3">
                <Info className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="font-bold text-gray-850 text-sm">No Health Assessment Filed</h4>
                <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                  You haven't completed your donation eligibility questionnaire yet. Completing it validates your profile and lists you as an active helper in regional searches.
                </p>
                <button
                  onClick={startAssessment}
                  className="px-4 py-2 border text-gray-700 bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all hover:bg-slate-50 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Assess Now
                </button>
              </div>
            )}
          </motion.div>
        ) : isAssessing ? (
          // Question Wizard Screen
          <motion.div
            key="wizard-screen"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="card p-6 md:p-8 space-y-6 text-left"
          >
            {/* Step progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                <span>Assessment Progress</span>
                <span className="text-primary font-black">Step {currentStep + 1} of {QUESTIONS.length}</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / QUESTIONS.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <div className="py-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shrink-0 ${currentQuestion.color}`}>
                  <StepIcon className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">{currentQuestion.title}</h4>
                  <h3 className="text-lg font-black text-gray-900 mt-0.5">{currentQuestion.question}</h3>
                </div>
              </div>

              <p className="text-sm text-gray-500 leading-relaxed pl-18">
                {currentQuestion.description}
              </p>

              {/* Age auto-detected message */}
              {currentQuestion.id === 'age' && (user?.dob || user?.dateOfBirth) && (
                <div className="mt-4 ml-0 sm:ml-18 p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-gray-600 flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>
                    Auto-detected from profile: <strong>{calculateAge(user.dob || user.dateOfBirth)} years old</strong> (Born {new Date(user.dob || user.dateOfBirth).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}).
                  </span>
                </div>
              )}

              {/* Weight auto-detected message */}
              {currentQuestion.id === 'weight' && user?.weight && (
                <div className="mt-4 ml-0 sm:ml-18 p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-gray-600 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>
                    Auto-detected from profile: <strong>{user.weight} kg</strong>.
                  </span>
                </div>
              )}

              {/* Pregnancy auto-set message */}
              {currentQuestion.id === 'pregnancy' && user?.sex && user.sex !== 'female' && (
                <div className="mt-4 ml-0 sm:ml-18 p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-gray-600 flex items-center gap-2">
                  <Info className="w-4 h-4 text-pink-500 shrink-0" />
                  <span>
                    Auto-set: <strong>Not Applicable</strong> (Detected sex: {user.sex}).
                  </span>
                </div>
              )}
            </div>

            {/* Answers layout */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 items-stretch">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="py-3 px-5 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              )}

              {/* Special options for pregnancy question */}
              {currentQuestion.id === 'pregnancy' ? (
                <>
                  <button
                    onClick={() => handleAnswer('yes')}
                    className={`flex-1 py-3.5 px-4 font-bold rounded-2xl text-xs transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                      answers.pregnancy === 'yes'
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                        : 'bg-rose-50/70 border border-rose-200/80 hover:bg-rose-100 text-rose-700'
                    }`}
                  >
                    Yes (Currently Pregnant / Nursing)
                  </button>
                  <button
                    onClick={() => handleAnswer('no')}
                    className={`flex-1 py-3.5 px-4 font-bold rounded-2xl text-xs transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                      answers.pregnancy === 'no'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-emerald-50/70 border border-emerald-200/80 hover:bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    No (Not Pregnant / Nursing)
                  </button>
                  <button
                    onClick={() => handleAnswer('na')}
                    className={`flex-1 py-3.5 px-4 font-bold rounded-2xl text-xs transition-all text-center cursor-pointer ${
                      answers.pregnancy === 'na'
                        ? 'bg-slate-800 text-white shadow-md'
                        : 'bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Not Applicable (Male Donor)
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleAnswer('yes')}
                    className={`flex-1 py-3.5 px-4 font-bold rounded-2xl text-xs transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                      answers[currentQuestion.id] === 'yes'
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                        : 'bg-slate-50 border border-slate-200/80 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    {currentQuestion.expected === 'yes' ? '✓ Yes, I meet this' : '⚠️ Yes, applies to me'}
                  </button>
                  <button
                    onClick={() => handleAnswer('no')}
                    className={`flex-1 py-3.5 px-4 font-bold rounded-2xl text-xs transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                      answers[currentQuestion.id] === 'no'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-slate-50 border border-slate-200/80 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    {currentQuestion.expected === 'no' ? '✓ No, does not apply' : '✕ No, I do not'}
                  </button>
                </>
              )}

              {/* Next button to confirm prefilled answer */}
              {answers[currentQuestion.id] && (
                <button
                  onClick={() => {
                    if (currentStep < QUESTIONS.length - 1) {
                      setCurrentStep(currentStep + 1);
                    } else {
                      evaluateEligibility(answers);
                    }
                  }}
                  className="py-3 px-6 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          // Assessment Result Review Screen
          <motion.div
            key="result-screen"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="card p-6 md:p-8 space-y-6 text-left"
          >
            {assessmentResult.isEligible ? (
              // Eligible Result
              <div className="text-center space-y-6 py-4">
                <div className="w-20 h-20 bg-emerald-50 border border-emerald-150 rounded-3xl flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
                  <CheckCircle2 className="w-10 h-10 animate-heartbeat fill-emerald-500/5" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-emerald-600">Congratulations! You are Eligible</h2>
                  <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                    You meet all basic safety guidelines and requirements for blood donation. Thank you for completing this health verification.
                  </p>
                </div>

                <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-2xl max-w-md mx-auto text-[11px] text-emerald-950 text-left leading-normal flex gap-2">
                  <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p>Saving this result sets your profile status to <strong>Eligible</strong> and marks you as available to help searchers. You will be prompted to re-assess only if updates to your health occur.</p>
                </div>
              </div>
            ) : (
              // Ineligible Result
              <div className="space-y-6">
                <div className="text-center space-y-3 py-2">
                  <div className="w-16 h-16 bg-red-50 border border-red-150 rounded-2xl flex items-center justify-center mx-auto text-primary shadow-sm">
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-black text-red-600">Temporary Ineligibility</h2>
                  <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                    Based on your answers, you are currently not cleared for donation. This is to safeguard your health and prevent complications for blood recipients.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Reasons for Deferral</h4>
                  <div className="space-y-2">
                    {assessmentResult.failedQuestions.map((q) => {
                      const Icon = q.icon;
                      return (
                        <div key={q.id} className="p-3 bg-red-50/50 border border-red-100 rounded-xl flex items-start gap-3">
                          <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <div className="text-xs text-red-950">
                            <span className="font-bold block text-red-900">{q.title}</span>
                            {q.failMessage}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] text-gray-500 leading-normal flex gap-2">
                  <Info className="w-4.5 h-4.5 text-gray-400 shrink-0 mt-0.5" />
                  <p>Your safety is our priority. If you save this result, your status will update to <strong>Ineligible</strong>, and you will be temporarily hidden from compatibility searches. You can re-assess anytime your status changes.</p>
                </div>
              </div>
            )}

            {/* Bottom save actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={startAssessment}
                className="flex-1 py-2.5 border border-slate-200 text-gray-700 font-semibold rounded-xl text-xs hover:bg-slate-50 transition-colors text-center cursor-pointer"
                disabled={saving}
              >
                Re-take Assessment
              </button>
              <button
                type="button"
                onClick={handleSaveResult}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs shadow-md transition-colors text-center cursor-pointer"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save & Close'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
