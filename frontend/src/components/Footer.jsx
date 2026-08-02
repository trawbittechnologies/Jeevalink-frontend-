import { Link } from 'react-router-dom';
import { Heart, Phone, Mail, MapPin, ArrowRight, ShieldCheck, Clock, Building2 } from 'lucide-react';
import JeevaLinkLogo from './JeevaLinkLogo.jsx';

const platformLinks = [
  { to: '/', label: 'Home' },
  { to: '/donor/search', label: 'Find Donors' },
  { to: '/requests', label: 'Blood Requests' },
  { to: '/register', label: 'Register as Donor' },
  { to: '/volunteer-directory', label: 'Block Committee Directory' },
];

const companyLinks = [
  { to: '/about', label: 'About Us' },
  { to: '/contact', label: 'Contact Us' },
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms of Service' },
  { to: '/technical-reports', label: 'Technical Reports' },
];

const bloodGroups = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'];

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 text-slate-800 font-sans selection:bg-red-500 selection:text-white">
      {/* ── CTA Banner ── */}
      <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white py-12 px-6 relative overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 text-center md:text-left">
            <p className="text-xs font-black uppercase tracking-widest text-red-200 flex items-center justify-center md:justify-start gap-2">
              <Heart className="w-3.5 h-3.5 fill-current text-red-200" />
              Every Donation Saves Lives
            </p>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Ready to save a life today?
            </h2>
            <p className="text-red-100 text-xs md:text-sm max-w-lg font-medium">
              Join voluntary donors across all 14 districts of Kerala. Register as a blood donor in under 2 minutes.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/register"
              className="px-6 py-3.5 bg-white hover:bg-red-50 text-red-600 font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <span>Become a Donor</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/requests"
              className="px-6 py-3.5 bg-white/15 hover:bg-white/25 border border-white/40 text-white font-bold text-sm rounded-xl transition-all"
            >
              Request Blood
            </Link>
          </div>
        </div>
      </div>

      {/* ── Blood Groups Strip ── */}
      <div className="bg-red-50/60 border-b border-red-100 py-4 px-6">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-3">
          <span className="text-xs font-black uppercase tracking-wider text-red-600 shrink-0">
            Blood Group Directory:
          </span>
          <div className="flex flex-wrap gap-2">
            {bloodGroups.map((bg) => (
              <Link
                key={bg}
                to={`/donor/search?blood_group=${encodeURIComponent(bg)}`}
                className="px-3 py-1 bg-white border border-red-200 hover:bg-red-600 hover:text-white rounded-lg text-xs font-black text-red-600 transition-colors"
              >
                {bg}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Footer Grid ── */}
      <div className="max-w-6xl mx-auto py-12 px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <JeevaLinkLogo size={36} textClassName="text-xl" />
            </Link>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Connecting voluntary blood donors with patients in urgent need across Kerala—supported by verified DYFI Block Committee coordinators.
            </p>

            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
                <ShieldCheck className="w-4 h-4 text-red-600 shrink-0" />
                <span>Verified Regional Coordinators</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
                <Clock className="w-4 h-4 text-red-600 shrink-0" />
                <span>24/7 Emergency Sourcing</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
                <Building2 className="w-4 h-4 text-red-600 shrink-0" />
                <span>14 Districts of Kerala Covered</span>
              </div>
            </div>
          </div>

          {/* Quick Platform Links */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5">
              {platformLinks.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-xs font-semibold text-slate-600 hover:text-red-600 transition-colors inline-flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Company Links */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
              Resources & Policy
            </h4>
            <ul className="space-y-2.5">
              {companyLinks.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-xs font-semibold text-slate-600 hover:text-red-600 transition-colors inline-flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
              Contact & Helpline
            </h4>
            
            <div className="space-y-3 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-red-600 shrink-0" />
                <Link to="/contact" className="hover:text-red-600 transition-colors">
                  Contact Support Team
                </Link>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-red-600 shrink-0" />
                <span>Kerala, India</span>
              </div>
            </div>

            {/* Emergency Helpline Box */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1 shadow-md">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Kerala Blood Helpline
                </span>
              </div>
              <p className="text-xl font-black text-white tracking-tight">104 / 1910</p>
              <p className="text-[10px] text-slate-400 font-medium">State Emergency Healthcare Helpline</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Copyright Bar ── */}
      <div className="border-t border-slate-100 py-6 px-6 bg-slate-50/50">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          <p className="flex items-center gap-1.5">
            © 2026 JeevaLink. Voluntary blood sourcing platform for Kerala.
          </p>
          <p className="text-slate-400 font-semibold">
            Connecting Donors · Saving Lives · Serving Kerala
          </p>
        </div>
      </div>
    </footer>
  );
}
