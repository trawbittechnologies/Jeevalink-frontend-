import { useState, useEffect, useCallback } from 'react';
import { Trophy, Award, Medal, Crown, Flame, MapPin, Users, Sparkles, RefreshCw, Building2, Droplets, Heart, Zap, Shield } from 'lucide-react';
import api from '../store/api.js';

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState('donors'); // donors, block_committee, meghala_committee, badges
  const [data, setData] = useState({
    highest_donors: [],
    highest_block_committee: [],
    highest_meghala_committee: [],
    badges: []
  });
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await api.get('/leaderboard');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
      // Fallback data if API returns empty
      setData({
        highest_donors: [
          { id: 1, primary_name: 'Rahul V', blood_group: 'O+', district: 'Kozhikode', meghala: 'Kozhikode North', reward_points: 1250, badge: 'Blood Hero' },
          { id: 2, primary_name: 'Anjali Nair', blood_group: 'A+', district: 'Malappuram', meghala: 'Tirur', reward_points: 980, badge: 'Life Saver' },
          { id: 3, primary_name: 'Muhammed Shafi', blood_group: 'B+', district: 'Wayanad', meghala: 'Kalpetta', reward_points: 850, badge: 'Life Saver' },
          { id: 4, primary_name: 'Deepa K', blood_group: 'AB+', district: 'Kannur', meghala: 'Thalassery', reward_points: 620, badge: 'Life Saver' },
          { id: 5, primary_name: 'Arun Kumar', blood_group: 'O-', district: 'Palakkad', meghala: 'Ottapalam', reward_points: 450, badge: 'First Drop' }
        ],
        highest_block_committee: [
          { blockCommitteeName: 'Kozhikode North Block', district: 'Kozhikode', total_points: 8400, total_members: 62 },
          { blockCommitteeName: 'Koduvally Block', district: 'Kozhikode', total_points: 7100, total_members: 54 },
          { blockCommitteeName: 'Manjeri Block', district: 'Malappuram', total_points: 6500, total_members: 48 },
          { blockCommitteeName: 'Kalpetta Block', district: 'Wayanad', total_points: 5900, total_members: 42 }
        ],
        highest_meghala_committee: [
          { meghala: 'Kozhikode North Meghala', district: 'Kozhikode', blockCommitteeName: 'Kozhikode North', total_points: 4200, total_members: 34 },
          { meghala: 'Kalpetta Central Meghala', district: 'Wayanad', blockCommitteeName: 'Kalpetta', total_points: 3800, total_members: 28 },
          { meghala: 'Manjeri Town Meghala', district: 'Malappuram', blockCommitteeName: 'Manjeri', total_points: 3100, total_members: 25 }
        ],
        badges: [
          { points: 100, badge: 'First Drop', description: 'Completed 1st successful donation!' },
          { points: 500, badge: 'Life Saver', description: 'Earned 500 points rescuing lives.' },
          { points: 1000, badge: 'Blood Hero', description: 'Reached 1,000 points milestone.' },
          { points: 2500, badge: 'Red Guardian', description: 'Reached 2,500 points champion status.' },
          { points: 5000, badge: 'Legend Donor', description: 'Attained highest 5,000 points legend tier.' }
        ]
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (active) await fetchLeaderboard();
    })();
    return () => { active = false; };
  }, [fetchLeaderboard]);

  const getRankBadge = (index) => {
    if (index === 0) return <Crown className="w-6 h-6 text-amber-500 fill-amber-500/20 shrink-0" />;
    if (index === 1) return <Medal className="w-6 h-6 text-slate-400 fill-slate-400/20 shrink-0" />;
    if (index === 2) return <Medal className="w-6 h-6 text-amber-700 fill-amber-700/20 shrink-0" />;
    return <span className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0">{index + 1}</span>;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-red-50 border border-red-200 rounded-full text-red-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Trophy className="w-4 h-4 text-red-600" /> Monthly Hall of Fame
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900">JeevaLink Leaderboard & Badges</h1>
            <p className="text-slate-500 text-xs md:text-sm mt-1">
              Recognizing our highest blood donors, highest block committees, and highest meghala committees driving life-saving impact across Kerala.
            </p>
          </div>

          <button 
            onClick={fetchLeaderboard}
            className="px-4 py-2 bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all border hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-2 self-start md:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Rankings
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 pb-2 overflow-x-auto gap-2 md:gap-4 text-xs md:text-sm font-bold">
          <button
            onClick={() => setActiveTab('donors')}
            className={`px-4 py-2.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'donors'
                ? 'bg-red-600 text-white shadow-sm shadow-red-200'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Flame className="w-4 h-4" /> Highest Donor
          </button>

          <button
            onClick={() => setActiveTab('block_committee')}
            className={`px-4 py-2.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'block_committee'
                ? 'bg-red-600 text-white shadow-sm shadow-red-200'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" /> Highest Block Committee
          </button>

          <button
            onClick={() => setActiveTab('meghala_committee')}
            className={`px-4 py-2.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'meghala_committee'
                ? 'bg-red-600 text-white shadow-sm shadow-red-200'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <MapPin className="w-4 h-4" /> Highest Meghala Committee
          </button>

          <button
            onClick={() => setActiveTab('badges')}
            className={`px-4 py-2.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'badges'
                ? 'bg-amber-600 text-white shadow-sm shadow-amber-200'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Award className="w-4 h-4" /> Badge Showcase
          </button>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="py-20 text-center text-slate-500 font-semibold animate-pulse">Loading Leaderboard rankings...</div>
        ) : (
          <div className="space-y-4">
            
            {/* 1. Highest Donors Tab */}
            {activeTab === 'donors' && (
              <div className="bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all border rounded-2xl p-5 md:p-6 space-y-3">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-red-600" /> Top Blood Donors
                </h3>
                {(data.highest_donors || []).length === 0 ? (
                  <p className="text-slate-500 text-center py-8 text-sm">No donor rankings recorded yet.</p>
                ) : (
                  (data.highest_donors || []).map((donor, idx) => (
                    <div 
                      key={donor.id || idx}
                      className={`flex items-center justify-between p-4 rounded-xl border transition ${
                        idx === 0 
                          ? 'bg-amber-50/80 border-amber-200 shadow-sm' 
                          : idx === 1
                          ? 'bg-slate-50 border-slate-200 shadow-xs'
                          : idx === 2
                          ? 'bg-orange-50/50 border-orange-200 shadow-xs'
                          : 'bg-white border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {getRankBadge(idx)}
                        <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 font-black flex items-center justify-center text-red-600 text-xs shrink-0">
                          {donor.blood_group || 'O+'}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">{donor.primary_name || donor.name}</h4>
                          <p className="text-xs text-slate-500 flex items-center gap-2">
                            <span>District: {donor.district || 'Kerala'}</span>
                            {donor.meghala && <span>• {donor.meghala}</span>}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 border border-amber-300 rounded-full text-amber-800 font-bold text-[11px] mb-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" /> {donor.badge || 'First Drop'}
                        </div>
                        <p className="text-xs font-black text-red-600">{donor.reward_points || 100} Points</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 2. Highest Block Committee Tab */}
            {activeTab === 'block_committee' && (
              <div className="bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all border rounded-2xl p-5 md:p-6 space-y-3">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-red-600" /> Highest Block Committees
                </h3>
                {(data.highest_block_committee || []).length === 0 ? (
                  <p className="text-slate-500 text-center py-8 text-sm">No Block Committee rankings recorded yet.</p>
                ) : (
                  (data.highest_block_committee || []).map((b, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all border hover:"
                    >
                      <div className="flex items-center gap-3">
                        {getRankBadge(idx)}
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">{b.blockCommitteeName || 'Central Block'}</h4>
                          <p className="text-xs text-slate-500">
                            District: <span className="text-slate-700 font-semibold">{b.district || 'Kozhikode'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-black text-red-600 text-base">{b.total_points || 1000} Points</span>
                        <p className="text-xs text-slate-500 flex items-center justify-end gap-1 font-medium">
                          <Users className="w-3.5 h-3.5 text-slate-400" /> {b.total_members || 10} Active Volunteers & Members
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 3. Highest Meghala Committee Tab */}
            {activeTab === 'meghala_committee' && (
              <div className="bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all border rounded-2xl p-5 md:p-6 space-y-3">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-red-600" /> Highest Meghala Committees
                </h3>
                {(data.highest_meghala_committee || data.highest_meghala || []).length === 0 ? (
                  <p className="text-slate-500 text-center py-8 text-sm">No Meghala Committee rankings available.</p>
                ) : (
                  (data.highest_meghala_committee || data.highest_meghala || []).map((m, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all border hover:"
                    >
                      <div className="flex items-center gap-3">
                        {getRankBadge(idx)}
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">{m.meghala || 'District Meghala'}</h4>
                          <p className="text-xs text-slate-500">Block: {m.blockCommitteeName || 'Central'} • District: {m.district || 'Kozhikode'}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-black text-amber-600 text-base">{m.total_points || 500} Total Pts</p>
                        <p className="text-xs text-slate-500 flex items-center justify-end gap-1 font-medium">
                          <Users className="w-3.5 h-3.5 text-slate-400" /> {m.total_members || 1} Donors
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 4. Badge Showcase Tab */}
            {activeTab === 'badges' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { points: 100, badge: 'First Drop', Icon: Droplets, color: 'bg-red-50 border-red-200 text-red-700', desc: 'Completed 1st successful donation!' },
                  { points: 500, badge: 'Life Saver', Icon: Heart, color: 'bg-rose-50 border-rose-200 text-rose-700', desc: 'Earned 500 points rescuing lives.' },
                  { points: 1000, badge: 'Blood Hero', Icon: Zap, color: 'bg-amber-50 border-amber-200 text-amber-800', desc: 'Reached 1,000 points milestone.' },
                  { points: 2500, badge: 'Red Guardian', Icon: Shield, color: 'bg-emerald-50 border-emerald-200 text-emerald-800', desc: 'Reached 2,500 points champion status.' },
                  { points: 5000, badge: 'Legend Donor', Icon: Crown, color: 'bg-purple-50 border-purple-200 text-purple-800', desc: 'Attained highest 5,000 points legend tier.' }
                ].map((b, i) => {
                  const BadgeIcon = b.Icon;
                  return (
                    <div key={i} className="p-6 rounded-2xl bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all border hover: transition space-y-3 relative overflow-hidden">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                        <BadgeIcon className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-slate-900">{b.badge}</h4>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${b.color} mt-1`}>
                          {b.points} Reward Points
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{b.description || b.desc}</p>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
