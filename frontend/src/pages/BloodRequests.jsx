import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/appStore.js';
import { useAuthStore } from '../store/authStore.js';
import RequestCard from '../components/RequestCard.jsx';
import Modal from '../components/Modal.jsx';
import { Plus, SlidersHorizontal, Siren, Filter, MapPin, Search, Loader2, Navigation, X as XIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import PosterModal from '../components/PosterModal.jsx';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    return await res.json();
  } catch { return null; }
}

async function forwardGeocode(query) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    return await res.json();
  } catch { return []; }
}

function FlyTo({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo([position.lat, position.lng], 16, { animate: true, duration: 1 });
  }, [position, map]);
  return null;
}

function ClickMarker({ position, setPosition, onPicked }) {
  useMapEvents({
    async click(e) {
      const latlng = e.latlng;
      setPosition(latlng);
      const geo = await reverseGeocode(latlng.lat, latlng.lng);
      if (geo && onPicked) onPicked(geo);
    },
  });
  return position ? <Marker position={position} /> : null;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCIES = ['Immediate', 'Critical', 'Moderate'];

export default function BloodRequests() {
  const { requests, fetchRequests, createRequest, triggerToast } = useAppStore();
  const { user } = useAuthStore();
  const [filterBG, setFilterBG] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('');
  const [filterStatus, setFilterStatus] = useState('Pending');
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
    return (
      (!filterBG || r.bloodGroup === filterBG) &&
      (!filterUrgency || r.urgencyLevel === filterUrgency) &&
      (!filterStatus || r.status === filterStatus)
    );
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

  const sosCount = requests.filter((r) => r.urgencyLevel === 'Immediate' && r.status === 'Pending').length;

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
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center animate-heartbeat shrink-0">
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
              {['Pending', 'Fulfilled', ''].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterStatus === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {s || 'All'}
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
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Pick Hospital on Map</span>
              </div>
              {mapPos && (
                <button type="button" onClick={() => { setMapPos(null); setMapPickedAddress(''); setMapSearch(''); }}
                  className="text-[9px] font-bold text-red-500 hover:text-red-700 flex items-center gap-0.5 cursor-pointer">
                  <XIcon className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
            {/* Search */}
            <div className="relative px-2 pt-2 pb-1 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={mapSearch}
                  onChange={(e) => { setMapSearch(e.target.value); handleMapSearch(e.target.value); }}
                  onFocus={() => mapSearchResults.length > 0 && setShowSearchDropdown(true)}
                  placeholder="Search hospital or place..."
                  className="w-full pl-8 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-gray-900 outline-none focus:border-red-400"
                />
                {mapSearchLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 animate-spin" />}
              </div>
              {showSearchDropdown && mapSearchResults.length > 0 && (
                <div className="absolute left-2 right-2 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-[9999] max-h-44 overflow-y-auto">
                  {mapSearchResults.map((r, i) => (
                    <button key={i} type="button" onClick={() => selectResult(r)}
                      className="w-full text-left px-3 py-2.5 text-[11px] text-slate-700 hover:bg-slate-50 border-b border-slate-100 last:border-0 cursor-pointer flex items-start gap-2">
                      <MapPin className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{r.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Map */}
            <div className="h-[180px] w-full relative z-0">
              <MapContainer center={[11.2588, 75.7804]} zoom={10} scrollWheelZoom={true} className="h-full w-full">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ClickMarker position={mapPos} setPosition={setMapPos} onPicked={handleMapPicked} />
                <FlyTo position={mapPos} />
              </MapContainer>
            </div>
            {mapPickedAddress ? (
              <div className="px-3 py-2 bg-emerald-50 border-t border-emerald-200 flex items-start gap-2">
                <Navigation className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <p className="text-[10px] text-emerald-700 font-semibold leading-snug line-clamp-2">{mapPickedAddress}</p>
              </div>
            ) : (
              <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 font-medium">📍 Click map or search to auto-fill hospital & city</p>
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
