import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/appStore.js';
import { useAuthStore } from '../store/authStore.js';
import RequestCard from '../components/RequestCard.jsx';
import Modal from '../components/Modal.jsx';
import { Plus, SlidersHorizontal, Siren, Filter, MapPin, Search, Loader2, Navigation, X as XIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import PosterModal from '../components/PosterModal.jsx';
import MapLibreContainer from '../components/MapLibreContainer.jsx';
import LocationSearchInput from '../components/LocationSearchInput.jsx';


const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCIES = ['Immediate', 'Critical', 'Moderate'];

export default function BloodRequests() {
  const { requests, fetchRequests, createRequest, triggerToast } = useAppStore();
  const { user } = useAuthStore();
  const [filterBG, setFilterBG] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('');
  const [filterStatus, setFilterStatus] = useState('Active');
  const [showModal, setShowModal] = useState(false);
  const [mapPos, setMapPos] = useState(null);
  const [mapPickedAddress, setMapPickedAddress] = useState('');
  const [mapSearch, setMapSearch] = useState('');
  const [mapSearchResults, setMapSearchResults] = useState([]);
  const [mapSearchLoading, setMapSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [form, setForm] = useState({
    patientName: '',
    bloodGroup: 'B+',
    hospitalName: '',
    city: '',
    district: '',
    urgencyLevel: 'Moderate',
    unitsRequired: 1,
    contactNumber: user?.mobile || '',
  });

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const filtered = requests.filter((r) => {
    let matches = (!filterBG || r.bloodGroup === filterBG) &&
                  (!filterUrgency || r.urgencyLevel === filterUrgency);
    if (filterStatus && filterStatus !== 'All') {
      if (filterStatus === 'Active') {
        matches = matches && ['Pending', 'Waiting', 'Accepted'].includes(r.status);
      } else {
        matches = matches && r.status === filterStatus;
      }
    }
    return matches;
  });

  const [posterReq, setPosterReq] = useState(null);

  const handleMapPicked = useCallback((geo) => {
    const addr = geo.address || {};
    const placeName =
      addr.amenity || addr.hospital || addr.clinic ||
      addr.building || geo.name || '';
    const city = addr.city || addr.town || addr.county || '';
    const road = addr.road || addr.street || '';
    const suburb = addr.suburb || addr.village || addr.town || addr.city_district || '';
    const fullAddr = [road, suburb, city, addr.state].filter(Boolean).join(', ');
    setMapPickedAddress(geo.display_name || fullAddr);
    if (placeName) setForm(f => ({ ...f, hospitalName: placeName }));
    if (city) setForm(f => ({ ...f, city }));
  }, []);

  const handleMapSearch = useCallback(async (q) => {
    if (!q || q.length < 3) { setMapSearchResults([]); return; }
    setMapSearchLoading(true);
    setMapSearchResults(await forwardGeocode(q));
    setMapSearchLoading(false);
    setShowSearchDropdown(true);
  }, []);

  const selectResult = useCallback(async (r) => {
    const lat = parseFloat(r.lat), lng = parseFloat(r.lon);
    setMapPos({ lat, lng });
    setMapSearch(r.display_name);
    setShowSearchDropdown(false);
    setMapSearchResults([]);
    const geo = await reverseGeocode(lat, lng);
    if (geo) handleMapPicked(geo);
  }, [handleMapPicked]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patientName || !form.hospitalName) {
      triggerToast('Please fill all required fields.', 'warning');
      return;
    }
    const payload = { ...form, unitsRequired: Number(form.unitsRequired) };
    if (mapPos) { payload.latitude = mapPos.lat; payload.longitude = mapPos.lng; }
    const res = await createRequest(payload);
    if (res.success) {
      setShowModal(false);
      setMapPos(null);
      setMapPickedAddress('');
      setMapSearch('');
      const newReq = {
        patient_name: form.patientName,
        blood_group: form.bloodGroup,
        units_required: form.unitsRequired,
        hospital_name: form.hospitalName,
        venue: form.hospitalName,
        location: form.city || form.district || 'Kerala',
        contact_phone: form.contactNumber,
        urgency_level: form.urgencyLevel,
        request_id: res.data?.id || res.data?._id || `JL-${Date.now().toString().slice(-4)}`
      };
      setPosterReq(newReq);
      setForm({ ...form, patientName: '', hospitalName: '', city: '', district: '' });
      triggerToast('Blood request posted successfully! Download poster below.', 'success');
    }
  };

  const sosCount = requests.filter((r) => r.urgencyLevel === 'Immediate' && ['Pending', 'Waiting', 'Accepted'].includes(r.status)).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Blood Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Active requests across India — respond and save lives</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-2xl shadow-xl shadow-red-200 transition-all text-sm"
        >
          <Plus className="w-4 h-4" /> Post Request
        </button>
      </div>

      {/* SOS emergency banner */}
      {sosCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="hero-gradient rounded-2xl p-4 flex items-center gap-4 text-white"
        >
          <div className="w-10 h-10 bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all/20 rounded-xl flex items-center justify-center animate-heartbeat shrink-0">
            <Siren className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-red-200 flex items-center gap-1">
              <Siren className="w-3.5 h-3.5 animate-pulse text-red-200" /> Emergency Alert
            </p>
            <p className="font-bold">{sosCount} immediate SOS request{sosCount > 1 ? 's' : ''} need urgent response!</p>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <SlidersHorizontal className="w-4 h-4 text-gray-400 shrink-0" />

          {/* Blood Group filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterBG('')}
              className={`px-3 py-1 text-xs font-bold rounded-xl border transition-all ${!filterBG ? 'bg-primary text-white border-primary' : 'bg-white text-gray-500 border-slate-200 hover:border-red-200'}`}
            >All Groups</button>
            {BLOOD_GROUPS.map((bg) => (
              <button
                key={bg}
                onClick={() => setFilterBG(filterBG === bg ? '' : bg)}
                className={`px-3 py-1 text-xs font-bold rounded-xl border transition-all ${filterBG === bg ? 'bg-primary text-white border-primary shadow-md shadow-red-200' : 'bg-white text-gray-600 border-slate-200 hover:border-red-200'}`}
              >{bg}</button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto flex-wrap">
            {/* Urgency filter */}
            <select
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
              className="text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 bg-white text-gray-700"
            >
              <option value="">All Urgency</option>
              {URGENCIES.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>

            {/* Status toggle */}
            <div className="flex bg-slate-100 rounded-xl p-0.5 gap-0.5">
              {['All', 'Active', 'Pending', 'Waiting', 'Accepted', 'Fulfilled', 'Cancelled'].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterStatus === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {s === 'All' ? 'All Statuses' : s === 'Active' ? 'Active (Pending/Waiting/Accepted)' : s}
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3 font-semibold">{filtered.length} requests found</p>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">
          <Filter className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No requests match your filters.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((req, i) => (
            <motion.div key={req._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <RequestCard request={req} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Post Request Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Post Blood Request">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Patient Name *</label>
              <input type="text" value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-gray-900" placeholder="Full name" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Blood Group *</label>
              <select value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-gray-900">
                {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hospital Name *</label>
            <input type="text" value={form.hospitalName} onChange={(e) => setForm({ ...form, hospitalName: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-gray-900" placeholder="Apollo Hospital, Bengaluru" />
          </div>

          {/* Map Location Picker */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-500" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Pick Hospital on OpenStreetMap</span>
              </div>
              {mapPos && (
                <button type="button" onClick={() => { setMapPos(null); setMapPickedAddress(''); }}
                  className="text-[9px] font-bold text-red-500 hover:text-red-700 flex items-center gap-0.5 cursor-pointer">
                  <XIcon className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
            {/* Search */}
            <div className="p-2 bg-white">
              <LocationSearchInput
                onSelectLocation={(loc) => {
                  if (!loc) {
                    setMapPos(null);
                    setMapPickedAddress('');
                    return;
                  }
                  const pos = { lat: loc.lat, lng: loc.lng };
                  setMapPos(pos);
                  setMapPickedAddress(loc.displayName);
                  setForm(prev => ({
                    ...prev,
                    hospitalName: loc.name || prev.hospitalName,
                    city: loc.city || prev.city
                  }));
                }}
                placeholder="Search hospital or place (Photon OSM)..."
              />
            </div>
            {/* Map */}
            <div className="h-[180px] w-full relative z-0">
              <MapLibreContainer
                isPicker={true}
                pickerLocation={mapPos}
                center={mapPos || { lat: 11.2588, lng: 75.7804 }}
                zoom={mapPos ? 14 : 10}
                onLocationPicked={(loc) => {
                  const pos = { lat: loc.lat, lng: loc.lng };
                  setMapPos(pos);
                  setMapPickedAddress(loc.displayName);
                  setForm(prev => ({
                    ...prev,
                    hospitalName: loc.address?.hospital || loc.displayName.split(',')[0] || prev.hospitalName,
                    city: loc.city || prev.city
                  }));
                }}
                height="100%"
              />
            </div>
            {mapPickedAddress ? (
              <div className="px-3 py-2 bg-emerald-50 border-t border-emerald-200 flex items-start gap-2">
                <Navigation className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <p className="text-[10px] text-emerald-700 font-semibold leading-snug line-clamp-2">{mapPickedAddress}</p>
              </div>
            ) : (
              <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 font-medium">📍 Search above (Photon) or click map (Nominatim) to auto-fill hospital & city</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">City</label>
              <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-gray-900" placeholder="Bengaluru" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Units Required</label>
              <input type="number" min="1" max="10" value={form.unitsRequired} onChange={(e) => setForm({ ...form, unitsRequired: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-gray-900" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Urgency</label>
              <select value={form.urgencyLevel} onChange={(e) => setForm({ ...form, urgencyLevel: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-gray-900">
                {URGENCIES.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contact Number</label>
              <input type="tel" value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-gray-900" placeholder="9876543210" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)}
              className="flex-1 py-3 border border-slate-200 text-gray-700 font-semibold rounded-2xl text-sm hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-2xl text-sm shadow-xl shadow-red-200 transition-all">
              Post Request
            </button>
          </div>
        </form>
      </Modal>

      {/* Render Poster Modal right after posting request */}
      <PosterModal
        isOpen={!!posterReq}
        onClose={() => setPosterReq(null)}
        data={posterReq}
        type="request"
      />
    </div>
  );
}
