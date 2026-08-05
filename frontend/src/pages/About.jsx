import { motion } from 'framer-motion';
import { Heart, Target, Eye, Users, Shield, Award, Droplets, CheckCircle } from 'lucide-react';

const team = [
  { name: 'Athul Reji', role: 'Founder & Developer', blood: 'B+', initials: 'AR', color: 'from-red-500 to-rose-600' },
  { name: 'Priya Menon', role: 'Volunteer Lead', blood: 'O+', initials: 'PM', color: 'from-emerald-500 to-teal-600' },
  { name: 'Kiran Raj', role: 'Operations Head', blood: 'A+', initials: 'KR', color: 'from-blue-500 to-indigo-600' },
  { name: 'Sneha Pillai', role: 'Community Manager', blood: 'O-', initials: 'SP', color: 'from-amber-500 to-orange-600' },
];

const values = [
  { icon: Heart, title: 'Empathy', desc: 'Every request is a life. We treat each one with urgency and deep care.', colorClass: 'bg-red-50 text-red-600 border-red-100' },
  { icon: Shield, title: 'Trust', desc: 'All requests are verified by our trained volunteer network for safety.', colorClass: 'bg-blue-50 text-blue-600 border-blue-100' },
  { icon: Users, title: 'Community', desc: 'We are 12,000+ donors strong, united by the will to save lives.', colorClass: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  { icon: Award, title: 'Recognition', desc: 'Every donor earns JeevaPoints for their life-saving contribution.', colorClass: 'bg-amber-50 text-amber-600 border-amber-100' },
];

const milestones = [
  { value: '2025', label: 'Founded' },
  { value: '12K+', label: 'Active Donors' },
  { value: '4.5K+', label: 'Lives Saved' },
  { value: '28+', label: 'Cities Covered' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function About() {
  return (
    <div className="bg-slate-50 min-h-screen">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-24 bg-gradient-to-br from-white via-red-50/40 to-rose-50/60 border-b border-slate-100">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-100/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-100/20 rounded-full blur-2xl pointer-events-none" />

        <div className="container-wide relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-red-600 bg-red-50 border border-red-200/70 px-4 py-2 rounded-full mb-5">
              <Droplets className="w-3 h-3" />
              About JeevaLink
            </span>
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.08] mb-5 mt-2">
              We <span className="text-primary">Connect</span> Life
            </h1>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
              JeevaLink is India's premier blood donation platform — built by donors, for donors.
              Our mission is simple: <strong className="text-slate-700 font-semibold">no one should die waiting for blood.</strong>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Milestones ── */}
      <section className="bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all border-b">
        <div className="container-wide py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-100 rounded-2xl overflow-hidden border border-slate-100">
            {milestones.map((m, i) => (
              <motion.div
                key={m.label}
                className="bg-white flex flex-col items-center justify-center py-8 px-4 text-center"
                variants={fadeUp}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
              >
                <p className="text-3xl font-black text-slate-900 tracking-tight">{m.value}</p>
                <p className="text-xs font-semibold text-slate-500 mt-1.5 uppercase tracking-wider">{m.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission & Vision ── */}
      <section className="section bg-white">
        <div className="container-wide">
          <motion.div className="text-center mb-12" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-red-600 bg-red-50 border border-red-200/70 px-4 py-2 rounded-full mb-4">
              <Target className="w-3 h-3" />
              Our Direction
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Mission & Vision</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: Target,
                title: 'Our Mission',
                iconClass: 'bg-red-50 text-red-600 border-red-100',
                borderClass: 'border-red-100',
                accentBar: 'from-red-500 to-rose-600',
                text: 'To create a real-time, technology-driven blood donation ecosystem that connects every available donor with every patient in need — instantly, reliably, and at no cost.',
                points: ['Instant real-time matching', 'Verified donor network', 'Zero cost for patients'],
              },
              {
                icon: Eye,
                title: 'Our Vision',
                iconClass: 'bg-blue-50 text-blue-600 border-blue-100',
                borderClass: 'border-blue-100',
                accentBar: 'from-blue-500 to-indigo-500',
                text: 'A world where no preventable death occurs due to unavailability of blood. We envision every district having enough donors registered to meet emergency needs within 30 minutes.',
                points: ['District-level coverage', 'Sub-30min emergency response', 'India-wide expansion'],
              },
            ].map(({ icon: Icon, title, iconClass, accentBar, text, points }, i) => (
              <motion.div
                key={title}
                className="card p-8 overflow-hidden relative"
                variants={fadeUp}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
              >
                {/* Accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accentBar}`} />

                <div className={`w-12 h-12 ${iconClass} rounded-2xl border flex items-center justify-center mb-5`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">{title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm mb-5">{text}</p>
                <ul className="space-y-2">
                  {points.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Core Values ── */}
      <section className="section bg-slate-50">
        <div className="container-wide">
          <motion.div className="text-center mb-12" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-red-600 bg-red-50 border border-red-200/70 px-4 py-2 rounded-full mb-4">
              <Heart className="w-3 h-3" />
              What We Stand For
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Our Core Values</h2>
            <p className="text-slate-500 mt-3 text-sm max-w-md mx-auto leading-relaxed">
              The principles that guide every decision and every life we touch.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <motion.div
                  key={v.title}
                  className="card p-6 text-center group"
                  variants={fadeUp}
                  custom={i}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                >
                  <div className={`w-12 h-12 ${v.colorClass} border rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-2">{v.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{v.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Team ── */}
      <section className="section bg-white">
        <div className="container-wide">
          <motion.div className="text-center mb-12" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-red-600 bg-red-50 border border-red-200/70 px-4 py-2 rounded-full mb-4">
              <Users className="w-3 h-3" />
              The People Behind JeevaLink
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Meet the Team</h2>
            <p className="text-slate-500 mt-3 text-sm">The passionate people who make it all happen.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                className="card p-6 text-center group"
                variants={fadeUp}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${member.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md transition-transform duration-300 group-hover:scale-105`}>
                  <span className="text-white font-black text-xl">{member.initials}</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{member.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5 mb-3">{member.role}</p>
                <span className="inline-block text-xs font-black text-red-600 bg-red-50 border border-red-100 px-3 py-1 rounded-full">
                  {member.blood}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Built with Purpose Banner ── */}
      <section className="py-16 bg-gradient-to-br from-red-600 to-rose-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(255,255,255,0.07)_0%,transparent_60%)] pointer-events-none" />
        <div className="container-wide text-center text-white relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-2xl font-black mb-3 tracking-tight">Built with Purpose</h2>
            <p className="text-red-200 max-w-lg mx-auto text-sm leading-relaxed">
              JeevaLink was born from a personal mission to solve the blood shortage crisis using modern technology.
              Started in 2025, it has grown to serve thousands of donors and patients across India.
            </p>
            <div className="flex flex-wrap justify-center gap-8 mt-10">
              {[['2025', 'Founded'], ['12K+', 'Donors'], ['4.5K+', 'Lives Saved']].map(([v, l]) => (
                <div key={l} className="text-center">
                  <p className="text-3xl font-black">{v}</p>
                  <p className="text-red-300 text-xs font-semibold mt-1 uppercase tracking-wider">{l}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
