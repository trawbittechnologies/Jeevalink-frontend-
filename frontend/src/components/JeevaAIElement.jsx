import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Zap,
  Activity,
  ShieldCheck,
  MapPin,
  Clock,
  CheckCircle2,
  Users,
  Search,
  MessageSquare,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Heart,
  Droplets,
  Radio,
  Building2,
  Smartphone
} from 'lucide-react';

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const districts = [
  'Kozhikode',
  'Ernakulam',
  'Thiruvananthapuram',
  'Thrissur',
  'Kannur',
  'Malappuram',
  'Kottayam',
  'Palakkad',
  'Alappuzha',
  'Kollam',
  'Idukki',
  'Pathanamthitta',
  'Wayanad',
  'Kasaragod',
];

const healthFaqs = [
  {
    q: 'Can I donate blood after receiving a COVID-19 or flu vaccine?',
    a: 'Yes, as long as you are symptom-free. Standard waiting period is 14 days after non-live viral vaccines. Feel free to consult our DYFI health coordinators for specific vaccine brands.',
    category: 'Vaccination',
  },
  {
    q: 'How frequently can I donate whole blood or platelets?',
    a: 'Whole blood can be donated once every 90 days (3 months) for men and 120 days for women. Platelets (apheresis) can be donated every 14 days up to 24 times a year.',
    category: 'Intervals',
  },
  {
    q: 'What are the rules regarding recent tattoos or body piercings?',
    a: 'You must wait 6 months after getting a tattoo or body piercing at a registered medical studio, or 12 months if performed elsewhere, to ensure complete blood safety.',
    category: 'Tattoos & Piercings',
  },
  {
    q: 'What should I eat and drink before donating blood?',
    a: 'Drink at least 500ml of water 30 minutes before donating. Eat a healthy iron-rich meal (e.g. spinach, legumes, fruits) and avoid heavy fatty foods or alcohol 24 hours prior.',
    category: 'Preparation',
  },
];

export default function JeevaAIElement() {
  const [activeTab, setActiveTab] = useState('radar'); // 'radar' | 'assistant' | 'dispatch'
  const [selectedBlood, setSelectedBlood] = useState('O+');
  const [selectedDistrict, setSelectedDistrict] = useState('Kozhikode');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // Assistant State
  const [activeFaq, setActiveFaq] = useState(0);
  const [customQuestion, setCustomQuestion] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const [aiAnswer, setAiAnswer] = useState(null);

  const handleRunRadar = () => {
    setIsScanning(true);
    setScanResult(null);

    setTimeout(() => {
      setIsScanning(false);
      setScanResult({
        donorsAvailable: Math.floor(Math.random() * 25) + 14,
        avgDistance: (Math.random() * 3 + 1.2).toFixed(1),
        estArrivalMinutes: Math.floor(Math.random() * 5) + 4,
        confidence: (98.5 + Math.random() * 1.4).toFixed(1),
        verifiedCoordinators: Math.floor(Math.random() * 6) + 3,
      });
    }, 1800);
  };

  const handleAskQuestion = (e) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;

    setAiThinking(true);
    setAiAnswer(null);

    setTimeout(() => {
      setAiThinking(false);
      setAiAnswer({
        q: customQuestion,
        a: `Based on Kerala State Blood Transfusion Council guidelines, for "${customQuestion}": Please ensure you are between 18-65 years old, weigh at least 45kg, and have a hemoglobin level above 12.5 g/dL. If you take regular medications, your local DYFI Block Coordinator will verify your profile prior to donation.`,
      });
    }, 1200);
  };

  return (
    <div className="w-full relative overflow-hidden rounded-3xl bg-slate-950 border border-slate-800 text-white shadow-2xl">
      {/* Background Radial Glow Effects */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-red-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-rose-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-900/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Container Header */}
      <div className="relative z-10 p-6 md:p-10 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span>JeevaAI Smart Suite 2.0</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              AI Emergency Matching & Health Companion
            </h2>
            <p className="text-slate-400 text-sm md:text-base max-w-xl">
              Engineered for rapid response across Kerala. Real-time proximity radar, instant health eligibility verification, and automated volunteer dispatching.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center p-1.5 bg-slate-900 border border-slate-800 rounded-2xl w-full md:w-auto shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('radar')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'radar'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>AI Radar Match</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('assistant')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'assistant'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Eligibility Assistant</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('dispatch')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'dispatch'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Automated SOS Flow</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="relative z-10 p-6 md:p-10">
        <AnimatePresence mode="wait">
          {/* TAB 1: AI RADAR MATCH */}
          {activeTab === 'radar' && (
            <motion.div
              key="radar"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              {/* Radar Controls */}
              <div className="lg:col-span-6 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-red-500" />
                    Simulate Real-Time Proximity Search
                  </h3>
                  <p className="text-slate-400 text-xs md:text-sm">
                    Select a blood group and district to run our location-aware AI radar matching engine.
                  </p>
                </div>

                {/* Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Blood Group */}
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-red-500" />
                      Blood Group Needed
                    </label>
                    <select
                      value={selectedBlood}
                      onChange={(e) => setSelectedBlood(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700/80 rounded-2xl text-white font-bold text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 cursor-pointer"
                    >
                      {bloodTypes.map((bg) => (
                        <option key={bg} value={bg} className="bg-slate-900 text-white">
                          {bg} Blood
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* District */}
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      Target District
                    </label>
                    <select
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700/80 rounded-2xl text-white font-bold text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 cursor-pointer"
                    >
                      {districts.map((d) => (
                        <option key={d} value={d} className="bg-slate-900 text-white">
                          {d} District
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="button"
                  onClick={handleRunRadar}
                  disabled={isScanning}
                  className="w-full py-4 bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-red-600/30 flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] cursor-pointer disabled:opacity-50"
                >
                  {isScanning ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin text-amber-300" />
                      <span>Scanning Active Donors in {selectedDistrict}...</span>
                    </>
                  ) : (
                    <>
                      <Radio className="w-5 h-5 text-amber-300 animate-pulse" />
                      <span>Run AI Radar Match ({selectedBlood} in {selectedDistrict})</span>
                    </>
                  )}
                </button>

                {/* Info Note */}
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Privacy protected: Precise coordinates are hidden until recipient request is confirmed by DYFI officers.
                  </span>
                </div>
              </div>

              {/* Radar Screen Visualizer */}
              <div className="lg:col-span-6 flex flex-col items-center justify-center">
                <div className="relative w-full max-w-sm aspect-square rounded-3xl bg-slate-900/90 border border-slate-800 p-6 flex flex-col items-center justify-center overflow-hidden shadow-inner">
                  {/* Radar Circles */}
                  <div className="absolute inset-4 rounded-full border border-slate-800/80 pointer-events-none" />
                  <div className="absolute inset-12 rounded-full border border-slate-800/60 pointer-events-none" />
                  <div className="absolute inset-24 rounded-full border border-red-500/20 pointer-events-none" />
                  
                  {/* Crosshairs */}
                  <div className="absolute inset-x-0 top-1/2 h-px bg-slate-800/60 pointer-events-none" />
                  <div className="absolute inset-y-0 left-1/2 w-px bg-slate-800/60 pointer-events-none" />

                  {/* Scanning Beam Animation */}
                  {isScanning && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                      className="absolute w-full h-full rounded-full bg-[conic-gradient(from_0deg,transparent_0_300deg,rgba(220,38,38,0.4)_360deg)] pointer-events-none"
                    />
                  )}

                  {/* Center Node */}
                  <div className="relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-red-600/50">
                    <Droplets className="w-7 h-7 fill-current animate-pulse" />
                  </div>

                  {/* Dynamic Donor Blips when scan is complete */}
                  {!isScanning && scanResult && (
                    <>
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-10 right-12 flex items-center gap-1 bg-red-600/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                        <Users className="w-3 h-3" /> Donor 1.2km
                      </motion.div>

                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1 }} className="absolute bottom-12 left-10 flex items-center gap-1 bg-emerald-600/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                        <CheckCircle2 className="w-3 h-3" /> Coordinator Active
                      </motion.div>

                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }} className="absolute top-24 left-8 flex items-center gap-1 bg-rose-600/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                        <Droplets className="w-3 h-3" /> {selectedBlood} Ready
                      </motion.div>
                    </>
                  )}

                  {/* Dynamic Status Text overlay */}
                  <div className="relative z-10 mt-6 text-center">
                    {isScanning ? (
                      <p className="text-xs font-bold text-amber-400 animate-pulse">
                        Scanning 15km Radius in {selectedDistrict}...
                      </p>
                    ) : scanResult ? (
                      <div className="space-y-1">
                        <p className="text-xs font-black uppercase tracking-wider text-emerald-400">
                          {scanResult.confidence}% AI Match Confidence
                        </p>
                        <p className="text-sm font-extrabold text-white">
                          {scanResult.donorsAvailable} Donors Ready in {selectedDistrict}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 font-semibold">
                        Press "Run AI Radar Match" to test proximity dispatch
                      </p>
                    )}
                  </div>
                </div>

                {/* Scan Result Metrics */}
                {scanResult && !isScanning && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-3 gap-3 w-full max-w-sm mt-4 text-center"
                  >
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                      <p className="text-lg font-black text-white">{scanResult.avgDistance} km</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Avg Distance</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                      <p className="text-lg font-black text-emerald-400">&lt; {scanResult.estArrivalMinutes} min</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Est Response</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                      <p className="text-lg font-black text-amber-400">{scanResult.verifiedCoordinators}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Coordinators</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 2: ELIGIBILITY ASSISTANT */}
          {activeTab === 'assistant' && (
            <motion.div
              key="assistant"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* FAQ Accordions / Presets */}
              <div className="lg:col-span-6 space-y-4">
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-5 h-5 text-red-500" />
                  Instant Medical & Eligibility Guidelines
                </h3>

                <div className="space-y-3">
                  {healthFaqs.map((faq, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveFaq(idx)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        activeFaq === idx
                          ? 'bg-slate-900 border-red-500/60 shadow-lg shadow-red-500/10'
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-black uppercase tracking-wider text-red-400">
                          {faq.category}
                        </span>
                        {activeFaq === idx && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </div>

                      <h4 className="text-sm font-bold text-white mt-1">{faq.q}</h4>

                      {activeFaq === idx && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-xs text-slate-300 mt-2 leading-relaxed font-medium"
                        >
                          {faq.a}
                        </motion.p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Custom Question Input */}
              <div className="lg:col-span-6 flex flex-col justify-between p-6 rounded-3xl bg-slate-900/90 border border-slate-800">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full border-2 border-red-500 shadow-lg overflow-hidden shrink-0 bg-black">
                      <video
                        src="/ef4440f93e8a494c85ff80cfb1c9bee4.webm"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">Ask JeevaAI Assistant</h4>
                      <p className="text-xs text-slate-400">Instant AI answers regarding medical eligibility</p>
                    </div>
                  </div>

                  {/* AI Response Display Box */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 min-h-[160px] flex flex-col justify-center">
                    {aiThinking ? (
                      <div className="flex items-center justify-center gap-3 text-red-400 text-xs font-bold py-8">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Evaluating medical criteria...</span>
                      </div>
                    ) : aiAnswer ? (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-400 italic">"{aiAnswer.q}"</p>
                        <p className="text-xs text-slate-200 leading-relaxed font-medium">
                          {aiAnswer.a}
                        </p>
                        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 pt-2">
                          <CheckCircle2 className="w-3 h-3" /> Verified by Kerala Blood Transfusion Standards
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-slate-500 space-y-1 py-6">
                        <MessageSquare className="w-8 h-8 mx-auto text-slate-700 mb-2" />
                        <p className="text-xs font-semibold">Type any specific query below to get instant AI answers</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Input Form */}
                <form onSubmit={handleAskQuestion} className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    placeholder="e.g. Can I donate if I am taking antibiotic pills?"
                    className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                  <button
                    type="submit"
                    disabled={aiThinking || !customQuestion.trim()}
                    className="px-5 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    <span>Ask AI</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* TAB 3: AUTOMATED SOS DISPATCH FLOW */}
          {activeTab === 'dispatch' && (
            <motion.div
              key="dispatch"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="text-center max-w-xl mx-auto space-y-2">
                <h3 className="text-xl font-black text-white">
                  How JeevaAI Dispatches Emergency Requests
                </h3>
                <p className="text-slate-400 text-xs md:text-sm">
                  Our automated pipeline connects recipients, regional DYFI committee officers, and donors in under 5 minutes.
                </p>
              </div>

              {/* 4 Step Visual Flow Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 relative group hover:border-red-500/50 transition-all">
                  <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-400 flex items-center justify-center font-black text-sm">
                    01
                  </div>
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-red-400" />
                    SOS Post Created
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Patient or hospital submits an emergency request with blood group, hospital location, and units needed.
                  </p>
                </div>

                <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 relative group hover:border-red-500/50 transition-all">
                  <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-400 flex items-center justify-center font-black text-sm">
                    02
                  </div>
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Radio className="w-4 h-4 text-red-400" />
                    AI Radius Broadcast
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    JeevaAI instantly scans a 15km GPS radius, notifying registered active donors matching the blood type.
                  </p>
                </div>

                <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 relative group hover:border-red-500/50 transition-all">
                  <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-400 flex items-center justify-center font-black text-sm">
                    03
                  </div>
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-red-400" />
                    DYFI Verification
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Local Block Committee officers verify the request authenticity and assign a volunteer coordinator.
                  </p>
                </div>

                <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 relative group hover:border-red-500/50 transition-all">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-black text-sm">
                    04
                  </div>
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Heart className="w-4 h-4 text-emerald-400" />
                    Donation Completed
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Donor arrives at hospital, fulfills donation, and receives a digital impact certificate & reward points.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
