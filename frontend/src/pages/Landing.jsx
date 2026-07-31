import { useEffect, useRef, useState, Fragment } from "react";
import { Link } from "react-router-dom";
import "../jl-landing.css";
import { useAppStore } from "../store/appStore.js";
import { getStorageUrl } from "../store/api.js";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import {
  Heart, Droplets, MapPin, ArrowRight, Shield, Users,
  Activity, Zap, Handshake, Bell, Search, UserPlus,
  Building2, Star, Clock, TrendingUp, Globe,
} from "lucide-react";

/* ── Inline Social Icons ───────────────────────── */
const SocialIcons = {
  Facebook: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  ),
  Instagram: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
  ),
  Twitter: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  Youtube: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12z"/>
    </svg>
  ),
  Linkedin: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zm2-6a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/>
    </svg>
  ),
};

/* ── Animated Counter ─────────────────────────── */
function AnimatedCounter({ target, suffix = "", duration = 2 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const count = useMotionValue(0);
  const rounded = useSpring(count, { duration: duration * 1000 });
  const [display, setDisplay] = useState(0);
  useEffect(() => { if (isInView) count.set(target); }, [isInView, target, count]);
  useEffect(() => rounded.on("change", (v) => setDisplay(Math.round(v))), [rounded]);
  return <span ref={ref}>{display.toLocaleString()}{suffix}</span>;
}

/* ── Motion variants ─────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 36 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { type: "spring", damping: 22, stiffness: 100, delay: i * 0.1 },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  show: (i = 0) => ({
    opacity: 1, scale: 1,
    transition: { type: "spring", damping: 20, stiffness: 90, delay: i * 0.12 },
  }),
};

const slideIn = {
  hidden: { opacity: 0, x: 80 },
  show: (i = 0) => ({
    opacity: 1, x: 0,
    transition: { type: "spring", damping: 20, stiffness: 80, delay: i * 0.08 },
  }),
};

/* ── Data ─────────────────────────────────────── */
const heroStats = [
  { icon: Users, value: "12K+", label: "Active Donors" },
  { icon: Heart, value: "3.5K+", label: "Lives Saved" },
  { icon: MapPin, value: "28+", label: "Cities" },
  { icon: Clock, value: "< 5 min", label: "Avg Response" },
];

const bloodTypes = ["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−"];

const tickerItems = [];

const processSteps = [
  { num: "1", icon: UserPlus, title: "Register", desc: "Sign up as a donor and complete your health profile in minutes." },
  { num: "2", icon: Search, title: "Find or Request", desc: "Search donors instantly or post an emergency blood request." },
  { num: "3", icon: Bell, title: "Get Notified", desc: "Nearest verified donors are alerted and respond in real-time." },
  { num: "4", icon: Heart, title: "Save Lives", desc: "Connect, donate, and make a real difference today." },
];

const impactStats = [
  { icon: Users, value: 12842, suffix: "+", label: "Registered Donors" },
  { icon: Droplets, value: 3587, suffix: "+", label: "Lives Saved" },
  { icon: Building2, value: 320, suffix: "+", label: "Partner Hospitals" },
  { icon: Heart, value: 1150, suffix: "+", label: "Requests Fulfilled" },
];

const features = [
  {
    icon: Zap,
    title: "Real-Time Matching",
    desc: "AI-powered matching connects donors with recipients within seconds. No delays in emergencies.",
  },
  {
    icon: Shield,
    title: "Verified & Safe",
    desc: "All donors are medically verified. Every donation meets strict safety and health standards.",
  },
  {
    icon: MapPin,
    title: "Location-Aware",
    desc: "Find the nearest blood donors using precise GPS-based proximity search across cities.",
  },
];

const collaborators = [];

const ctaVisualCards = [
  { icon: TrendingUp, label: "Lives Saved", value: "4,521", sub: "and counting", accent: true },
  { icon: Globe, label: "Cities Active", value: "28+", sub: "across India", accent: false },
  { icon: Clock, label: "Avg Response", value: "< 5 min", sub: "emergency match", accent: false },
  { icon: Users, label: "Donors Online", value: "1,200+", sub: "right now", accent: true },
];

/* ════════════════════════════════════════════════ */
export default function Landing() {
  const { partners, fetchPartners } = useAppStore();

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const getSocialIconComponent = (platform) => {
    const type = (platform || '').toLowerCase();
    if (type === 'facebook') return SocialIcons.Facebook;
    if (type === 'instagram') return SocialIcons.Instagram;
    if (type === 'youtube') return SocialIcons.Youtube;
    if (type === 'linkedin') return SocialIcons.Linkedin;
    if (type === 'x' || type === 'twitter') return SocialIcons.Twitter;
    return (props) => <Globe className="w-4 h-4" {...props} />;
  };

  const getLogoSrc = (logoPath) => {
    if (!logoPath) return '';
    return getStorageUrl(logoPath) || '';
  };

  const displayPartners = partners && partners.length > 0 ? partners : collaborators;

  return (
    <div className="jl-root">

      {/* HERO */}
      <section className="jl-hero">
        <div className="jl-hero-orb-1" aria-hidden />
        <div className="jl-hero-orb-2" aria-hidden />
        <div className="jl-hero-orb-3" aria-hidden />
        <div className="jl-hero-grid" aria-hidden />

        <div className="jl-container jl-hero-inner">

          <motion.div
            className="jl-hero-tag"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="jl-pulse-dot" />
            Every Drop Counts · Live Requests
          </motion.div>

          <motion.h1
            className="jl-hero-h1"
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            Donate Blood.<br />
            <span className="jl-hero-h1-gradient">Save Lives.</span><br />
            Be a Hero.
          </motion.h1>

          <motion.p
            className="jl-hero-desc"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.26 }}
          >
            JeevaLink connects generous hearts with people in urgent need across India.
            Real-time matching. Verified donors. Life saved.
          </motion.p>

          <motion.div
            className="jl-hero-btns"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Link to="/register" className="jl-btn-red">
              Become a Donor <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/requests" className="jl-btn-ghost">
              Request Blood <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <motion.div
            className="jl-hero-stats"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {heroStats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="jl-hero-stat">
                  <div className="jl-hero-stat-icon">
                    <Icon className="w-4 h-4" style={{ color: "#EF4444" }} />
                  </div>
                  <div>
                    <strong>{s.value}</strong>
                    <span>{s.label}</span>
                  </div>
                </div>
              );
            })}
          </motion.div>

        </div>
      </section>


      {/* EMERGENCY TICKER */}
      <section className="jl-ticker-section">
        <div className="jl-container jl-ticker-inner">
          <div className="jl-ticker-label">
            <span className="jl-pulse-dot" style={{ width: 7, height: 7 }} />
            Live Requests
          </div>
          <div className="jl-ticker-track">
            <div className="jl-ticker-scroll">
              {[...tickerItems, ...tickerItems].map((item, i) => (
                <div key={i} className="jl-ticker-item">
                  <Droplets className="w-3 h-3" style={{ color: "#EF4444" }} />
                  <span>{item.urgency}:</span> {item.type} needed in {item.city}
                  <span style={{ color: "rgba(255,255,255,0.15)", marginLeft: 16 }}>•</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* BLOOD TYPES */}
      <section className="jl-blood-types-section">
        <div className="jl-container">
          <motion.div
            className="jl-section-head"
            style={{ marginBottom: 36 }}
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
          >
            <span className="jl-section-tag">
              <Droplets className="w-3 h-3" /> All Blood Groups
            </span>
            <h2 className="jl-section-h2" style={{ fontSize: "1.8rem" }}>
              We Connect <span className="jl-red">Every Blood Type</span>
            </h2>
          </motion.div>

          <div className="jl-blood-types-grid">
            {bloodTypes.map((type, i) => (
              <motion.div
                key={type}
                className="jl-blood-type-card"
                variants={scaleIn}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
              >
                <div className="jl-blood-type-label">{type}</div>
                <div className="jl-blood-type-sub">Available</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="jl-section jl-how-section">
        <div className="jl-container">
          <motion.div
            className="jl-section-head"
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
          >
            <span className="jl-section-tag">
              <Zap className="w-3 h-3" /> How It Works
            </span>
            <h2 className="jl-section-h2">
              Simple Steps. <span className="jl-red">Big Impact.</span>
            </h2>
            <p className="jl-section-p">Your kindness can save someone's life in four easy steps.</p>
          </motion.div>

          <div className="jl-steps-row">
            {processSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <Fragment key={step.num}>
                  <motion.div
                    className="jl-process-step"
                    variants={fadeUp}
                    custom={i}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-30px" }}
                  >
                    <div className="jl-process-icon-wrap">
                      <div className="jl-process-icon">
                        <Icon className="w-7 h-7" style={{ color: "#EF4444" }} />
                      </div>
                      <div className="jl-process-num">{step.num}</div>
                    </div>
                    <h4 className="jl-process-title">{step.title}</h4>
                    <p className="jl-process-desc">{step.desc}</p>
                  </motion.div>
                  {i < processSteps.length - 1 && (
                    <div className="jl-step-connector" aria-hidden>
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  )}
                </Fragment>
              );
            })}
          </div>

          <motion.div
            className="jl-safety-note"
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
          >
            <Shield className="w-5 h-5 flex-shrink-0" style={{ color: "#EF4444" }} />
            <p>Your safety is our priority. We verify all donors and requests to ensure a trusted and secure community across India.</p>
          </motion.div>
        </div>
      </section>

      {/* IMPACT */}
      <section className="jl-section jl-impact-section">
        <div className="jl-container jl-impact-inner">
          <motion.div
            className="jl-impact-left"
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
          >
            <span className="jl-section-tag">
              <Activity className="w-3 h-3" /> Our Impact
            </span>
            <h2 className="jl-impact-h2">
              Real People.<br />
              <span className="jl-red">Real Impact.</span>
            </h2>
            <p className="jl-impact-desc">
              Every donation creates a ripple of hope. Together, we're building a healthier and stronger India — one drop at a time.
            </p>
            <Link to="/about" className="jl-btn-red jl-btn-sm">
              Join Our Mission <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <div className="jl-impact-stats">
            {impactStats.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.label}
                  className="jl-impact-card"
                  variants={fadeUp}
                  custom={i}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-30px" }}
                >
                  <div className="jl-impact-card-icon">
                    <Icon className="w-5 h-5" style={{ color: "#EF4444" }} />
                  </div>
                  <div className="jl-impact-card-num">
                    <AnimatedCounter target={s.value} suffix={s.suffix} />
                  </div>
                  <div className="jl-impact-card-label">{s.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="jl-section jl-features-section">
        <div className="jl-container">
          <motion.div
            className="jl-section-head"
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
          >
            <span className="jl-section-tag">
              <Star className="w-3 h-3" /> Why JeevaLink
            </span>
            <h2 className="jl-section-h2">
              Built for <span className="jl-red">Emergencies.</span>
            </h2>
            <p className="jl-section-p">
              Advanced tools designed to save lives faster and smarter.
            </p>
          </motion.div>

          <div className="jl-features-grid">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  className="jl-feature-card"
                  variants={fadeUp}
                  custom={i}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                >
                  <div className="jl-feature-icon">
                    <Icon className="w-6 h-6" style={{ color: "#EF4444" }} />
                  </div>
                  <h3 className="jl-feature-title">{f.title}</h3>
                  <p className="jl-feature-desc">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TRUSTED PARTNERS & COLLABORATORS */}
      <section className="jl-section jl-partners-section">
        <div className="jl-container">
          <motion.div
            className="jl-section-head"
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <span className="jl-section-tag">
              <Handshake className="w-3 h-3" /> Trusted Partners
            </span>
            <h2 className="jl-section-h2">
              Our <span className="jl-red">Collaborators</span>
            </h2>
            <p className="jl-section-p">
              We team up with prominent youth, student, and health organizations to expand voluntary blood donation registries and coordinate rapid emergency responses.
            </p>
          </motion.div>

          <div className="jl-partners-grid">
            {displayPartners.map((c, i) => {
              const hasCustomLogoComponent = typeof c.Logo === 'function';
              const socialLink = c.socialMediaLink || c.socialLink || '#';
              const socialPlatform = c.socialMediaType || c.socialPlatform || 'link';
              const SocialIcon = getSocialIconComponent(socialPlatform);

              return (
                <motion.div
                  key={c._id || c.name || i}
                  className="jl-partner-card"
                  variants={slideIn}
                  custom={i}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                >
                  <div className="jl-partner-logo-container">
                    {hasCustomLogoComponent ? (
                      <c.Logo />
                    ) : (
                      <img
                        src={getLogoSrc(c.logo)}
                        alt={c.name}
                        className="w-14 h-14 object-cover rounded-full shadow-sm"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHJ4PSIxNSIgZmlsbD0iI0YzRjRGNiIvPjx0ZXh0IHg9IjMwIiB5PSIzNSIgZmlsbD0iIzlDQTNBRiIgZm9udC1zaXplPSIxMiIgZm9udC13ZWlnaHQ9ImJvbGQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkxPR088L3RleHQ+PC9zdmc+';
                        }}
                      />
                    )}
                  </div>
                  <h3 className="jl-partner-name">{c.name}</h3>
                  <a href={socialLink} target="_blank" rel="noopener noreferrer" className="jl-partner-social-link" aria-label={`${c.name} ${socialPlatform}`}>
                    <SocialIcon />
                  </a>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA — Be The Reason (redesigned) */}
      <section className="jl-cta-section">
        <div className="jl-container jl-cta-inner">
          {/* Left */}
          <motion.div
            className="jl-cta-left"
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
          >
            <div className="jl-cta-tag">
              <span className="jl-pulse-dot" />
              Be the Reason
            </div>
            <h2 className="jl-cta-h2">
              Be the reason<br />
              <span className="jl-cta-red-word">someone lives.</span>
            </h2>
            <p className="jl-cta-p">
              Join our growing community of heroes across India and make a life-saving difference starting today.
            </p>
            <div className="jl-cta-btns">
              <Link to="/register" className="jl-btn-red">Become a Donor <ArrowRight className="w-4 h-4" /></Link>
              <Link to="/requests" className="jl-btn-outline-dark">Request Blood</Link>
            </div>

            <div className="jl-social-row">
              <span className="jl-social-label">Follow:</span>
              {[
                { Icon: SocialIcons.Facebook, label: "Facebook" },
                { Icon: SocialIcons.Instagram, label: "Instagram" },
                { Icon: SocialIcons.Twitter, label: "X / Twitter" },
                { Icon: SocialIcons.Youtube, label: "YouTube" },
                { Icon: SocialIcons.Linkedin, label: "LinkedIn" },
              ].map(({ Icon, label }) => (
                <a key={label} href="#" className="jl-social-icon" aria-label={label}>
                  <Icon />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Right — stat cards */}
          <motion.div
            className="jl-cta-right"
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, type: "spring", damping: 20 }}
          >
            <div className="jl-cta-cards-grid">
              {ctaVisualCards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.label}
                    className={`jl-cta-stat-card${card.accent ? " jl-cta-stat-card--accent" : ""}`}
                    variants={scaleIn}
                    custom={i}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                  >
                    <div className="jl-cta-stat-card-icon">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="jl-cta-stat-card-value">{card.value}</div>
                    <div className="jl-cta-stat-card-label">{card.label}</div>
                    <div className="jl-cta-stat-card-sub">{card.sub}</div>
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              className="jl-cta-quote"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <div className="jl-cta-quote-mark">"</div>
              <p>One donation can save up to <strong>three lives</strong>. Be the reason someone sees tomorrow.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
