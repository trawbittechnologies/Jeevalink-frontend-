import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { reverseGeocodeNominatim, getOSRMRoute } from '../services/mapService';
import { Navigation, Layers } from 'lucide-react';

export default function MapLibreContainer({
  donors = [],
  requests = [],
  center = { lat: 12.9716, lng: 77.5946 },
  zoom = 12,
  interactive = true,
  isPicker = false,
  pickerLocation = null,
  onLocationPicked = null,
  routeStart = null, // { lat, lng }
  routeEnd = null,   // { lat, lng }
  height = '100%',
  className = ''
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const routeLayerAddedRef = useRef(false);

  const [routeInfo, setRouteInfo] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [tileStyle, setTileStyle] = useState('osm'); // 'osm' | 'dark' | 'positron'

  // OpenStreetMap Tile Styles
  const TILE_STYLES = {
    osm: {
      version: 8,
      sources: {
        'osm-tiles': {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }
      },
      layers: [{ id: 'osm-tiles-layer', type: 'raster', source: 'osm-tiles', minzoom: 0, maxzoom: 19 }]
    },
    dark: {
      version: 8,
      sources: {
        'carto-dark': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap &copy; CARTO'
        }
      },
      layers: [{ id: 'carto-dark-layer', type: 'raster', source: 'carto-dark', minzoom: 0, maxzoom: 19 }]
    },
    positron: {
      version: 8,
      sources: {
        'carto-light': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
            'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap &copy; CARTO'
        }
      },
      layers: [{ id: 'carto-light-layer', type: 'raster', source: 'carto-light', minzoom: 0, maxzoom: 19 }]
    }
  };

  // 1. Initialize MapLibre GL JS Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: TILE_STYLES[tileStyle],
      center: [center.lng, center.lat],
      zoom: zoom,
      interactive: interactive
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

    map.on('load', () => {
      setMapLoaded(true);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Tile Style dynamically
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    mapRef.current.setStyle(TILE_STYLES[tileStyle]);
  }, [tileStyle]);

  // Recenter map if center changes
  useEffect(() => {
    if (!mapRef.current || !center.lat || !center.lng) return;
    mapRef.current.flyTo({
      center: [center.lng, center.lat],
      zoom: zoom,
      essential: true
    });
  }, [center.lat, center.lng, zoom]);

  // 2. Picker Mode Map Clicks & Reverse Geocoding
  useEffect(() => {
    if (!mapRef.current || !isPicker) return;

    const map = mapRef.current;

    async function handleMapClick(e) {
      const { lng, lat } = e.lngLat;
      const geoResult = await reverseGeocodeNominatim(lat, lng);
      if (onLocationPicked) {
        onLocationPicked({
          lat,
          lng,
          displayName: geoResult?.displayName || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          address: geoResult?.address || {},
          city: geoResult?.city || '',
          state: geoResult?.state || ''
        });
      }
    }

    map.on('click', handleMapClick);
    return () => map.off('click', handleMapClick);
  }, [isPicker, onLocationPicked]);

  // 3. Render Custom Markers for Donors, Requests, and Picker Location
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const map = mapRef.current;

    // A. Picker Location Marker
    if (pickerLocation && pickerLocation.lat && pickerLocation.lng) {
      const el = document.createElement('div');
      el.className = 'w-9 h-9 rounded-full bg-rose-600 border-2 border-white text-white shadow-lg flex items-center justify-center animate-bounce cursor-pointer';
      el.innerHTML = `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21s-8-4.5-8-11.8A8 8 0 1120 9.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="9" r="3"/></svg>`;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([pickerLocation.lng, pickerLocation.lat])
        .addTo(map);

      markersRef.current.push(marker);
    }

    // B. Donors Markers
    donors.forEach((donor) => {
      const lat = donor.coordinates?.lat || donor.lat;
      const lng = donor.coordinates?.lng || donor.lng;
      if (!lat || !lng) return;

      const el = document.createElement('div');
      el.className = 'px-2 py-1 bg-emerald-600 text-white font-extrabold text-[11px] rounded-full border-2 border-white shadow-md flex items-center gap-1 cursor-pointer hover:scale-110 transition-transform';
      el.innerHTML = `<span>🩸 ${donor.bloodGroup || 'Donor'}</span>`;

      const popupContent = `
        <div style="font-family: sans-serif; padding: 4px;">
          <strong style="color: #059669; font-size: 13px;">🩸 Available Donor: ${donor.primaryName || donor.name || 'Donor'}</strong>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #4b5563;">Blood Group: <strong>${donor.bloodGroup}</strong></p>
          <p style="margin: 2px 0 0 0; font-size: 11px; color: #6b7280;">District: ${donor.district || 'Nearby'}</p>
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 15 }).setHTML(popupContent);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });

    // C. Requests Markers
    requests.forEach((req) => {
      const lat = req.coordinates?.lat || req.lat;
      const lng = req.coordinates?.lng || req.lng;
      if (!lat || !lng) return;

      const isImmediate = req.urgencyLevel === 'Immediate' || req.urgencyLevel === 'Emergency SOS';

      const el = document.createElement('div');
      el.className = `px-2 py-1 text-white font-extrabold text-[11px] rounded-full border-2 border-white shadow-md flex items-center gap-1 cursor-pointer hover:scale-110 transition-transform ${
        isImmediate ? 'bg-red-600 animate-pulse' : 'bg-rose-500'
      }`;
      el.innerHTML = `<span>🚨 ${req.bloodGroup}</span>`;

      const popupContent = `
        <div style="font-family: sans-serif; padding: 4px;">
          <strong style="color: #dc2626; font-size: 13px;">🚨 Patient: ${req.patientName || 'Blood Request'}</strong>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #4b5563;">Required: <strong>${req.bloodGroup} (${req.unitsNeeded || 1} Units)</strong></p>
          <p style="margin: 2px 0 0 0; font-size: 11px; color: #4b5563;">Hospital: ${req.hospitalName || req.location || 'N/A'}</p>
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 15 }).setHTML(popupContent);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [donors, requests, pickerLocation, mapLoaded]);

  // 4. Draw OSRM Routing Layer between routeStart and routeEnd
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;

    async function updateOSRMRoute() {
      if (!routeStart || !routeEnd || !routeStart.lat || !routeStart.lng || !routeEnd.lat || !routeEnd.lng) {
        // Remove route line if existing
        if (map.getSource('osrm-route')) {
          map.removeLayer('osrm-route-line');
          map.removeSource('osrm-route');
          routeLayerAddedRef.current = false;
        }
        setRouteInfo(null);
        return;
      }

      const res = await getOSRMRoute(routeStart, routeEnd);
      if (!res.coordinates || res.coordinates.length < 2) return;

      setRouteInfo({
        distanceKm: res.distanceKm,
        durationMins: res.durationMins,
        isFallback: res.isFallback
      });

      const geojson = {
        type: 'Feature',
        properties: {},
        geometry: res.geometry
      };

      if (map.getSource('osrm-route')) {
        map.getSource('osrm-route').setData(geojson);
      } else {
        map.addSource('osrm-route', {
          type: 'geojson',
          data: geojson
        });

        map.addLayer({
          id: 'osrm-route-line',
          type: 'line',
          source: 'osrm-route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#2563eb',
            'line-width': 5,
            'line-opacity': 0.85
          }
        });
        routeLayerAddedRef.current = true;
      }

      // Fit map bounds to encompass the route
      const bounds = new maplibregl.LngLatBounds();
      res.coordinates.forEach(coord => bounds.extend(coord));
      map.fitBounds(bounds, { padding: 50, maxZoom: 15 });
    }

    updateOSRMRoute();
  }, [routeStart?.lat, routeStart?.lng, routeEnd?.lat, routeEnd?.lng, mapLoaded]);

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 shadow-md ${className}`} style={{ height }}>
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[300px]" />

      {/* Tile Layer Selector Badge */}
      <div className="absolute top-3 left-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-xs flex items-center gap-1.5 z-10 text-xs font-semibold text-slate-700 dark:text-zinc-300">
        <Layers className="w-3.5 h-3.5 text-rose-500" />
        <select
          value={tileStyle}
          onChange={(e) => setTileStyle(e.target.value)}
          className="bg-transparent outline-none cursor-pointer text-xs font-medium"
        >
          <option value="osm">OSM Standard</option>
          <option value="dark">Carto Dark</option>
          <option value="positron">Carto Light</option>
        </select>
      </div>

      {/* OSRM Route Info Overlay Badge */}
      {routeInfo && (
        <div className="absolute bottom-4 left-4 bg-slate-900/90 text-white backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700/60 shadow-xl flex items-center gap-3 z-10 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
            <Navigation className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
              OSRM Driving Route {routeInfo.isFallback && '(Direct)'}
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-3">
              <span>🛣️ {routeInfo.distanceKm} km</span>
              <span>⏱️ ~{routeInfo.durationMins} mins</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
