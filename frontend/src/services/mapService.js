import { searchKeralaPlaces } from '../data/keralaPlacesData';

/**
 * Map & Geocoding Service
 * Powered by OpenStreetMap Open Source APIs + Kerala Curated Database:
 * - Local Kerala Places & Hospitals Engine
 * - Photon (Search / Autocomplete by Komoot with Kerala Bounding Box Biasing)
 * - Nominatim (Reverse Geocoding)
 * - OSRM (Open Source Routing Machine for Distance & Driving Polyline Routes)
 */

/**
 * Photon OpenStreetMap Search & Autocomplete (Kerala-aware & Biased)
 * @param {string} query Search text
 * @param {object} options { limit: number, lat: number, lng: number }
 * @returns {Promise<Array<{id: string|number, displayName: string, lat: number, lng: number, city: string, state: string, country: string, isKeralaPreset?: boolean}>>}
 */
export async function searchLocationPhoton(query, options = {}) {
  if (!query || query.trim().length < 2) return [];

  const { limit = 8, lat = 10.8505, lng = 76.2711 } = options;

  // 1. Fetch Instant Kerala Local Dataset Matches
  const localKeralaMatches = searchKeralaPlaces(query, 4);

  // 2. Query Photon OSM API with Kerala Bounding Box and Proximity Bias
  // Kerala bounding box: [Min Lng: 74.85, Min Lat: 8.28, Max Lng: 77.58, Max Lat: 12.79]
  let searchQuery = query.trim();
  if (!searchQuery.toLowerCase().includes('kerala') && !searchQuery.toLowerCase().includes('india')) {
    searchQuery = `${searchQuery}, Kerala`;
  }

  const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&bbox=74.85,8.28,77.58,12.79&lat=${lat}&lon=${lng}&limit=${limit}`;

  let photonResults = [];
  try {
    const res = await fetch(photonUrl, { headers: { 'Accept': 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.features)) {
        photonResults = data.features.map((feature, idx) => {
          const props = feature.properties || {};
          const coords = feature.geometry?.coordinates || [0, 0];
          const lngVal = coords[0];
          const latVal = coords[1];

          // Format clean readable address
          const parts = [
            props.name,
            props.street ? (props.housenumber ? `${props.housenumber} ${props.street}` : props.street) : null,
            props.district || props.suburb || props.locality,
            props.city || props.town || props.village || props.county,
            props.state,
            props.country
          ].filter(Boolean);

          const uniqueParts = parts.filter((item, pos, self) => self.indexOf(item) === pos);
          const displayName = uniqueParts.join(', ') || props.name || 'Location in Kerala';

          return {
            id: props.osm_id || `photon-${idx}-${Date.now()}`,
            displayName,
            name: props.name || displayName.split(',')[0],
            lat: latVal,
            lng: lngVal,
            city: props.city || props.town || props.village || props.county || props.district || '',
            state: props.state || 'Kerala',
            country: props.country || 'India',
            postcode: props.postcode || '',
            raw: feature
          };
        });
      }
    }
  } catch (err) {
    console.error('Photon autocomplete fetch error:', err);
  }

  // 3. Combine Local Kerala Preset Matches & Photon Results, Removing Duplicates
  const combined = [...localKeralaMatches];
  const seenNames = new Set(localKeralaMatches.map(m => m.name.toLowerCase()));

  for (const item of photonResults) {
    const itemNameLower = item.name.toLowerCase();
    if (!seenNames.has(itemNameLower)) {
      seenNames.add(itemNameLower);
      combined.push(item);
    }
  }

  return combined.slice(0, limit);
}

/**
 * Nominatim Reverse Geocoding
 * Converts [lat, lng] into address details
 */
export async function reverseGeocodeNominatim(lat, lng) {
  if (!lat || !lng) return null;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );

    if (!res.ok) throw new Error(`Nominatim reverse geocode failed: ${res.status}`);
    const data = await res.json();

    const addr = data.address || {};
    const city = addr.city || addr.town || addr.village || addr.suburb || addr.county || '';
    const district = addr.state_district || addr.county || addr.district || '';
    const state = addr.state || '';

    return {
      displayName: data.display_name || 'Selected Location',
      address: addr,
      city,
      district,
      state,
      postcode: addr.postcode || '',
      lat: parseFloat(data.lat || lat),
      lng: parseFloat(data.lon || lng),
      raw: data
    };
  } catch (err) {
    console.error('Nominatim reverse geocode error:', err);
    return {
      displayName: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      address: {},
      city: '',
      district: '',
      state: '',
      lat,
      lng
    };
  }
}

/**
 * OSRM Driving Route & Distance Calculation
 * Fetches real driving route geometry and distance between start and end coordinates.
 * @param {{lat: number, lng: number}} start 
 * @param {{lat: number, lng: number}} end 
 * @param {'driving'|'walking'|'cycling'} profile 
 */
export async function getOSRMRoute(start, end, profile = 'driving') {
  if (!start || !end || !start.lat || !start.lng || !end.lat || !end.lng) {
    return { found: false, error: 'Invalid coordinates' };
  }

  const url = `https://router.project-osrm.org/route/v1/${profile}/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OSRM routing failed: ${res.status}`);
    const data = await res.json();

    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const distanceKm = Math.round((route.distance / 1000) * 10) / 10; // in KM
      const durationMins = Math.round(route.duration / 60); // in minutes

      return {
        found: true,
        distanceKm,
        durationMins,
        geometry: route.geometry, // GeoJSON LineString
        coordinates: route.geometry.coordinates, // [[lng, lat], ...]
        raw: route
      };
    }
    return { found: false, error: 'No route found' };
  } catch (err) {
    console.error('OSRM route error:', err);
    // Fallback to Haversine straight-line distance computation
    const haversineDist = calculateHaversineDistance(start.lat, start.lng, end.lat, end.lng);
    return {
      found: false,
      distanceKm: Math.round(haversineDist * 10) / 10,
      durationMins: Math.round(haversineDist * 2), // rough estimate
      geometry: {
        type: 'LineString',
        coordinates: [[start.lng, start.lat], [end.lng, end.lat]]
      },
      coordinates: [[start.lng, start.lat], [end.lng, end.lat]],
      isFallback: true
    };
  }
}

/**
 * Haversine formula distance fallback (straight line in km)
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
