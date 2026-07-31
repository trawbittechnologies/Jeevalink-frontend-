import { useState } from 'react';
import { Plus, Minus, Building2, Siren, Heart } from 'lucide-react';

export default function MapContainer({ donors = [], requests = [], center = { lat: 12.9716, lng: 77.5946 }, radius = 15 }) {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [showDonors, setShowDonors] = useState(true);
  const [showRequests, setShowRequests] = useState(true);

  // Bounds for coordinates mapping to SVG viewport (500x350)
  // Bengaluru bounds roughly: Lat 12.90 to 13.04, Lng 77.50 to 77.70
  const latMin = 12.88;
  const latMax = 13.06;
  const lngMin = 77.48;
  const lngMax = 77.72;

  // Convert GPS Coordinates to SVG Viewport pixels (500 x 350)
  const getPixels = (lat, lng) => {
    // Basic linear interpolation
    const x = ((lng - lngMin) / (lngMax - lngMin)) * 500;
    const y = (1 - (lat - latMin) / (latMax - latMin)) * 350; // invert y for SVG coordinate system
    
    // Adjust for zoom
    const centerX = 250;
    const centerY = 175;
    const zoomedX = centerX + (x - centerX) * zoom;
    const zoomedY = centerY + (y - centerY) * zoom;

    return { x: zoomedX, y: zoomedY };
  };

  const centerPixels = getPixels(center.lat, center.lng);

  // Mock hospital points for visualization
  const mockHospitals = [
    { name: 'St. John’s Medical College', lat: 12.9339, lng: 77.6244, type: 'hospital' },
    { name: 'Apollo Hospital', lat: 12.8962, lng: 77.5985, type: 'hospital' },
    { name: 'Fortis Hospital', lat: 12.9882, lng: 77.5973, type: 'hospital' },
    { name: 'Manipal Hospital', lat: 12.9592, lng: 77.6444, type: 'hospital' }
  ];

  return (
    <div className="relative w-full aspect-[4/3] max-w-full bg-[#fcf9f9] dark:bg-zinc-900/80 rounded-3xl overflow-hidden border border-rose-100/80 dark:border-zinc-800/20 shadow-inner group">
      {/* Interactive Map Grid Canvas */}
      <svg className="w-full h-full select-none" viewBox="0 0 500 350">
        <defs>
          <radialGradient id="radiusGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#990f0f" stopOpacity="0.08" />
            <stop offset="70%" stopColor="#990f0f" stopOpacity="0.03" />
            <stop offset="100%" stopColor="#990f0f" stopOpacity="0" />
          </radialGradient>
          <pattern id="gridPattern" width="25" height="25" patternUnits="userSpaceOnUse">
            <path d="M 25 0 L 0 0 0 25" fill="none" stroke="rgba(153,15,15,0.04)" strokeWidth="1" />
          </pattern>
        </defs>

        {/* Map Grid Gridlines */}
        <rect width="500" height="350" fill="url(#gridPattern)" />

        {/* Core Center Pulse Ripple */}
        <circle 
          cx={centerPixels.x} 
          cy={centerPixels.y} 
          r={5} 
          className="fill-blue-500" 
        />
        <circle 
          cx={centerPixels.x} 
          cy={centerPixels.y} 
          r={15} 
          className="fill-transparent stroke-blue-500/40 stroke-2 animate-pulse" 
        />
        
        {/* Dynamic Radius Coverage Ring (representing preferred search bounds) */}
        <circle 
          cx={centerPixels.x} 
          cy={centerPixels.y} 
          r={radius * 10 * zoom} 
          className="fill-[url(#radiusGradient)] stroke-dashed stroke-primary/30"
          strokeDasharray="4,4"
        />

        {/* Hospitals Layers */}
        {mockHospitals.map((h, i) => {
          const pos = getPixels(h.lat, h.lng);
          const isSelected = selectedPoint && selectedPoint.name === h.name;
          
          return (
            <g key={`hospital-${i}`} className="cursor-pointer" onClick={() => setSelectedPoint(h)}>
              <circle 
                cx={pos.x} 
                cy={pos.y} 
                r={isSelected ? 10 : 7} 
                className="fill-blue-500/20 stroke-blue-500 stroke-2 transition-all duration-200"
              />
              <path 
                d={`M ${pos.x - 3} ${pos.y} L ${pos.x + 3} ${pos.y} M ${pos.x} ${pos.y - 3} L ${pos.x} ${pos.y + 3}`} 
                stroke="#3b82f6" 
                strokeWidth="2"
              />
            </g>
          );
        })}

        {/* Requests Markers Layer */}
        {showRequests && requests.map((r, i) => {
          const lat = r.coordinates?.lat || 12.9716;
          const lng = r.coordinates?.lng || 77.5946;
          const pos = getPixels(lat, lng);
          const isSelected = selectedPoint && selectedPoint._id === r._id;
          const isSOS = r.urgencyLevel === 'Immediate';
          
          return (
            <g key={`req-map-${r._id || i}`} className="cursor-pointer" onClick={() => setSelectedPoint(r)}>
              {/* Pulsing ring for critical SOS */}
              {isSOS && (
                <circle 
                  cx={pos.x} 
                  cy={pos.y} 
                  r={20} 
                  className="fill-red-500/10 stroke-red-500/40 stroke-1 animate-ping" 
                />
              )}
              <circle 
                cx={pos.x} 
                cy={pos.y} 
                r={isSelected ? 12 : 8} 
                className={`transition-all duration-200 stroke-white dark:stroke-zinc-900 stroke-2 ${
                  isSOS ? 'fill-red-600 animate-pulse' : 'fill-rose-500'
                }`}
              />
              <path 
                d={`M ${pos.x} ${pos.y - 4} L ${pos.x + 3.5} ${pos.y + 2} A 4 4 0 0 1 ${pos.x - 3.5} ${pos.y + 2} Z`} 
                fill="#ffffff"
              />
            </g>
          );
        })}

        {/* Donors Markers Layer */}
        {showDonors && donors.map((d, i) => {
          const lat = d.coordinates?.lat || 12.9716;
          const lng = d.coordinates?.lng || 77.5946;
          const pos = getPixels(lat, lng);
          const isSelected = selectedPoint && selectedPoint._id === d._id;

          return (
            <g key={`donor-map-${d._id || i}`} className="cursor-pointer" onClick={() => setSelectedPoint(d)}>
              {/* Highlight matching lines from centers */}
              {isSelected && (
                <line 
                  x1={centerPixels.x} 
                  y1={centerPixels.y} 
                  x2={pos.x} 
                  y2={pos.y} 
                  className="stroke-emerald-500/50 stroke-1"
                  strokeDasharray="2,2"
                />
              )}
              <circle 
                cx={pos.x} 
                cy={pos.y} 
                r={isSelected ? 11 : 7} 
                className="fill-emerald-500 stroke-white dark:stroke-zinc-900 stroke-2 transition-all duration-200 hover:scale-125"
              />
              <text 
                x={pos.x} 
                y={pos.y + 3} 
                textAnchor="middle" 
                fontSize="7" 
                fontWeight="extrabold" 
                fill="#ffffff"
              >
                {d.bloodGroup}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Map Control Buttons */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button 
          onClick={() => setZoom(prev => Math.min(2.5, prev + 0.25))}
          className="w-8 h-8 rounded-xl bg-slate-800/90 text-white border border-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-700 shadow-md"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setZoom(prev => Math.max(0.75, prev - 0.25))}
          className="w-8 h-8 rounded-xl bg-slate-800/90 text-white border border-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-700 shadow-md"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* Map Layer Toggles */}
      <div className="absolute bottom-4 left-4 flex gap-2">
        <button 
          onClick={() => setShowDonors(!showDonors)}
          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer shadow-md select-none transition-colors ${
            showDonors 
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
              : 'bg-slate-800/60 text-slate-400 border-slate-700/60'
          }`}
        >
          Donors
        </button>
        <button 
          onClick={() => setShowRequests(!showRequests)}
          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer shadow-md select-none transition-colors ${
            showRequests 
              ? 'bg-red-500/20 text-red-400 border-red-500/30' 
              : 'bg-slate-800/60 text-slate-400 border-slate-700/60'
          }`}
        >
          Requests
        </button>
      </div>      {/* Selected Point Information Overlay card */}
      {selectedPoint && (
        <div className="absolute bottom-4 right-4 left-18 bg-white/95 dark:bg-zinc-900/95 border border-rose-100 dark:border-zinc-800/40 rounded-2xl p-3 text-slate-900 dark:text-zinc-100 backdrop-blur-md shadow-xl flex items-start gap-2.5 animate-slide-up">
          <div className="flex-1 min-w-0 text-left">
            {/* Render based on point type */}
            {selectedPoint.type === 'hospital' ? (
              <>
                <h4 className="text-xs font-bold text-blue-500 dark:text-blue-400 flex items-center gap-1.5 leading-none">
                  <Building2 className="w-3.5 h-3.5" /> Medical Center
                </h4>
                <p className="text-sm font-semibold truncate mt-1">{selectedPoint.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-zinc-500 mt-0.5">Primary emergency hospital partner</p>
              </>
            ) : selectedPoint.patientName ? (
              // Active request
              <>
                <h4 className="text-xs font-bold text-primary flex items-center gap-1.5 leading-none">
                  <Siren className="w-3.5 h-3.5 animate-pulse" /> {selectedPoint.urgencyLevel} Alert • {selectedPoint.bloodGroup}
                </h4>
                <p className="text-sm font-semibold truncate mt-1">Patient: {selectedPoint.patientName}</p>
                <p className="text-[10px] text-slate-500 dark:text-zinc-550 truncate mt-0.5">Location: {selectedPoint.hospitalName || selectedPoint.location}</p>
              </>
            ) : (
              // Available donor
              <>
                <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 leading-none">
                  <Heart className="w-3.5 h-3.5 fill-current text-emerald-500" /> Donor Match • {selectedPoint.bloodGroup}
                </h4>
                <p className="text-sm font-semibold truncate mt-1">{selectedPoint.fullName}</p>
                <p className="text-[10px] text-slate-500 dark:text-zinc-500 mt-0.5 flex items-center gap-2">
                  <span>Dist: {selectedPoint.distance} km</span>
                  {selectedPoint.matchScore && <span>Match: {selectedPoint.matchScore}%</span>}
                </p>
              </>
            )}
          </div>
          <button 
            onClick={() => setSelectedPoint(null)}
            className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800/40 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// Inline Mini Close Icon for tooltip
function X({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
