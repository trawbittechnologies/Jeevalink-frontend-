import { useEffect, useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppStore } from '../store/appStore.js';
import { useAuthStore } from '../store/authStore.js';
import { Heart, Plus, List, Droplet, User, Phone, MapPin, AlertCircle, FileText, CheckCircle2, Download, Edit3, Trash2, Clock, Search, Loader2, Navigation, X as XIcon, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import PosterModal from '../components/PosterModal.jsx';
import EditRequestModal from '../components/EditRequestModal.jsx';
import DeleteConfirmModal from '../components/DeleteConfirmModal.jsx';
import { MapContainer as LeafletMapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
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

// Reverse geocode using free Nominatim API (OpenStreetMap)
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}

// Forward geocode / search using Nominatim
async function forwardGeocode(query) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    return await res.json();
  } catch {
    return [];
  }
}

function FlyToPosition({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo([position.lat, position.lng], 16, { animate: true, duration: 1 });
  }, [position, map]);
  return null;
}

function LocationMarker({ position, setPosition, onPicked }) {
  useMapEvents({
    async click(e) {
      const latlng = e.latlng;
      setPosition(latlng);
      const geo = await reverseGeocode(latlng.lat, latlng.lng);
      if (geo && onPicked) onPicked(geo, latlng);
    },
  });
  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

// Zod Validation Schema for creating request
const createRequestSchema = z.object({
  patientName: z.string().min(2, 'Patient name must be at least 2 characters'),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], {
    errorMap: () => ({ message: 'Please select a blood group' })
  }),
  unitsRequired: z.coerce.number().min(1, 'At least 1 unit is required').max(10, 'Maximum 10 units per request'),
  hospitalName: z.string().min(3, 'Hospital name must be at least 3 characters'),
  location: z.string().min(3, 'Location description must be at least 3 characters'),
  contactNumber: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit contact number'),
  urgencyLevel: z.enum(['Immediate', 'Critical', 'Standard']),
  additionalNotes: z.string().optional()
});

export default function Requests() {
  const { user } = useAuthStore();
  const { 
    requests, 
    fetchRequests, 
    createRequest, 
    fulfillRequest,
    updateRequestStatus,
    deleteRequest,
    triggerToast 
  } = useAppStore();

  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'new'
  const [position, setPosition] = useState(null); // { lat, lng }
  const [mapPickedAddress, setMapPickedAddress] = useState(''); // Reverse geocoded address
  const [mapSearch, setMapSearch] = useState('');
  const [mapSearchResults, setMapSearchResults] = useState([]);
  const [mapSearchLoading, setMapSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [editingReq, setEditingReq] = useState(null);
  const [deletingReqId, setDeletingReqId] = useState(null);
  const [posterReq, setPosterReq] = useState(null);
  const [filterBg, setFilterBg] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('');
  const [myRequestsOnly, setMyRequestsOnly] = useState(false);
  const [pendingApprovalBanner, setPendingApprovalBanner] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  // Responsive tracker
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(createRequestSchema),
    defaultValues: { urgencyLevel: 'Standard', unitsRequired: 1 }
  });

  // Handle reverse geocode result — auto-fill hospital & location fields
  const handleMapPicked = useCallback((geo) => {
    const addr = geo.address || {};
    // Try to extract a meaningful place name
    const placeName =
      addr.amenity ||
      addr.hospital ||
      addr.clinic ||
      addr.building ||
      addr.tourism ||
      addr.leisure ||
      addr.shop ||
      geo.name ||
      '';
    const road = addr.road || addr.street || '';
    const suburb = addr.suburb || addr.village || addr.town || addr.city_district || '';
    const city = addr.city || addr.town || addr.county || '';
    const state = addr.state || '';

    const fullAddress = [road, suburb, city, state].filter(Boolean).join(', ');
    setMapPickedAddress(geo.display_name || fullAddress);

    if (placeName) setValue('hospitalName', placeName, { shouldValidate: true });
    if (fullAddress) setValue('location', fullAddress, { shouldValidate: true });
  }, [setValue]);

  // Handle search
  const handleMapSearch = useCallback(async (query) => {
    if (!query || query.length < 3) { setMapSearchResults([]); return; }
    setMapSearchLoading(true);
    const results = await forwardGeocode(query);
    setMapSearchResults(results);
    setMapSearchLoading(false);
    setShowSearchDropdown(true);
  }, []);

  const selectSearchResult = useCallback(async (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const newPos = { lat, lng };
    setPosition(newPos);
    setMapSearch(result.display_name);
    setShowSearchDropdown(false);
    setMapSearchResults([]);
    // Also do reverse geocode to fill fields
    const geo = await reverseGeocode(lat, lng);
    if (geo) handleMapPicked(geo, newPos);
  }, [handleMapPicked]);

  const now = useMemo(() => new Date(), []);

  useEffect(() => {
    fetchRequests(filterBg, filterUrgency);
  }, [filterBg, filterUrgency, fetchRequests]);

  const onFormSubmit = async (data) => {
    if (position) {
      data.latitude = position.lat;
      data.longitude = position.lng;
    }
    const res = await createRequest(data);
    if (res.success) {
      reset();
      setPosition(null);
      setMapPickedAddress('');
      setMapSearch('');
      setMapSearchResults([]);
      setShowSearchDropdown(false);

      if (res.verified) {
        // Privileged user — request is live immediately
        setActiveTab('feed');
        const createdObj = {
          patient_name: data.patientName,
          blood_group: data.bloodGroup,
          units_required: data.unitsRequired,
          hospital_name: data.hospitalName,
          venue: data.hospitalName,
          location: data.location,
          contact_phone: data.contactNumber,
          urgency_level: data.urgencyLevel,
          required_date: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
          required_time: data.urgencyLevel === 'Immediate' ? 'Urgent / Immediate' : 'Standard Need',
          request_id: res.request?.id || res.request?._id || 'JL-REQ'
        };
        setPosterReq(createdObj);
        triggerToast('Blood alert posted and published! Poster ready for download.', 'success');
      } else {
        // Regular user — request is pending Meghala committee approval
        setPendingApprovalBanner(true);
        fetchRequests(); // Refresh to show own pending request in My Requests
        triggerToast('Request submitted! Awaiting Meghala committee approval.', 'info');
      }
    }
  };

  const handleFulfill = async (reqId) => {
    if (!user) {
      triggerToast('Please log in to volunteer.', 'warning');
      return;
    }

    const res = await fulfillRequest(reqId, user._id);
    if (res.success) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10b981', '#ffffff', '#990f0f']
      });
      setSelectedReq(null);
    }
  };

  // Reusable Form layout render
  const renderRequestForm = () => (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase pl-1 mb-1">Patient Name</label>
        <div className="relative">
          <input
            type="text"
            placeholder="Karan Malhotra"
            {...register('patientName')}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs transition-colors text-slate-900 dark:text-zinc-100 pr-10"
          />
          <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>
        {errors.patientName && <span className="text-[10px] font-bold text-red-500 mt-1 pl-1 block">{errors.patientName.message}</span>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase pl-1 mb-1">Blood Group</label>
          <select
            {...register('bloodGroup')}
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs transition-colors text-slate-900 dark:text-zinc-100 font-bold"
          >
            <option value="">Select Group</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
          {errors.bloodGroup && <span className="text-[10px] font-bold text-red-500 mt-1 pl-1 block">{errors.bloodGroup.message}</span>}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase pl-1 mb-1">Units Required</label>
          <input
            type="number"
            min="1"
            max="10"
            {...register('unitsRequired')}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs transition-colors text-slate-900 dark:text-zinc-100 font-bold"
          />
          {errors.unitsRequired && <span className="text-[10px] font-bold text-red-500 mt-1 pl-1 block">{errors.unitsRequired.message}</span>}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase pl-1 mb-1">Hospital Name</label>
        <input
          type="text"
          placeholder="Apollo Hospital"
          {...register('hospitalName')}
          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs text-slate-900 dark:text-zinc-100"
        />
        {errors.hospitalName && <span className="text-[10px] font-bold text-red-500 mt-1 pl-1 block">{errors.hospitalName.message}</span>}
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase pl-1 mb-1">Location / Address</label>
        <div className="relative">
          <input
            type="text"
            placeholder="Bannerghatta Road, Bengaluru"
            {...register('location')}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs text-slate-900 dark:text-zinc-100 pr-10"
          />
          <MapPin className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>
        {errors.location && <span className="text-[10px] font-bold text-red-500 mt-1 pl-1 block">{errors.location.message}</span>}
      </div>

      {/* Map Location Picker */}
      <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-slate-50 dark:bg-zinc-950 px-3 py-2 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-red-500" />
            <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Pin Hospital / Place on Map</span>
          </div>
          {position && (
            <button
              type="button"
              onClick={() => { setPosition(null); setMapPickedAddress(''); setMapSearch(''); }}
              className="text-[9px] font-bold text-red-500 hover:text-red-700 flex items-center gap-0.5 cursor-pointer"
            >
              <XIcon className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {/* Search Box */}
        <div className="relative px-2 pt-2 pb-1 bg-white dark:bg-zinc-900">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={mapSearch}
              onChange={(e) => {
                setMapSearch(e.target.value);
                handleMapSearch(e.target.value);
              }}
              onFocus={() => mapSearchResults.length > 0 && setShowSearchDropdown(true)}
              placeholder="Search hospital, place, area..."
              className="w-full pl-8 pr-8 py-2 text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-zinc-100 outline-none focus:border-red-400"
            />
            {mapSearchLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 animate-spin" />}
          </div>
          {/* Search Dropdown */}
          {showSearchDropdown && mapSearchResults.length > 0 && (
            <div className="absolute left-2 right-2 top-full mt-1 bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-xl z-[9999] max-h-48 overflow-y-auto">
              {mapSearchResults.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectSearchResult(r)}
                  className="w-full text-left px-3 py-2.5 text-[11px] text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 border-b border-slate-100 dark:border-zinc-800 last:border-0 cursor-pointer flex items-start gap-2"
                >
                  <MapPin className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{r.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map Canvas */}
        <div className="h-[220px] w-full relative z-0">
          <LeafletMapContainer center={[11.2588, 75.7804]} zoom={10} scrollWheelZoom={true} className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} setPosition={setPosition} onPicked={handleMapPicked} />
            <FlyToPosition position={position} />
          </LeafletMapContainer>
        </div>

        {/* Picked location preview */}
        {mapPickedAddress ? (
          <div className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/20 border-t border-emerald-200 dark:border-emerald-800/40 flex items-start gap-2">
            <Navigation className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold leading-snug line-clamp-2">{mapPickedAddress}</p>
          </div>
        ) : (
          <div className="px-3 py-2 bg-slate-50 dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-800">
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">📍 Click on the map or search above to auto-fill hospital & location</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase pl-1 mb-1">Contact Phone</label>
          <div className="relative">
            <input
              type="tel"
              placeholder="9876500111"
              {...register('contactNumber')}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs text-slate-900 dark:text-zinc-100 pr-10"
            />
            <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
          {errors.contactNumber && <span className="text-[10px] font-bold text-red-500 mt-1 pl-1 block">{errors.contactNumber.message}</span>}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase pl-1 mb-1">Urgency Level</label>
          <select
            {...register('urgencyLevel')}
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs text-slate-900 dark:text-zinc-100 font-bold"
          >
            <option value="Standard">Standard</option>
            <option value="Critical">Critical</option>
            <option value="Immediate">Immediate SOS</option>
          </select>
          {errors.urgencyLevel && <span className="text-[10px] font-bold text-red-500 mt-1 pl-1 block">{errors.urgencyLevel.message}</span>}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase pl-1 mb-1">Additional Notes <span className="text-slate-400">(Optional)</span></label>
        <div className="relative">
          <textarea
            rows="2"
            placeholder="Need O+ blood for surgery scheduled tomorrow morning. Replacement preferred."
            {...register('additionalNotes')}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs text-slate-900 dark:text-zinc-100 pr-10"
          />
          <FileText className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
        </div>
      </div>

      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary hover:bg-primary-dark text-white font-semibold rounded-2xl shadow-md cursor-pointer transition-colors mt-6"
      >
        {user?.role === 'user' ? '📋 Submit for Approval' : 'Broadcast Blood Alert'}
      </button>
      {user?.role === 'user' && (
        <p className="text-[10px] text-slate-400 dark:text-zinc-500 text-center mt-2 leading-relaxed">
          ⏳ Your request will be reviewed by the Meghala committee before appearing publicly.
        </p>
      )}
    </form>
  );

  const displayRequests = requests.filter((req) => {
    if (myRequestsOnly && user) {
      // Show own requests including pending approval ones
      const isOwner = String(req.requested_by || req.requestedBy) === String(user.id || user._id);
      return isOwner;
    }
    // Public feed: only show verified (non-pending) requests
    return !req.pending_approval;
  });

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 px-6 pt-6 pb-24 select-none">
      <div className="max-w-7xl mx-auto">

        {/* ⏳ Pending Approval Banner — shown to regular users after submission */}
        {pendingApprovalBanner && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="mb-5 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/50 rounded-2xl flex items-start gap-3"
          >
            <div className="w-9 h-9 shrink-0 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center">
              <Clock className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-extrabold text-amber-800 dark:text-amber-300">⏳ Awaiting Meghala Committee Approval</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                Your blood request has been submitted successfully. It will appear in the public feed once a Meghala volunteer approves it. You&apos;ll receive a notification when it goes live.
              </p>
              <button
                onClick={() => { setPendingApprovalBanner(false); setMyRequestsOnly(true); }}
                className="mt-2 text-[10px] font-bold text-amber-700 dark:text-amber-300 underline underline-offset-2 cursor-pointer"
              >
                View My Requests &rarr;
              </button>
            </div>
            <button
              onClick={() => setPendingApprovalBanner(false)}
              className="shrink-0 text-amber-500 hover:text-amber-700 cursor-pointer"
            >
              <span className="text-sm font-bold">&times;</span>
            </button>
          </motion.div>
        )}

        {/* Render DESKTOP Split Layout */}
        {isDesktop ? (
          <div className="grid grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Active Alerts Feed (col-span-7) */}
            <div className="col-span-7 space-y-4">
              <div className="flex justify-between items-center pl-1">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">Active Blood Alerts Feed</h4>
                
                {/* Desktop Filters */}
                <div className="flex gap-2 text-xs items-center">
                  {user && (
                    <button
                      onClick={() => setMyRequestsOnly(!myRequestsOnly)}
                      className={`px-2.5 py-1.5 rounded-xl font-bold transition-colors cursor-pointer text-xs border ${
                        myRequestsOnly
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800'
                      }`}
                    >
                      ✨ My Requests
                    </button>
                  )}
                  <select
                    value={filterBg}
                    onChange={(e) => setFilterBg(e.target.value)}
                    className="px-2.5 py-1.5 bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl font-bold text-slate-700 dark:text-zinc-300"
                  >
                    <option value="">All Groups</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                  <select
                    value={filterUrgency}
                    onChange={(e) => setFilterUrgency(e.target.value)}
                    className="px-2.5 py-1.5 bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl font-bold text-slate-700 dark:text-zinc-300"
                  >
                    <option value="">All Urgencies</option>
                    <option value="Immediate">Immediate</option>
                    <option value="Critical">Critical</option>
                    <option value="Standard">Standard</option>
                  </select>
                </div>
              </div>

              {displayRequests.length === 0 ? (
                <div className="bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all dark:bg-zinc-900 border dark:border-zinc-800 rounded-3xl p-10 text-center text-slate-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-3 text-emerald-500" />
                  <p className="text-sm font-semibold">{myRequestsOnly ? 'You have not created any blood requests yet.' : 'No active blood alerts right now.'}</p>
                  <p className="text-xs text-slate-500 mt-1">{myRequestsOnly ? 'Click "Post New Blood Alert" to create one.' : 'All patients have received matching donors.'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {displayRequests.map((req) => {
                    const isOwner = user && (String(req.requested_by || req.requestedBy) === String(user.id || user._id));
                    const isSOS = (req.urgencyLevel || req.urgency_level) === 'Immediate';
                    const isFulfilled = req.status === 'Fulfilled';
                    const isPendingApproval = req.pending_approval === true;

                    return (
                      <div
                        key={req._id || req.id}
                        onClick={() => !isPendingApproval && setSelectedReq(req)}
                        className={`p-4 bg-white dark:bg-zinc-900 border rounded-2xl shadow-sm flex flex-col justify-between gap-3 ${
                          isPendingApproval
                            ? 'border-amber-300 dark:border-amber-700/60 bg-amber-50/30 dark:bg-amber-950/10'
                            : isFulfilled
                              ? 'border-slate-200/50 dark:border-zinc-800/50 opacity-60 cursor-pointer'
                              : isSOS
                                ? 'border-red-500/20 hover:border-red-500/40 cursor-pointer animate-pulse'
                                : 'border-slate-200 dark:border-zinc-800 hover:border-slate-350 cursor-pointer'
                        } transition-colors`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            {/* Urgency / Fulfilled badge */}
                            {isPendingApproval ? (
                              <span className="flex items-center gap-1 text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">
                                <Clock className="w-2.5 h-2.5" /> Pending Approval
                              </span>
                            ) : (
                              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                                isFulfilled
                                  ? 'bg-slate-100 dark:bg-zinc-800 text-slate-500'
                                  : (req.urgencyLevel || req.urgency_level) === 'Immediate'
                                    ? 'bg-red-500/10 text-red-650'
                                    : (req.urgencyLevel || req.urgency_level) === 'Critical'
                                      ? 'bg-orange-500/10 text-orange-600'
                                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                              }`}>
                                {isFulfilled ? 'Fulfilled' : (req.urgencyLevel || req.urgency_level)}
                              </span>
                            )}
                            <div className="flex items-center gap-1.5">
                              {isOwner && (
                                <span className="text-[8px] font-extrabold bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full">
                                  Your Request
                                </span>
                              )}
                              <span className="text-[9px] text-slate-450 dark:text-zinc-500 font-bold">
                                {new Date(req.createdAt || req.created_at || now).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </div>

                          <h4 className={`text-sm font-bold text-slate-900 dark:text-zinc-100 truncate mt-2.5 ${isFulfilled ? 'line-through' : ''}`}>
                            {req.patientName || req.patient_name} ({req.bloodGroup || req.blood_group})
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 truncate flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 shrink-0 text-slate-400" /> {req.hospitalName || req.hospital_name}
                          </p>
                          {isPendingApproval && (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1.5 font-medium">
                              Awaiting Meghala committee review before going public.
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-zinc-800/60">
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 truncate max-w-[130px]">📍 {req.location || req.city}</span>
                          <div className="flex items-center gap-0.5 text-primary text-xs font-black">
                            <Droplet className="w-3.5 h-3.5 fill-primary" /> {req.unitsRequired || req.units_required} U
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: New Blood Request Form (col-span-5) */}
            <div className="col-span-5 bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all dark:bg-zinc-900 border /80 dark:border-zinc-800/80 rounded-3xl p-5 space-y-4">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100 pl-0.5">Post New Blood Alert</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 pl-0.5">Alert matching donors in real-time</p>
              </div>
              {renderRequestForm()}
            </div>
            
          </div>
        ) : (
          
          /* Render MOBILE Tab Layout */
          <div>
            <div className="flex bg-slate-100 dark:bg-zinc-900 rounded-xl p-1 mb-5">
              <button
                onClick={() => setActiveTab('feed')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'feed' 
                    ? 'bg-white dark:bg-zinc-800 text-slate-950 dark:text-zinc-100 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400'
                }`}
              >
                <List className="w-4 h-4" /> Active Alerts Feed
              </button>
              <button
                onClick={() => setActiveTab('new')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'new' 
                    ? 'bg-white dark:bg-zinc-800 text-slate-955 dark:text-zinc-100 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400'
                }`}
              >
                <Plus className="w-4 h-4" /> New Blood Alert
              </button>
            </div>

            {activeTab === 'feed' ? (
              <div>
                <div className="flex gap-2 mb-4">
                  <select
                    value={filterBg}
                    onChange={(e) => setFilterBg(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300"
                  >
                    <option value="">All Blood Groups</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>

                  <select
                    value={filterUrgency}
                    onChange={(e) => setFilterUrgency(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300"
                  >
                    <option value="">All Urgencies</option>
                    <option value="Immediate">Immediate</option>
                    <option value="Critical">Critical</option>
                    <option value="Standard">Standard</option>
                  </select>
                </div>

                {requests.length === 0 ? (
                  <div className="bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all dark:bg-zinc-900 border dark:border-zinc-800 rounded-3xl p-10 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-3 text-emerald-500" />
                    <p className="text-sm font-semibold">No active blood alerts right now.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requests.map((req) => {
                      const isSOS = (req.urgencyLevel || req.urgency_level) === 'Immediate';
                      const isFulfilled = req.status === 'Fulfilled';
                      const isPendingApproval = req.pending_approval === true;

                      return (
                        <div
                          key={req._id || req.id}
                          onClick={() => !isFulfilled && !isPendingApproval && setSelectedReq(req)}
                          className={`p-4 bg-white dark:bg-zinc-900 border rounded-2xl shadow-sm flex items-start justify-between gap-3 ${
                            isPendingApproval
                              ? 'border-amber-300 dark:border-amber-700/60 bg-amber-50/30 dark:bg-amber-950/10'
                              : isFulfilled
                                ? 'border-slate-200/50 dark:border-zinc-800/50 opacity-60'
                                : isSOS
                                  ? 'border-red-500/20 hover:border-red-500/40 cursor-pointer'
                                  : 'border-slate-200 dark:border-zinc-800 hover:border-slate-350 cursor-pointer'
                          } transition-colors`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              {isPendingApproval ? (
                                <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">
                                  <Clock className="w-2.5 h-2.5" /> Pending Approval
                                </span>
                              ) : (
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                  isFulfilled
                                    ? 'bg-slate-100 dark:bg-zinc-800 text-slate-500'
                                    : (req.urgencyLevel || req.urgency_level) === 'Immediate'
                                      ? 'bg-red-500/10 text-red-600'
                                      : (req.urgencyLevel || req.urgency_level) === 'Critical'
                                        ? 'bg-orange-500/10 text-orange-600'
                                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-650'
                                }`}>
                                  {isFulfilled ? 'Fulfilled' : (req.urgencyLevel || req.urgency_level)}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 dark:text-zinc-550 font-medium">
                                {new Date(req.createdAt || req.created_at || now).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            </div>

                            <h4 className={`text-sm font-bold text-slate-900 dark:text-zinc-100 truncate mt-2 ${isFulfilled ? 'line-through' : ''}`}>
                              {req.patientName || req.patient_name} ({req.bloodGroup || req.blood_group})
                            </h4>
                            <p className="text-xs text-slate-550 dark:text-zinc-400 mt-0.5 truncate flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 shrink-0 text-slate-400" /> {req.hospitalName || req.hospital_name}
                            </p>
                            {isPendingApproval && (
                              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                                Awaiting Meghala committee review.
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col items-end shrink-0 justify-between h-full gap-4">
                            <div className="flex items-center gap-0.5 text-primary bg-rose-500/5 px-2 py-1 rounded-lg border border-red-500/10 text-xs font-black">
                              <Droplet className="w-3.5 h-3.5 fill-primary" /> {req.unitsRequired || req.units_required} U
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all dark:bg-zinc-900 border dark:border-zinc-800 rounded-3xl p-5"
              >
                {renderRequestForm()}
              </motion.div>
            )}
          </div>
        )}

      </div>

      {/* Active Request Details & Volunteer overlay Modal */}
      {selectedReq && (() => {
        const isOwner = user && (String(user._id || user.id) === String(selectedReq.requested_by || selectedReq.requestedBy));
        const isPrivileged = user && ['admin', 'volunteer', 'super_admin', 'technical_admin'].includes(user?.role);
        // Only owner + admin-level roles can Edit/Delete (NOT plain volunteers for others' requests)
        const canEditDelete = isOwner || (user && ['admin', 'super_admin', 'technical_admin'].includes(user.role));
        const waNumber = selectedReq.volunteerWhatsapp || selectedReq.whatsappNumber || selectedReq.volunteerPhone || selectedReq.contactNumber || selectedReq.contact_number || '';
        const waMsg = encodeURIComponent(
          `Hi, I'm responding to a blood request for patient *${selectedReq.patientName || selectedReq.patient_name}* (${selectedReq.bloodGroup || selectedReq.blood_group}) at ${selectedReq.hospitalName || selectedReq.hospital_name}. Please guide me.`
        );
        const callNum = selectedReq.contactNumber || selectedReq.contact_number || '';

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-6 text-center animate-fade-in">
            <div className="bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all dark:bg-zinc-900 border dark:border-zinc-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative">
              <div className="w-14 h-14 bg-red-50 dark:bg-red-950/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100 dark:border-red-900">
                <Droplet className="w-7 h-7 text-primary fill-primary animate-pulse" />
              </div>

              <h3 className="text-lg font-extrabold text-slate-900 dark:text-zinc-100">
                {selectedReq.bloodGroup || selectedReq.blood_group} Blood Request
              </h3>
              <p className="text-xs text-red-500 font-bold mt-1 flex items-center gap-1 justify-center">
                <AlertCircle className="w-3.5 h-3.5" /> {selectedReq.urgencyLevel || selectedReq.urgency_level} Attention Needed
              </p>

              <div className="my-4 bg-slate-50 dark:bg-zinc-950 rounded-2xl p-4 border border-slate-100 dark:border-zinc-800/60 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Patient Name:</span>
                  <span className="font-bold text-slate-800 dark:text-zinc-100">{selectedReq.patientName || selectedReq.patient_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Units Required:</span>
                  <span className="font-bold text-slate-800 dark:text-zinc-100">{selectedReq.unitsRequired || selectedReq.units_required} Unit(s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Hospital:</span>
                  <span className="font-bold text-slate-800 dark:text-zinc-100 truncate max-w-[170px]">{selectedReq.hospitalName || selectedReq.hospital_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Location:</span>
                  <span className="font-bold text-slate-800 dark:text-zinc-100 truncate max-w-[170px]">{selectedReq.location || selectedReq.city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Contact:</span>
                  <a href={`tel:${callNum}`} className="font-bold text-primary hover:underline">{callNum || '—'}</a>
                </div>
                {(selectedReq.additionalNotes || selectedReq.additional_notes) && (
                  <div className="pt-2 border-t border-slate-200 dark:border-zinc-800">
                    <span className="text-slate-400 font-bold block mb-1">Notes:</span>
                    <p className="text-slate-700 dark:text-zinc-350 italic bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all dark:bg-zinc-900 p-2 rounded-lg border dark:border-zinc-800">{selectedReq.additionalNotes || selectedReq.additional_notes}</p>
                  </div>
                )}
              </div>

              {/* ── Call + WhatsApp — always shown to ALL users including owners ── */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <a
                  href={callNum ? `tel:${callNum}` : '#'}
                  onClick={!callNum ? (e) => e.preventDefault() : undefined}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    callNum ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Phone className="w-4 h-4" /> Call
                </a>
                <a
                  href={waNumber ? `https://wa.me/${waNumber.replace(/\D/g, '')}?text=${waMsg}` : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={!waNumber ? (e) => e.preventDefault() : undefined}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    waNumber ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.570-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </a>
              </div>

              {/* ── Edit/Delete panel — only for owner OR admin-level (NOT plain volunteers on others) ── */}
              {canEditDelete && (
                <div className="mb-3 p-3 bg-red-50/60 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/40 text-left space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-red-600 dark:text-red-400">
                      {isOwner ? '✨ Your Request Settings' : '🛡️ Admin Controls'}
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                      {selectedReq.status || 'Pending'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">Change Status:</span>
                    <select
                      value={selectedReq.status || 'Pending'}
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        if (newStatus && newStatus !== selectedReq.status) {
                          const res = await updateRequestStatus(selectedReq._id || selectedReq.id, newStatus);
                          if (res.success && res.request) setSelectedReq(res.request);
                        }
                      }}
                      className="px-2.5 py-1 bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-zinc-100 cursor-pointer"
                    >
                      <option value="Pending">🟡 Pending</option>
                      <option value="Fulfilled">🟢 Fulfilled</option>
                      <option value="Cancelled">🔴 Cancelled</option>
                    </select>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-red-100 dark:border-red-900/30">
                    <button
                      type="button"
                      onClick={() => { const r = selectedReq; setSelectedReq(null); setEditingReq(r); }}
                      className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => { const id = selectedReq._id || selectedReq.id; setSelectedReq(null); setDeletingReqId(id); }}
                      className="flex-1 py-1.5 px-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              )}

              {/* ── Bottom row: Poster | Close | Volunteer & Fulfill ── */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { const r = selectedReq; setSelectedReq(null); setPosterReq(r); }}
                  className="py-2.5 px-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold rounded-xl transition-colors cursor-pointer text-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Poster
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-100 font-semibold rounded-xl transition-colors cursor-pointer text-xs"
                >
                  Close
                </button>
                {!isOwner && !isPrivileged && (
                  <button
                    onClick={() => handleFulfill(selectedReq._id || selectedReq.id)}
                    className="flex-2 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-sm transition-colors cursor-pointer text-xs"
                  >
                    <Heart className="w-3.5 h-3.5 fill-white" /> Volunteer & Fulfill
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Edit Request Modal */}
      <EditRequestModal
        isOpen={!!editingReq}
        onClose={() => setEditingReq(null)}
        request={editingReq}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingReqId}
        onClose={() => setDeletingReqId(null)}
        onConfirm={() => {
          if (deletingReqId) {
            deleteRequest(deletingReqId);
            setDeletingReqId(null);
          }
        }}
      />

      {/* Render Poster Modal */}
      <PosterModal
        isOpen={!!posterReq}
        onClose={() => setPosterReq(null)}
        data={posterReq}
        type="request"
      />
    </div>
  );
}
