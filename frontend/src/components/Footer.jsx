import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Droplet, Activity, Mail, MapPin, Quote } from 'lucide-react';
import JeevaLinkLogo from './JeevaLinkLogo.jsx';

const platformLinks = [
  { to: '/', label: 'Home' },
  { to: '/donor/search', label: 'Find Donors' },
  { to: '/requests', label: 'Blood Requests' },
  { to: '/volunteer-directory', label: 'Directory' },
];

const companyLinks = [
  { to: '/about', label: 'About Us' },
  { to: '/contact', label: 'Contact Us' },
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms of Service' },
  { to: '/technical-reports', label: 'Technical Reports' },
];

const bloodGroups = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'];

const quotes = [
  "The blood you donate gives someone another chance at life.",
  "A single pint can save three lives. Be the reason someone smiles.",
  "Tears of a mother cannot save her child. But your blood can.",
  "Bring a life back to power. Make blood donation your responsibility."
];

export default function Footer() {
  const [currentQuote, setCurrentQuote] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <footer className="relative bg-white text-slate-800 font-sans border-t border-slate-100 overflow-hidden selection:bg-red-500 selection:text-white mt-12">
      {/* ── Background Blood Motif ── */}
      <div className="absolute top-0 right-0 -mr-32 -mt-32 opacity-[0.03] pointer-events-none">
        <Droplet className="w-[30rem] h-[30rem] text-red-600 fill-current" />
      </div>

      {/* ── Quote Slider Area ── */}
      <div className="max-w-5xl mx-auto px-6 pt-20 pb-16 relative z-10">
        <div className="relative bg-white border border-red-100 rounded-3xl p-10 md:p-16 shadow-[0_10px_40px_-10px_rgba(220,38,38,0.1)] overflow-hidden flex flex-col items-center justify-center text-center min-h-[300px]">
          
          <div className="absolute top-6 left-6 text-red-50 opacity-80 pointer-events-none">
            <Quote className="w-24 h-24 rotate-180" />
          </div>
          <div className="absolute bottom-6 right-6 text-red-50 opacity-80 pointer-events-none">
            <Quote className="w-24 h-24" />
          </div>

          <div className="relative z-10 w-full h-[140px] flex items-center justify-center">
            {quotes.map((quote, index) => (
              <div 
                key={index}
                className={`absolute w-full px-4 transition-all duration-700 ease-out ${
                  index === currentQuote 
                    ? 'opacity-100 translate-y-0 scale-100' 
                    : 'opacity-0 translate-y-8 scale-95 pointer-events-none'
                }`}
              >
                <h3 className="text-2xl md:text-4xl font-black text-red-600 tracking-tight leading-snug">
                  "{quote}"
                </h3>
              </div>
            ))}
          </div>
          
          {/* Progress / Indicators & Action */}
          <div className="flex flex-col md:flex-row items-center justify-between w-full mt-12 relative z-10 border-t border-red-50 pt-8">
            <div className="flex items-center gap-3 mb-6 md:mb-0">
              {quotes.map((_, index) => (
                <button 
                  key={index}
                  onClick={() => setCurrentQuote(index)}
                  className={`transition-all duration-500 rounded-full h-1.5 ${
                    index === currentQuote 
                      ? 'w-10 bg-red-600' 
                      : 'w-2 bg-red-100 hover:bg-red-300'
                  }`}
                  aria-label={`View quote ${index + 1}`}
                />
              ))}
            </div>
            

          </div>
        </div>
      </div>

      {/* ── Main Footer Grid ── */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8">
          {/* Brand Column */}
          <div className="md:col-span-4 space-y-6">
            <Link to="/" className="inline-block">
              <JeevaLinkLogo size={42} textClassName="text-2xl" />
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed max-w-sm">
              Bridging the gap between voluntary blood donors and patients in urgent need. Verified, fast, and free platform for Kerala.
            </p>
            
            <div className="flex flex-wrap gap-2 pt-2">
              {bloodGroups.map((bg) => (
                <Link
                  key={bg}
                  to={`/donor/search?blood_group=${encodeURIComponent(bg)}`}
                  className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
                  title={`Find ${bg} Donors`}
                >
                  {bg}
                </Link>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div className="md:col-span-2 md:col-start-6 space-y-6">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Platform
            </h4>
            <ul className="space-y-3">
              {platformLinks.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-sm text-slate-500 hover:text-red-600 transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2 space-y-6">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              Resources
            </h4>
            <ul className="space-y-3">
              {companyLinks.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-sm text-slate-500 hover:text-red-600 transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details */}
          <div className="md:col-span-3 space-y-6">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Emergency Contact
            </h4>
            
            <div className="bg-red-50/50 rounded-2xl p-5 border border-red-100 space-y-4 relative overflow-hidden">
              <Heart className="absolute -right-4 -bottom-4 w-24 h-24 text-red-100 opacity-50" />
              
              <div className="space-y-2 relative z-10">
                <a href="mailto:support@jeevalink.in" className="flex items-center gap-3 text-sm text-slate-600 hover:text-red-600 transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-red-100 group-hover:border-red-300">
                    <Mail className="w-4 h-4 text-red-500" />
                  </div>
                  support@jeevalink.in
                </a>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-red-100">
                    <MapPin className="w-4 h-4 text-red-500" />
                  </div>
                  Kerala, India
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Copyright Bar ── */}
      <div className="border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} JeevaLink. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            Made with <Heart className="w-4 h-4 text-red-500 fill-current animate-pulse" /> for Kerala
          </div>
        </div>
      </div>
    </footer>
  );
}
