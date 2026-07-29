import { useState } from 'react';
import { useAppStore } from '../store/appStore.js';
import { Mail, Phone, MapPin, ChevronDown, ChevronUp, Send, Droplets, MessageSquare, Siren } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
  { q: 'Who can donate blood?', a: 'Anyone between 18–65 years, weighing at least 50kg, and in good health can donate blood. You should not have donated in the last 3 months.' },
  { q: 'Is blood donation safe?', a: 'Yes, completely. All equipment is sterilized and single-use. The process takes 30–45 minutes and is medically supervised.' },
  { q: 'How do I register as a donor?', a: 'Click on "Register" in the top navigation, fill in your details including blood group and location, and you\'ll be part of our network instantly.' },
  { q: 'How does JeevaLink match donors?', a: 'Our system uses blood group compatibility, location proximity, and donor availability to find the best matches for each request.' },
  { q: 'What are JeevaPoints?', a: 'JeevaPoints are reward points earned for each donation milestone. They can be redeemed for health benefits and recognition certificates.' },
];

const contactCards = [
  { icon: Mail, title: 'Email Us', detail: 'support@jeevalink.org', sub: 'We reply within 24 hours', colorClass: 'bg-blue-50 text-blue-600 border-blue-100' },
  { icon: Phone, title: 'Call Us', detail: '+91 98765 43210', sub: 'Mon–Sat, 9am–6pm IST', colorClass: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  { icon: MapPin, title: 'Our Office', detail: 'Bengaluru, Karnataka', sub: 'India — 560001', colorClass: 'bg-amber-50 text-amber-600 border-amber-100' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Contact() {
  const { triggerToast } = useAppStore();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [openFaq, setOpenFaq] = useState(null);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) { triggerToast('Please fill all required fields.', 'warning'); return; }
    setSending(true);
    await new Promise(r => setTimeout(r, 600));
    triggerToast("Message sent! We'll get back to you within 24 hours.", 'success');
    setForm({ name: '', email: '', subject: '', message: '' });
    setSending(false);
  };

  return (
    <div className="bg-slate-50 min-h-screen">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-20 bg-gradient-to-br from-white via-red-50/40 to-rose-50/60 border-b border-slate-100">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-100/30 rounded-full blur-3xl pointer-events-none" />
        <div className="container-wide relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-red-600 bg-red-50 border border-red-200/70 px-4 py-2 rounded-full mb-5">
              <MessageSquare className="w-3 h-3" />
              Get In Touch
            </span>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight mb-4">
              Contact <span className="text-primary">Us</span>
            </h1>
            <p className="text-slate-500 text-lg max-w-lg mx-auto leading-relaxed">
              Have a question, suggestion, or emergency? We're here 24/7 to help.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Main Content ── */}
      <section className="section bg-white">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-12">

            {/* ── Contact Form ── */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Send a Message</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="input-base"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="input-base"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="input-base"
                    placeholder="How can we help?"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Message *
                  </label>
                  <textarea
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="input-base resize-none"
                    placeholder="Describe your query or feedback…"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="btn-primary w-full py-3.5 text-sm rounded-2xl shadow-md shadow-red-100 disabled:opacity-60"
                >
                  {sending ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Sending…
                    </>
                  ) : (
                    <><Send className="w-4 h-4" /> Send Message</>
                  )}
                </button>
              </form>
            </motion.div>

            {/* ── Info & Emergency ── */}
            <div className="space-y-5">
              <motion.div variants={fadeUp} custom={1} initial="hidden" whileInView="show" viewport={{ once: true }}>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-5">Get in Touch</h2>
                <div className="space-y-3">
                  {contactCards.map(({ icon: Icon, title, detail, sub, colorClass }) => (
                    <div key={title} className="card p-4 flex items-center gap-4">
                      <div className={`w-11 h-11 ${colorClass} border rounded-xl flex items-center justify-center shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">{detail}</p>
                        <p className="text-xs text-slate-500">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Emergency Helpline Card */}
              <motion.div
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 p-6 text-white"
                variants={fadeUp}
                custom={2}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                    <Droplets className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-red-200 mb-1 flex items-center gap-1.5">
                      <Siren className="w-4 h-4 text-red-200 animate-pulse" /> Emergency Helpline
                    </p>
                    <p className="text-4xl font-black leading-none mb-1">1910</p>
                    <p className="text-red-200 text-sm">Available 24/7 for blood emergencies</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="section bg-slate-50">
        <div className="container-wide max-w-3xl mx-auto">
          <motion.div className="text-center mb-10" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-red-600 bg-red-50 border border-red-200/70 px-4 py-2 rounded-full mb-4">
              Common Questions
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Frequently Asked Questions</h2>
          </motion.div>

          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                className="card overflow-hidden"
                variants={fadeUp}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left group cursor-pointer"
                >
                  <span className="text-sm font-semibold text-slate-800 group-hover:text-slate-900 transition-colors">{faq.q}</span>
                  <div className="shrink-0 ml-3">
                    {openFaq === i
                      ? <ChevronUp className="w-4 h-4 text-red-500" />
                      : <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    }
                  </div>
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="text-sm text-slate-600 leading-relaxed border-t border-slate-100 px-5 py-4">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
