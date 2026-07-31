import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore.js';
import { useAuthStore } from '../store/authStore.js';
import { Map, List, Search, Award, MessageSquare, Compass, Eye, ShieldCheck } from 'lucide-react';
import MapContainer from '../components/MapContainer.jsx';

export default function FindDonors() {
  const { user } = useAuthStore();
  const { 
    donors, 
    searchDonors, 
    requests, 
    fetchRequests,
    searchRadius, 
    setSearchRadius, 
    selectedBloodGroup, 
    setSelectedBloodGroup,
    triggerToast 
  } = useAppStore();

  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [selectedDonor, setSelectedDonor] = useState(null);

  useEffect(() => {
    fetchRequests();
    // Default search based on user's own blood group or B+
    const initialBg = user ? user.bloodGroup : 'O+';
    setSelectedBloodGroup(initialBg);
  }, [fetchRequests, setSelectedBloodGroup, user]);

  // Run search when variables change
  useEffect(() => {
    if (selectedBloodGroup) {
      searchDonors(selectedBloodGroup, searchRadius, user?._id);
    }
  }, [selectedBloodGroup, searchRadius, searchDonors, user]);

  const handleContactDonor = (donor) => {
    setSelectedDonor(donor);
  };

  const handleSendRequestAlert = (donor) => {
    triggerToast(`Simulation: Emergency request notification sent to ${donor.fullName}!`, 'success');
    setSelectedDonor(null);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 px-6 pt-6 pb-24 select-none">
      <div className="max-w-7xl mx-auto">
        {/* Top Filter Block */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm mb-5">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100 mb-4 flex items-center gap-1.5">
          <Compass className="w-5 h-5 text-primary" /> Match Filters
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase mb-1.5 pl-0.5">Blood Group</label>
            <select
              value={selectedBloodGroup}
              onChange={(e) => setSelectedBloodGroup(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-zinc-100"
            >
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                <option key={bg} value={bg}>{bg} Needed</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase mb-1.5 pl-0.5">Search Area</label>
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-zinc-100 pr-1">
              <span>{searchRadius} km</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={searchRadius}
              onChange={(e) => setSearchRadius(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 dark:bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-primary mt-3"
            />
          </div>
        </div>

        {/* View Switcher Toggles */}
        <div className="flex border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-1 bg-slate-50/50 dark:bg-zinc-950/20 md:hidden">
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              viewMode === 'list' 
                ? 'bg-white dark:bg-zinc-800 text-slate-955 dark:text-zinc-100 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400'
            }`}
          >
            <List className="w-4 h-4" /> Match Feed
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              viewMode === 'map' 
                ? 'bg-white dark:bg-zinc-800 text-slate-955 dark:text-zinc-100 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400'
            }`}
          >
            <Map className="w-4 h-4" /> Live Map Overlay
          </button>
        </div>
      </div>

      {/* Desktop Grid Split Layout */}
      <div className="hidden md:grid md:grid-cols-12 md:gap-6 md:items-start animate-fade-in">
        {/* Left Side: Donor Matches List (col-span-7) */}
        <div className="md:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-extrabold text-slate-955 dark:text-zinc-100 flex items-center gap-1.5">
              AI Matching Results
              <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">
                {donors.length} found
              </span>
            </h4>
            <span className="text-[10px] text-slate-400 dark:text-zinc-550 font-semibold">Sorted by Score</span>
          </div>

          {donors.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-10 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-3 text-slate-350 dark:text-zinc-700" />
              <p className="text-sm font-semibold">No compatible donors found nearby.</p>
              <p className="text-xs text-slate-500 dark:text-zinc-550 mt-1">Try expanding the matching radius slider.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {donors.map((donor) => {
                return (
                  <div
                    key={donor._id}
                    className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1.5">
                        <h4 className="text-sm font-bold text-slate-955 dark:text-zinc-100 truncate">
                          {donor.fullName}
                        </h4>
                        <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full shrink-0">
                          {donor.bloodGroup}
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2 flex flex-col gap-1 font-medium">
                        <span>📍 {donor.city || 'Indiranagar'}</span>
                        <span>🛣️ {donor.distance} km away</span>
                      </p>
                      <div className="mt-2.5">
                        <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-lg border ${
                          donor.eligibilityStatus === 'Eligible'
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-100/80 dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-900/50'
                            : donor.eligibilityStatus === 'Ineligible'
                            ? 'text-red-700 bg-red-50 border-red-100/80 dark:text-red-450 dark:bg-red-950/30 dark:border-red-900/50'
                            : 'text-gray-655 bg-slate-50 border-slate-200 dark:text-zinc-400 dark:bg-zinc-800 dark:border-zinc-700'
                        }`}>
                          {donor.eligibilityStatus || 'Pending Check'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-zinc-800/80">
                      <div className="flex items-center gap-1 bg-red-500/10 dark:bg-red-500/20 text-primary px-2 py-0.5 rounded-lg border border-red-500/10">
                        <Award className="w-3 h-3 fill-primary" />
                        <span className="text-[10px] font-black">{donor.matchScore}%</span>
                      </div>
                      
                      <button
                        onClick={() => handleContactDonor(donor)}
                        className="text-xs font-extrabold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        Contact <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Map sticky Panel (col-span-5) */}
        <div className="md:col-span-5 sticky top-24 space-y-4">
          <MapContainer 
            donors={donors} 
            requests={requests.filter(r => r.status === 'Pending')} 
            center={user?.coordinates || { lat: 12.9716, lng: 77.5946 }}
            radius={searchRadius}
          />
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/60 rounded-2xl p-3 text-[10px] text-slate-400 font-medium shadow-sm">
            🚩 Map coordinates simulated in Bengaluru. Click markers to check distances and match compatibility indexes.
          </div>
        </div>
      </div>

      {/* Mobile Tab-based Layout */}
      <div className="md:hidden space-y-4">
        {viewMode === 'map' ? (
          <div className="space-y-4">
            <MapContainer 
              donors={donors} 
              requests={requests.filter(r => r.status === 'Pending')} 
              center={user?.coordinates || { lat: 12.9716, lng: 77.5946 }}
              radius={searchRadius}
            />
            <div className="bg-slate-100 dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800 rounded-2xl p-3 text-[10px] text-slate-400 font-medium">
              🚩 Map coordinates simulated in Bengaluru. Click markers to check distances and match compatibility indexes.
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-extrabold text-slate-955 dark:text-zinc-100 flex items-center gap-1.5">
                AI Matching Results
                <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {donors.length} found
                </span>
              </h4>
              <span className="text-[10px] text-slate-400 dark:text-zinc-550 font-semibold">Sorted by Score</span>
            </div>

            {donors.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-10 text-center text-slate-400">
                <Search className="w-8 h-8 mx-auto mb-3 text-slate-350 dark:text-zinc-700" />
                <p className="text-sm font-semibold">No compatible donors found nearby.</p>
                <p className="text-xs text-slate-500 mt-1">Try expanding the matching radius slider.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {donors.map((donor) => {
                  return (
                    <div
                      key={donor._id}
                      className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 transition-colors flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-slate-955 dark:text-white truncate">
                            {donor.fullName}
                          </h4>
                          <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full shrink-0">
                            {donor.bloodGroup}
                          </span>
                        </div>
                        
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-2 font-medium">
                          <span>📍 {donor.city || 'Indiranagar'}</span>
                          <span>•</span>
                          <span>🛣️ {donor.distance} km</span>
                        </p>
                        <div className="mt-2">
                          <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-lg border ${
                            donor.eligibilityStatus === 'Eligible'
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-100/80 dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-900/50'
                              : donor.eligibilityStatus === 'Ineligible'
                              ? 'text-red-700 bg-red-50 border-red-100/80 dark:text-red-450 dark:bg-red-950/30 dark:border-red-900/50'
                              : 'text-gray-655 bg-slate-50 border-slate-200 dark:text-zinc-400 dark:bg-zinc-800 dark:border-zinc-700'
                          }`}>
                            {donor.eligibilityStatus || 'Pending Check'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0 gap-3">
                        <div className="flex items-center gap-1 bg-red-500/10 dark:bg-red-500/20 text-primary px-2.5 py-1 rounded-xl border border-red-500/15">
                          <Award className="w-3.5 h-3.5 fill-primary" />
                          <span className="text-xs font-black">{donor.matchScore}%</span>
                        </div>
                        
                        <button
                          onClick={() => handleContactDonor(donor)}
                          className="text-xs font-extrabold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          Contact <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Donor Profile Detail Modal overlay */}
      {selectedDonor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-6 text-center animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative">
            <div className="w-14 h-14 bg-red-50 dark:bg-red-950/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100 dark:border-red-900">
              <span className="text-xl font-black text-primary">{selectedDonor.bloodGroup}</span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100">{selectedDonor.fullName}</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1.5 justify-center">
              <span>📍 {selectedDonor.city}, {selectedDonor.district}</span>
              <span>•</span>
              <span>🛣️ {selectedDonor.distance} km</span>
            </p>

            <div className="my-5 bg-slate-50 dark:bg-zinc-950 rounded-2xl p-4 border border-slate-100 dark:border-zinc-800/60 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Donation Status:</span>
                <span className={`font-bold ${selectedDonor.availableForDonation ? 'text-emerald-600' : 'text-amber-500'}`}>
                  {selectedDonor.availableForDonation ? 'Available Now' : 'Not Available'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Eligibility:</span>
                <span className={`font-bold ${
                  selectedDonor.eligibilityStatus === 'Eligible'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : selectedDonor.eligibilityStatus === 'Ineligible'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-500 dark:text-zinc-400'
                }`}>
                  {selectedDonor.eligibilityStatus || 'Pending Check'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Last Donation:</span>
                <span className="font-bold text-slate-800 dark:text-zinc-100">
                  {selectedDonor.lastDonationDate || 'No record (First donation!)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Weight:</span>
                <span className="font-bold text-slate-800 dark:text-zinc-100">{selectedDonor.weight} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Medical Conditions:</span>
                <span className="font-bold text-slate-850 dark:text-zinc-350">{selectedDonor.medicalConditions || 'None reported'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Lives Saved Score:</span>
                <span className="font-bold text-primary flex items-center gap-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> {selectedDonor.livesSaved || 0} lives
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedDonor(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-100 font-semibold rounded-xl transition-colors cursor-pointer text-xs"
              >
                Close
              </button>
              <button
                onClick={() => handleSendRequestAlert(selectedDonor)}
                className="flex-2 flex items-center justify-center gap-1.5 py-2.5 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl shadow-sm transition-colors cursor-pointer text-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Request Blood
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
