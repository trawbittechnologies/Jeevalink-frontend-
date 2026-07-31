import { Link } from 'react-router-dom';
import { Heart, Phone, Mail, MapPin, ArrowRight, Shield, Clock, Globe } from 'lucide-react';
import JeevaLinkLogo from './JeevaLinkLogo.jsx';

/* ── Inline Social SVGs (lucide-react removed these) ── */
const IconFacebook = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);
const IconInstagram = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
  </svg>
);
const IconTwitter = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);
const IconYoutube = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12z"/>
  </svg>
);
const IconLinkedin = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zm2-6a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/>
  </svg>
);

/* ── Link Data ──────────────────────────────────── */
const platformLinks = [
  { to: '/', label: 'Home' },
  { to: '/donor/search', label: 'Find Donors' },
  { to: '/requests', label: 'Blood Requests' },
  { to: '/register', label: 'Register as Donor' },
];

const companyLinks = [
  { to: '/about', label: 'About Us' },
  { to: '/contact', label: 'Contact Us' },
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms of Service' },
];

const socialLinks = [
  { Icon: IconFacebook, label: 'Facebook', href: '#' },
  { Icon: IconInstagram, label: 'Instagram', href: '#' },
  { Icon: IconTwitter, label: 'Twitter / X', href: '#' },
  { Icon: IconYoutube, label: 'YouTube', href: '#' },
  { Icon: IconLinkedin, label: 'LinkedIn', href: '#' },
];

const bloodGroups = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'];

/* ── Footer Component ───────────────────────────── */
export default function Footer() {
  return (
    <footer style={{ background: '#fff', borderTop: '1.5px solid rgba(0,0,0,0.07)', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── CTA Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
        padding: '48px 32px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* decorative circles */}
        <div style={{
          position: 'absolute', top: -80, right: -80,
          width: 300, height: 300, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: -60,
          width: 200, height: 200, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.7)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Heart size={13} fill="currentColor" /> Every Donation Matters
            </p>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1 }}>
              Ready to save a life today?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem', marginTop: 10, maxWidth: 420, lineHeight: 1.6 }}>
              Join thousands of heroes across India. Register as a donor in under 2 minutes.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <Link to="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 28px', background: '#fff', color: '#DC2626',
              fontWeight: 800, fontSize: 14, borderRadius: 12,
              textDecoration: 'none', transition: 'all 0.22s',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              whiteSpace: 'nowrap',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)'; }}
            >
              Become a Donor <ArrowRight size={16} />
            </Link>
            <Link to="/requests" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '13px 26px', background: 'rgba(255,255,255,0.15)',
              border: '1.5px solid rgba(255,255,255,0.4)',
              color: '#fff', fontWeight: 700, fontSize: 14, borderRadius: 12,
              textDecoration: 'none', transition: 'all 0.22s',
              whiteSpace: 'nowrap', backdropFilter: 'blur(8px)',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
            >
              Request Blood
            </Link>
          </div>
        </div>
      </div>

      {/* ── Blood Groups Strip ── */}
      <div style={{ background: '#FFF5F5', borderBottom: '1px solid rgba(220,38,38,0.1)', padding: '16px 32px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#DC2626', whiteSpace: 'nowrap', marginRight: 4 }}>
            All Groups Covered:
          </span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {bloodGroups.map(bg => (
              <span key={bg} style={{
                padding: '4px 12px', background: '#fff',
                border: '1.5px solid rgba(220,38,38,0.25)',
                borderRadius: 8, fontSize: 12, fontWeight: 900,
                color: '#DC2626', letterSpacing: '0.03em',
              }}>
                {bg}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Footer Grid ── */}
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '60px 32px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 48 }}>

          {/* Brand Column */}
          <div style={{ gridColumn: 'span 1' }}>
            {/* Logo */}
            <Link to="/" style={{ display: 'inline-block', textDecoration: 'none', marginBottom: 16 }}>
              <JeevaLinkLogo size={36} textClassName="text-xl" />
            </Link>

            <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.75, marginBottom: 24, maxWidth: 280 }}>
              Connecting blood donors with those in critical need across India.
              Every drop of blood is a precious gift of life.
            </p>

            {/* Trust badges */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {[
                { icon: Shield, text: 'All donors medically verified' },
                { icon: Clock, text: '24/7 emergency response' },
                { icon: Globe, text: 'Available across 28+ cities' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 24, height: 24, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={13} color="#DC2626" />
                  </div>
                  <span style={{ fontSize: 12, color: '#4B5563', fontWeight: 500 }}>{text}</span>
                </div>
              ))}
            </div>

            {/* Social icons */}
            <div style={{ display: 'flex', gap: 8 }}>
              {socialLinks.map(({ Icon, label, href }) => (
                <a key={label} href={href} aria-label={label} style={{
                  width: 36, height: 36,
                  background: '#F9FAFB',
                  border: '1.5px solid rgba(0,0,0,0.08)',
                  borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#6B7280', textDecoration: 'none', transition: 'all 0.2s',
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#DC2626';
                    e.currentTarget.style.borderColor = '#DC2626';
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(220,38,38,0.3)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#F9FAFB';
                    e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)';
                    e.currentTarget.style.color = '#6B7280';
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#9CA3AF', marginBottom: 20, margin: '0 0 20px' }}>
              Platform
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {platformLinks.map((l) => (
                <li key={l.to + l.label}>
                  <Link to={l.to} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 14, color: '#4B5563', textDecoration: 'none',
                    fontWeight: 500, transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = '#DC2626';
                      e.currentTarget.style.gap = '10px';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = '#4B5563';
                      e.currentTarget.style.gap = '6px';
                    }}
                  >
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#DC2626', display: 'inline-block', flexShrink: 0 }} />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#9CA3AF', marginBottom: 20, margin: '0 0 20px' }}>
              Company
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {companyLinks.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 14, color: '#4B5563', textDecoration: 'none',
                    fontWeight: 500, transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = '#DC2626';
                      e.currentTarget.style.gap = '10px';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = '#4B5563';
                      e.currentTarget.style.gap = '6px';
                    }}
                  >
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#DC2626', display: 'inline-block', flexShrink: 0 }} />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact + Emergency */}
          <div>
            <h4 style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#9CA3AF', marginBottom: 20, margin: '0 0 20px' }}>
              Contact
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 32, height: 32, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Mail size={14} color="#DC2626" />
                </div>
                <div>
                  <p style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px' }}>Email</p>
                  <a href="mailto:support@jeevalink.org" style={{ fontSize: 13, color: '#374151', textDecoration: 'none', fontWeight: 500 }}>
                    support@jeevalink.org
                  </a>
                </div>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 32, height: 32, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Phone size={14} color="#DC2626" />
                </div>
                <div>
                  <p style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px' }}>Phone</p>
                  <a href="tel:+919876543210" style={{ fontSize: 13, color: '#374151', textDecoration: 'none', fontWeight: 500 }}>
                    +91 98765 43210
                  </a>
                </div>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 32, height: 32, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MapPin size={14} color="#DC2626" />
                </div>
                <div>
                  <p style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px' }}>Address</p>
                  <p style={{ fontSize: 13, color: '#374151', fontWeight: 500, margin: 0, lineHeight: 1.5 }}>
                    Bengaluru, Karnataka, India
                  </p>
                </div>
              </li>
            </ul>

            {/* Emergency Helpline Card */}
            <div style={{
              background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
              borderRadius: 16, padding: '18px 20px',
              position: 'relative', overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(220,38,38,0.25)',
            }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: '#fff', display: 'inline-block',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
                <p style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.75)', margin: 0 }}>
                  Emergency Helpline
                </p>
              </div>
              <p style={{ fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1, margin: '0 0 4px' }}>
                1910
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', margin: 0, fontWeight: 600 }}>
                Available 24 / 7 · Free of charge
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* ── Stats Strip ── */}
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.07)', borderBottom: '1px solid rgba(0,0,0,0.07)', background: '#F9FAFB', padding: '20px 32px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 0, justifyContent: 'space-around', alignItems: 'center' }}>
          {[
            { value: '12K+', label: 'Registered Donors' },
            { value: '3.5K+', label: 'Lives Saved' },
            { value: '28+', label: 'Cities Covered' },
            { value: '320+', label: 'Partner Hospitals' },
          ].map((s, i) => (
            <div key={s.label} style={{ textAlign: 'center', padding: '8px 24px', borderRight: i < 3 ? '1px solid rgba(0,0,0,0.08)' : 'none' }}>
              <p style={{ fontSize: 22, fontWeight: 900, color: '#DC2626', letterSpacing: '-0.02em', margin: '0 0 2px', lineHeight: 1 }}>
                {s.value}
              </p>
              <p style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div style={{ padding: '20px 32px', background: '#fff' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
            © 2026 JeevaLink. All rights reserved. Made with{' '}
            <Heart size={12} color="#DC2626" fill="#DC2626" style={{ display: 'inline', verticalAlign: 'middle' }} />
            {' '}in India.
          </p>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0, fontWeight: 600, letterSpacing: '0.04em' }}>
            Connecting Life &nbsp;·&nbsp; Sharing Hope &nbsp;·&nbsp; Saving Lives
          </p>
        </div>
      </div>

    </footer>
  );
}
