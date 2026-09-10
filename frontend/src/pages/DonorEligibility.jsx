import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { useAppStore } from '../store/appStore.js';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Heart, ShieldCheck, ShieldAlert, Calendar,
  ChevronLeft, ChevronRight, RefreshCw, CheckCircle2,
  AlertCircle, Info, Scale, Clock, Sparkles, ArrowLeft,
  Languages
} from 'lucide-react';

const TRANSLATIONS = {
  ml: {
    portalBadge: 'ഡോണർ പോർട്ടൽ',
    pageTag: 'ആരോഗ്യ പരിശോധന',
    pageTitle: 'രക്തദാന ആരോഗ്യ യോഗ്യതാ പരിശോധന',
    statusLabel: 'സ്റ്റാറ്റസ്:',
    statusEligible: 'യോഗ്യനാണ്',
    statusIneligible: 'അയോഗ്യനാണ്',
    statusPending: 'പരിശോധിച്ചിട്ടില്ല',
    currentStatus: 'നിലവിലെ അവസ്ഥ',
    lastChecked: 'അവസാനം പരിശോധിച്ചത്',
    startCheck: 'ആരോഗ്യ പരിശോധന ആരംഭിക്കുക',
    retakeCheck: 'വീണ്ടും പരിശോധിക്കുക',
    assessNow: 'ഇപ്പോൾ പരിശോധിക്കുക',
    saveAndClose: 'സേവ് ചെയ്തു പൂർത്തിയാക്കുക',
    saving: 'സേവ് ചെയ്യുന്നു...',
    progress: 'പരിശോധനാ പുരോഗതി',
    step: 'ഘട്ടം',
    of: '/',
    back: 'പിന്നോട്ട്',
    next: 'അടുത്തത്',
    autoDetectedAge: 'പ്രൊഫൈലിൽ നിന്ന് കണ്ടെത്തിയത്:',
    yearsOld: 'വയസ്സ്',
    bornOn: 'ജനനം',
    autoDetectedWeight: 'പ്രൊഫൈലിൽ നിന്ന് കണ്ടെത്തിയത്:',
    autoSetNa: 'നിർദ്ദേശിച്ചത്: ബാധകമല്ല (ലിംഗം:',
    congratsTitle: 'അഭിനന്ദനങ്ങൾ! നിങ്ങൾ രക്തദാനം ചെയ്യാൻ യോഗ്യനാണ്',
    congratsDesc: 'രക്തദാനത്തിനായുള്ള അടിസ്ഥാന ആരോഗ്യ-സുരക്ഷാ മാർഗ്ഗനിർദ്ദേശങ്ങൾ എല്ലാം നിങ്ങൾ പാലിക്കുന്നുണ്ട്. ഈ പരിശോധന പൂർത്തിയാക്കിയതിന് നന്ദി.',
    congratsNote: 'ഈ ഫലം സേവ് ചെയ്യുന്നത് വഴി നിങ്ങളുടെ പ്രൊഫൈൽ യോഗ്യമായി (Eligible) മാറുകയും രക്തം ആവശ്യമുള്ളവർക്ക് നിങ്ങളെ കണ്ടെത്താൻ സാധിക്കുകയും ചെയ്യും.',
    deferralTitle: 'താൽക്കാലിക അയോഗ്യത (രക്തദാനം മാറ്റിവെക്കുക)',
    deferralDesc: 'നിങ്ങൾ നൽകിയ ഉത്തരങ്ങളുടെ അടിസ്ഥാനത്തിൽ ഇപ്പോൾ രക്തദാനം ചെയ്യാൻ സാധിക്കില്ല. ഇത് നിങ്ങളുടെ ആരോഗ്യ സംരക്ഷണത്തിനും രക്തം സ്വീകരിക്കുന്ന രോഗിയുടെ സുരക്ഷയ്ക്കും വേണ്ടിയാണ്.',
    deferralReasons: 'മാറ്റിവെക്കാനുള്ള കാരണങ്ങൾ',
    deferralNote: 'നിങ്ങളുടെ സുരക്ഷയ്ക്കാണ് മുൻഗണന. ഈ ഫലം സേവ് ചെയ്യുമ്പോൾ സ്റ്റാറ്റസ് "Ineligible" ആയി മാറും. ആരോഗ്യസ്ഥിതി മെച്ചപ്പെടുമ്പോൾ എപ്പോൾ വേണമെങ്കിലും ഈ പരിശോധന വീണ്ടും നടത്താവുന്നതാണ്.',
    eligibleBannerTitle: 'നിങ്ങൾ രക്തദാനം ചെയ്യാൻ യോഗ്യനാണ്!',
    eligibleBannerDesc: 'നിങ്ങളുടെ ആരോഗ്യ പരിശോധന സജീവമാണ്. നിങ്ങളുടെ പ്രദേശത്തെ രോഗികൾക്കും ആശുപത്രികൾക്കും രക്തം ആവശ്യമുള്ളപ്പോൾ നിങ്ങളെ ബന്ധപ്പെടാൻ സാധിക്കും. ജീവൻ രക്ഷിക്കാൻ സന്നദ്ധത അറിയിച്ചതിന് നന്ദി!',
    availableCardTitle: 'രക്തദാനത്തിന് തയ്യാർ',
    availableCardDesc: 'നിങ്ങളുടെ സ്റ്റാറ്റസ് ഇപ്പോൾ "Available" ആണ്. ആവശ്യമെങ്കിൽ ഡാഷ്‌ബോർഡിൽ നിന്ന് മാറ്റാവുന്നതാണ്.',
    pointsCardTitle: 'ജീവാപോയിന്റ്സ് ബോണസ്',
    pointsCardDesc: 'രക്തദാനം ചെയ്യുന്നത് വഴി നിങ്ങൾക്ക് പ്രത്യേക സർട്ടിഫിക്കറ്റുകളും ബാഡ്ജുകളും ലഭിക്കുന്നതാണ്.',
    ineligibleBannerTitle: 'രക്തദാനം താൽക്കാലികമായി മാറ്റിവെച്ചിരിക്കുന്നു',
    ineligibleBannerDesc: 'നിങ്ങളുടെ അവസാന പരിശോധന പ്രകാരം ഇപ്പോൾ രക്തദാനം ചെയ്യാൻ സാധിക്കില്ല. ഇത് നിങ്ങളുടെ ആരോഗ്യ സുരക്ഷ മുൻനിർത്തിയാണ്.',
    ineligibleDoctorTip: '💡 രോഗലക്ഷണങ്ങൾ ഉള്ളപക്ഷം ഒരു ഡോക്ടറുടെ ഉപദേശം തേടുക. നിശ്ചിത വിശ്രമ കാലയളവിനു ശേഷം നിങ്ങൾക്ക് വീണ്ടും പരിശോധന നടത്താം.',
    noAssessmentTitle: 'ആരോഗ്യ വിവരങ്ങൾ പരിശോധിച്ചിട്ടില്ല',
    noAssessmentDesc: 'നിങ്ങൾ ഇതുവരെ ആരോഗ്യ യോഗ്യതാ ചോദ്യാവലി പൂർത്തിയാക്കിയിട്ടില്ല. ഇത് പൂർത്തിയാക്കിയാൽ മാത്രമേ നിങ്ങളെ ആക്ടീവ് ദാതാവായി ലിസ്റ്റ് ചെയ്യുകയുള്ളൂ.',
    yesMeets: '✓ അതെ, മാനദണ്ഡം പാലിക്കുന്നുണ്ട്',
    yesApplies: '⚠️ അതെ, എനിക്ക് ബാധകമാണ്',
    noDoesNotApply: '✓ ഇല്ല, ബാധകമല്ല (സുരക്ഷിതമാണ്)',
    noDoesNotMeet: '✕ അല്ല, മാനദണ്ഡമില്ല',
    pregYes: 'അതെ (ഗർഭിണിയാണ് / മുലയൂട്ടുന്നു)',
    pregNo: 'അല്ല (ഗർഭിണിയോ മുലയൂട്ടുന്നവരോ അല്ല)',
    pregNa: 'ബാധകമല്ല (പുരുഷ ദാതാവ്)'
  },
  en: {
    portalBadge: 'Donor Portal',
    pageTag: 'Health Check',
    pageTitle: 'Health & Donation Eligibility',
    statusLabel: 'Status:',
    statusEligible: 'Eligible',
    statusIneligible: 'Ineligible',
    statusPending: 'Pending Check',
    currentStatus: 'Current Status',
    lastChecked: 'Last Checked',
    startCheck: 'Start Health Check',
    retakeCheck: 'Re-take Assessment',
    assessNow: 'Assess Now',
    saveAndClose: 'Save & Close',
    saving: 'Saving...',
    progress: 'Assessment Progress',
    step: 'Step',
    of: 'of',
    back: 'Back',
    next: 'Next',
    autoDetectedAge: 'Auto-detected from profile:',
    yearsOld: 'years old',
    bornOn: 'Born',
    autoDetectedWeight: 'Auto-detected from profile:',
    autoSetNa: 'Auto-set: Not Applicable (Detected sex:',
    congratsTitle: 'Congratulations! You are Eligible',
    congratsDesc: 'You meet all basic safety guidelines and requirements for blood donation. Thank you for completing this health verification.',
    congratsNote: 'Saving this result sets your profile status to Eligible and marks you as available to help searchers. You will be prompted to re-assess only if updates to your health occur.',
    deferralTitle: 'Temporary Ineligibility',
    deferralDesc: 'Based on your answers, you are currently not cleared for donation. This is to safeguard your health and prevent complications for blood recipients.',
    deferralReasons: 'Reasons for Deferral',
    deferralNote: 'Your safety is our priority. If you save this result, your status will update to Ineligible, and you will be temporarily hidden from compatibility searches. You can re-assess anytime your status changes.',
    eligibleBannerTitle: 'You are eligible to donate!',
    eligibleBannerDesc: 'Your health check is active and valid. Hospitals and requesters in your locality can find you when looking for active donors. Thank you for your willingness to save lives!',
    availableCardTitle: 'Available for Requests',
    availableCardDesc: 'Your status is currently set to "Available". Toggle this anytime from your dashboard if your availability changes.',
    pointsCardTitle: 'JeevaPoints Booster',
    pointsCardDesc: 'Donating blood earns you JeevaPoints which unlock special recognition certificates and healthcare benefit badges.',
    ineligibleBannerTitle: 'Donation Deferral Active',
    ineligibleBannerDesc: 'Based on your last assessment, you are temporarily ineligible to donate. This status helps prevent strain on your health and maintains recipient safety.',
    ineligibleDoctorTip: '💡 We recommend consulting with a general physician if you have underlying symptoms. You can retake this test at any time when your medical conditions clear or cooldown requirements are satisfied.',
    noAssessmentTitle: 'No Health Assessment Filed',
    noAssessmentDesc: 'You haven\'t completed your donation eligibility questionnaire yet. Completing it validates your profile and lists you as an active helper in regional searches.',
    yesMeets: '✓ Yes, I meet this',
    yesApplies: '⚠️ Yes, applies to me',
    noDoesNotApply: '✓ No, does not apply',
    noDoesNotMeet: '✕ No, I do not',
    pregYes: 'Yes (Currently Pregnant / Nursing)',
    pregNo: 'No (Not Pregnant / Nursing)',
    pregNa: 'Not Applicable (Male Donor)'
  }
};

const QUESTIONS = [
  {
    id: 'age',
    title: {
      ml: 'പ്രായപരിധി',
      en: 'Age Check'
    },
    question: {
      ml: 'നിങ്ങളുടെ പ്രായം 18 നും 65 നും ഇടയിലാണോ?',
      en: 'Are you between 18 and 65 years old?'
    },
    description: {
      ml: '18 മുതൽ 65 വയസ്സ് വരെയുള്ള ആരോഗ്യവാനായ ഏതൊരാൾക്കും രക്തദാനം ചെയ്യുന്നത് പൂർണ്ണമായും സുരക്ഷിതമാണ്.',
      en: 'Blood donation is medically safe and gentle on your body when you are between 18 and 65 years of age.'
    },
    icon: Calendar,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200/80',
    expected: 'yes',
    failMessage: {
      ml: 'രക്തദാനം സുരക്ഷിതമായിരിക്കാൻ ദാതാവിന് 18 മുതൽ 65 വയസ്സ് വരെ പ്രായമുണ്ടായിരിക്കണം.',
      en: 'Donors must be between 18 and 65 years old to ensure a safe, comfortable donation.'
    }
  },
  {
    id: 'weight',
    title: {
      ml: 'ശരീരഭാരം',
      en: 'Body Weight'
    },
    question: {
      ml: 'നിങ്ങളുടെ ശരീരഭാരം കുറഞ്ഞത് 50 കിലോഗ്രാം ഉണ്ടോ?',
      en: 'Do you weigh at least 50 kg (110 lbs)?'
    },
    description: {
      ml: '50 കിലോയിൽ കൂടുതൽ ഭാരമുള്ളവർക്ക് രക്തദാനത്തിന് ശേഷം വേഗത്തിൽ ആരോഗ്യം വീണ്ടെടുക്കാനും ശാരീരിക ബുദ്ധിമുട്ടുകൾ ഇല്ലാതിരിക്കാനും സാധിക്കും.',
      en: 'Weighing 50+ kg ensures your body has plenty of blood volume so you stay healthy and recover quickly.'
    },
    icon: Scale,
    color: 'text-blue-600 bg-blue-50 border-blue-200/80',
    expected: 'yes',
    failMessage: {
      ml: 'രക്തദാന സമയത്തും ശേഷവും നിങ്ങളുടെ ആരോഗ്യം സംരക്ഷിക്കാൻ കുറഞ്ഞത് 50 കിലോ ഭാരം ആവശ്യമാണ്.',
      en: 'A minimum weight of 50 kg is required to protect your health during and after donation.'
    }
  },
  {
    id: 'cooldown',
    title: {
      ml: 'മുൻ രക്തദാനം',
      en: 'Donation Cooldown'
    },
    question: {
      ml: 'കഴിഞ്ഞ 90 ദിവസത്തിനുള്ളിൽ (3 മാസം) നിങ്ങൾ രക്തം ദാനം ചെയ്തിട്ടുണ്ടോ?',
      en: 'Have you donated blood in the last 90 days (3 months)?'
    },
    description: {
      ml: 'രക്തകോശങ്ങളും ഇരുമ്പിന്റെ അളവും ശരീരത്തിൽ സ്വാഭാവികമായി പുനർനിർമ്മിക്കാൻ ശരീരത്തിന് 90 ദിവസത്തെ ഇടവേള ആവശ്യമാണ്.',
      en: 'Your body needs about 90 days to rest and naturally rebuild its red blood cells and iron levels.'
    },
    icon: Clock,
    color: 'text-amber-600 bg-amber-50 border-amber-200/80',
    expected: 'no',
    failMessage: {
      ml: 'ശരീരത്തിലെ ഹീമോഗ്ലോബിന്റെ അളവ് കൃത്യമായി നിലനിർത്താൻ രണ്ട് രക്തദാനങ്ങൾക്കിടയിൽ 90 ദിവസത്തെ ഇടവേള നിർബന്ധമാണ്.',
      en: 'A 90-day rest period is required between donations to keep your hemoglobin strong.'
    }
  },
  {
    id: 'tattoos',
    title: {
      ml: 'ടാറ്റൂ & തുളയ്ക്കൽ',
      en: 'Tattoos & Piercings'
    },
    question: {
      ml: 'കഴിഞ്ഞ 6 മാസത്തിനുള്ളിൽ നിങ്ങൾ ടാറ്റൂ അടിക്കുകയോ ശരീരം തുളയ്ക്കുകയോ (Piercing) ചെയ്തിട്ടുണ്ടോ?',
      en: 'Have you received a tattoo or body piercing in the last 6 months?'
    },
    description: {
      ml: 'ചർമ്മത്തിലെ മുറിവുകൾ പൂർണ്ണമായും ഉണങ്ങാനും അണുബാധകൾ ഉണ്ടാകാതിരിക്കാനും 6 മാസത്തെ കാത്തിരിപ്പ് അത്യാവശ്യമാണ്.',
      en: 'A 6-month wait allows any fresh skin marks to heal completely, keeping both you and blood recipients safe.'
    },
    icon: Info,
    color: 'text-purple-600 bg-purple-50 border-purple-200/80',
    expected: 'no',
    failMessage: {
      ml: 'ടാറ്റൂ അല്ലെങ്കിൽ പിയേഴ്സിംഗ് ചെയ്തതിന് ശേഷം രക്തദാനം ചെയ്യുന്നതിന് മുമ്പ് 6 മാസം കാത്തിരിക്കേണ്ടതുണ്ട്.',
      en: 'Please allow 6 months for any new tattoo or piercing to heal before donating.'
    }
  },
  {
    id: 'illness',
    title: {
      ml: 'നിലവിലെ ആരോഗ്യം',
      en: 'Current Health'
    },
    question: {
      ml: 'നിങ്ങൾക്ക് ഇപ്പോൾ പനി, ചുമ, മറ്റ് അണുബാധകൾ ഉണ്ടോ അതോ ആന്റിബയോട്ടിക് മരുന്നുകൾ കഴിക്കുന്നുണ്ടോ?',
      en: 'Do you currently have fever, cough, infections, or are taking antibiotics?'
    },
    description: {
      ml: 'നിങ്ങളുടെ രോഗപ്രതിരോധശേഷി സംരക്ഷിക്കുന്നതിനും രക്തം സ്വീകരിക്കുന്ന രോഗിയുടെ സുരക്ഷയ്ക്കും, രക്തദാന ദിവസം നിങ്ങൾ പൂർണ്ണ ആരോഗ്യവാനായിരിക്കണം.',
      en: 'To protect your immune system and the patient receiving blood, you should feel 100% healthy on donation day.'
    },
    icon: AlertCircle,
    color: 'text-rose-600 bg-rose-50 border-rose-200/80',
    expected: 'no',
    failMessage: {
      ml: 'രക്തദാനം ചെയ്യുന്നതിന് മുമ്പ് നിങ്ങൾ അണുബാധകളിൽ നിന്ന് മുക്തരായിരിക്കണം, ആന്റിബയോട്ടിക്കുകൾ കഴിക്കുന്നവരായിരിക്കരുത്.',
      en: 'You should be completely free of infection and off antibiotics before donating.'
    }
  },
  {
    id: 'pregnancy',
    title: {
      ml: 'ഗർഭധാരണവും മുലയൂട്ടലും',
      en: 'Pregnancy & Nursing'
    },
    question: {
      ml: 'ബാധകമെങ്കിൽ, നിങ്ങൾ ഇപ്പോൾ ഗർഭിണിയോ അല്ലെങ്കിൽ കുഞ്ഞിന് മുലയൂട്ടുന്ന അമ്മയോ ആണോ?',
      en: 'If applicable, are you currently pregnant or nursing a baby?'
    },
    description: {
      ml: 'അമ്മമാർക്കും കുഞ്ഞുങ്ങൾക്കും പോഷകങ്ങളും ഇരുമ്പും പൂർണ്ണമായി ആവശ്യമായതിനാൽ ഈ കാലയളവിൽ രക്തദാനം ഒഴിവാക്കാൻ നിർദ്ദേശിക്കുന്നു.',
      en: 'Mothers need all their nourishment and iron for themselves and their little ones, so we recommend waiting.'
    },
    icon: Heart,
    color: 'text-pink-600 bg-pink-50 border-pink-200/80',
    expected: 'no',
    failMessage: {
      ml: 'അമ്മയുടെയും കുഞ്ഞിന്റെയും സുരക്ഷ മുൻനിർത്തി ഗർഭകാലത്തും മുലയൂട്ടുന്ന സമയത്തും രക്തദാനം ഒഴിവാക്കേണ്ടതാണ്.',
      en: 'Blood donation is deferred during pregnancy and nursing for maternal & infant safety.'
    }
  }
];

export default function DonorEligibility() {
  const { user } = useAuthStore();
  const { saveEligibility } = useAppStore();

  const [lang, setLang] = useState('ml'); // Default to Malayalam
  const [isAssessing, setIsAssessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [saving, setSaving] = useState(false);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.ml;

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

  const getStatusText = (status) => {
    if (status === 'Eligible') return t.statusEligible;
    if (status === 'Ineligible') return t.statusIneligible;
    return t.statusPending;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Navbar Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border-slate-200 shadow-sm p-4.5 rounded-3xl border /80 shadow-xs text-left">
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
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.portalBadge}</span>
              <span className="text-slate-300">•</span>
              <span className="text-[10px] font-bold text-rose-600">{t.pageTag}</span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-rose-600 shrink-0" /> {t.pageTitle}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0 flex-wrap">
          {/* Language Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setLang('ml')}
              className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                lang === 'ml'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Languages className="w-3.5 h-3.5" /> മലയാളം
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                lang === 'en'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
          </div>

          {/* Quick Status Pill */}
          <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-1.5 rounded-2xl border border-slate-200/60">
            <span className="text-xs font-bold text-slate-500">{t.statusLabel}</span>
            <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
              user?.eligibilityStatus === 'Eligible'
                ? 'bg-emerald-100 text-emerald-800'
                : user?.eligibilityStatus === 'Ineligible'
                ? 'bg-rose-100 text-rose-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {getStatusText(user?.eligibilityStatus)}
            </span>
          </div>
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
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{t.currentStatus}</span>
                  <h3 className="text-xl font-black text-gray-900 mt-0.5">
                    {getStatusText(user?.eligibilityStatus)}
                  </h3>
                  {user?.eligibilityCheckedAt && (
                    <p className="text-xs text-gray-400 mt-0.5 font-medium">
                      {t.lastChecked}: {new Date(user.eligibilityCheckedAt).toLocaleDateString(lang === 'ml' ? 'ml-IN' : 'en-IN', {
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
                className="btn-primary w-full md:w-auto px-6 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> {t.startCheck}
              </button>
            </div>

            {/* Information Cards based on status */}
            {user?.eligibilityStatus === 'Eligible' ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex gap-3 text-emerald-950 text-xs leading-relaxed">
                  <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-emerald-900 mb-0.5">{t.eligibleBannerTitle}</span>
                    {t.eligibleBannerDesc}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs space-y-1">
                    <span className="font-bold text-gray-800 block">{t.availableCardTitle}</span>
                    <p className="text-gray-500 leading-normal">{t.availableCardDesc}</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs space-y-1">
                    <span className="font-bold text-gray-800 block">{t.pointsCardTitle}</span>
                    <p className="text-gray-500 leading-normal">{t.pointsCardDesc}</p>
                  </div>
                </div>
              </div>
            ) : user?.eligibilityStatus === 'Ineligible' ? (
              <div className="space-y-4">
                <div className="p-4 bg-red-50/50 border border-red-100 rounded-2xl flex gap-3 text-red-950 text-xs leading-relaxed">
                  <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-red-900 mb-0.5">{t.ineligibleBannerTitle}</span>
                    {t.ineligibleBannerDesc}
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed pl-1">
                  {t.ineligibleDoctorTip}
                </p>
              </div>
            ) : (
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl text-center space-y-3">
                <Info className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="font-bold text-gray-850 text-sm">{t.noAssessmentTitle}</h4>
                <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                  {t.noAssessmentDesc}
                </p>
                <button
                  onClick={startAssessment}
                  className="px-4 py-2 border text-gray-700 bg-white border-slate-200 shadow-sm hover:bg-slate-50 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  {t.assessNow}
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
                <span>{t.progress}</span>
                <span className="text-primary font-black">{t.step} {currentStep + 1} {t.of} {QUESTIONS.length}</span>
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
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                    {currentQuestion.title[lang] || currentQuestion.title.ml}
                  </h4>
                  <h3 className="text-lg font-black text-gray-900 mt-0.5 leading-snug">
                    {currentQuestion.question[lang] || currentQuestion.question.ml}
                  </h3>
                </div>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed sm:pl-18">
                {currentQuestion.description[lang] || currentQuestion.description.ml}
              </p>

              {/* Age auto-detected message */}
              {currentQuestion.id === 'age' && (user?.dob || user?.dateOfBirth) && (
                <div className="mt-4 ml-0 sm:ml-18 p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-gray-600 flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>
                    {t.autoDetectedAge} <strong>{calculateAge(user.dob || user.dateOfBirth)} {t.yearsOld}</strong> ({t.bornOn} {new Date(user.dob || user.dateOfBirth).toLocaleDateString(lang === 'ml' ? 'ml-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}).
                  </span>
                </div>
              )}

              {/* Weight auto-detected message */}
              {currentQuestion.id === 'weight' && user?.weight && (
                <div className="mt-4 ml-0 sm:ml-18 p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-gray-600 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>
                    {t.autoDetectedWeight} <strong>{user.weight} kg</strong>.
                  </span>
                </div>
              )}

              {/* Pregnancy auto-set message */}
              {currentQuestion.id === 'pregnancy' && user?.sex && user.sex !== 'female' && (
                <div className="mt-4 ml-0 sm:ml-18 p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-gray-600 flex items-center gap-2">
                  <Info className="w-4 h-4 text-pink-500 shrink-0" />
                  <span>
                    {t.autoSetNa} {user.sex}).
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
                  <ChevronLeft className="w-4 h-4" /> {t.back}
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
                    {t.pregYes}
                  </button>
                  <button
                    onClick={() => handleAnswer('no')}
                    className={`flex-1 py-3.5 px-4 font-bold rounded-2xl text-xs transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                      answers.pregnancy === 'no'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-emerald-50/70 border border-emerald-200/80 hover:bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {t.pregNo}
                  </button>
                  <button
                    onClick={() => handleAnswer('na')}
                    className={`flex-1 py-3.5 px-4 font-bold rounded-2xl text-xs transition-all text-center cursor-pointer ${
                      answers.pregnancy === 'na'
                        ? 'bg-slate-800 text-white shadow-md'
                        : 'bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {t.pregNa}
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
                    {currentQuestion.expected === 'yes' ? t.yesMeets : t.yesApplies}
                  </button>
                  <button
                    onClick={() => handleAnswer('no')}
                    className={`flex-1 py-3.5 px-4 font-bold rounded-2xl text-xs transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                      answers[currentQuestion.id] === 'no'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-slate-50 border border-slate-200/80 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    {currentQuestion.expected === 'no' ? t.noDoesNotApply : t.noDoesNotMeet}
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
                  {t.next} <ChevronRight className="w-4 h-4" />
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
                  <h2 className="text-2xl font-black text-emerald-600">{t.congratsTitle}</h2>
                  <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                    {t.congratsDesc}
                  </p>
                </div>

                <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-2xl max-w-md mx-auto text-[11px] text-emerald-950 text-left leading-normal flex gap-2">
                  <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p>{t.congratsNote}</p>
                </div>
              </div>
            ) : (
              // Ineligible Result
              <div className="space-y-6">
                <div className="text-center space-y-3 py-2">
                  <div className="w-16 h-16 bg-red-50 border border-red-150 rounded-2xl flex items-center justify-center mx-auto text-primary shadow-sm">
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-black text-red-600">{t.deferralTitle}</h2>
                  <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                    {t.deferralDesc}
                  </p>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.deferralReasons}</h4>
                  <div className="space-y-2">
                    {assessmentResult.failedQuestions.map((q) => {
                      const Icon = q.icon;
                      return (
                        <div key={q.id} className="p-3 bg-red-50/50 border border-red-100 rounded-xl flex items-start gap-3">
                          <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <div className="text-xs text-red-950">
                            <span className="font-bold block text-red-900">{q.title[lang] || q.title.ml}</span>
                            {q.failMessage[lang] || q.failMessage.ml}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] text-gray-500 leading-normal flex gap-2">
                  <Info className="w-4.5 h-4.5 text-gray-400 shrink-0 mt-0.5" />
                  <p>{t.deferralNote}</p>
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
                {t.retakeCheck}
              </button>
              <button
                type="button"
                onClick={handleSaveResult}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs shadow-md transition-colors text-center cursor-pointer"
                disabled={saving}
              >
                {saving ? t.saving : t.saveAndClose}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
