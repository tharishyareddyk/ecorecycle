import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../utils/api';
import { WASTE_CATEGORIES } from '../utils/constants';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [30, 46], iconAnchor: [15, 46], popupAnchor: [1, -34],
});

// Component to fly map to selected facility
function FlyTo({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, 15, { duration: 1.2 });
  }, [coords, map]);
  return null;
}

export default function FindFacilities() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPos, setUserPos] = useState([17.385, 78.486]);
  const [wasteFilter, setWasteFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [flyCoords, setFlyCoords] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    params.append('lat', userPos[0]);
    params.append('lng', userPos[1]);
    params.append('maxDistance', 50000);
    if (wasteFilter) params.append('wasteType', wasteFilter);

    setLoading(true);
    api.get(`/facilities/nearby?${params}`)
      .then(r => setFacilities(r.data.facilities))
      .catch(() => api.get('/facilities').then(r => setFacilities(r.data.facilities)))
      .finally(() => setLoading(false));
  }, [userPos, wasteFilter]);

  const handleSelect = (f) => {
    setSelected(f);
    const coords = f.location?.coordinates;
    if (coords && coords[0] !== 0) {
      setFlyCoords([coords[1], coords[0]]);
    }
  };

  // Open Google Maps directions from user location to facility
  const openDirections = (facility) => {
    const coords = facility.location?.coordinates;
    if (!coords || coords[0] === 0) {
      // Fall back to address search if no GPS
      const addr = encodeURIComponent(`${facility.address?.street}, ${facility.address?.city}, ${facility.address?.state}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${addr}`, '_blank');
      return;
    }
    const destLat = coords[1];
    const destLng = coords[0];
    const srcLat = userPos[0];
    const srcLng = userPos[1];
    const url = `https://www.google.com/maps/dir/${srcLat},${srcLng}/${destLat},${destLng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black text-gray-900">📍 Find Recycling Facilities</h1>
        <p className="text-gray-500 mt-1">GPS-based recommendations near you</p>
      </div>

      {/* Filter */}
      <div className="flex gap-3 flex-wrap items-center">
        <select className="input max-w-xs" value={wasteFilter} onChange={e => setWasteFilter(e.target.value)}>
          <option value="">All Waste Types</option>
          {WASTE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
        </select>
        <span className="text-sm font-medium text-gray-500 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
          {loading ? '🔍 Searching...' : `✅ ${facilities.length} facility(ies) found`}
        </span>
      </div>

      <div className="grid lg:grid-cols-5 gap-4" style={{ minHeight: '70vh' }}>
        {/* List */}
        <div className="lg:col-span-2 space-y-3 overflow-y-auto pr-1" style={{ maxHeight: '70vh' }}>
          {loading ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-3 animate-spin">🔍</div>
              Searching nearby...
            </div>
          ) : facilities.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-3">😔</div>
              <p className="text-gray-500">No facilities found. Try changing the filter.</p>
            </div>
          ) : (
            facilities.map(f => (
              <div key={f._id}
                onClick={() => handleSelect(f)}
                className={`card cursor-pointer hover-lift transition-all border-2
                  ${selected?._id === f._id ? 'border-emerald-400 shadow-lg shadow-emerald-100' : 'border-transparent hover:border-emerald-200'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="font-bold text-gray-900">{f.name}</div>
                  {f.isVerified && (
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 border border-emerald-200">✓ Verified</span>
                  )}
                </div>
                <div className="text-sm text-gray-500">📍 {f.address?.street}, {f.address?.city}</div>
                <div className="text-sm text-gray-500 mt-0.5">📞 {f.phone}</div>
                <div className="text-xs text-gray-400 mt-0.5">⏰ {f.operatingHours?.weekdays || 'Contact for hours'}</div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {f.acceptedWasteTypes?.slice(0, 3).map(t => {
                    const cat = WASTE_CATEGORIES.find(c => c.value === t);
                    return (
                      <span key={t} className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-lg border border-emerald-200">
                        {cat?.icon} {t.replace(/_/g, ' ')}
                      </span>
                    );
                  })}
                  {f.acceptedWasteTypes?.length > 3 && (
                    <span className="text-xs text-gray-400">+{f.acceptedWasteTypes.length - 3} more</span>
                  )}
                </div>

                {/* View Directions button */}
                <button
                  onClick={(e) => { e.stopPropagation(); openDirections(f); }}
                  className="mt-3 w-full btn-primary text-xs py-2 flex items-center justify-center gap-2">
                  🗺️ View Directions
                </button>
              </div>
            ))
          )}
        </div>

        {/* Map */}
        <div className="lg:col-span-3 rounded-2xl overflow-hidden border-2 border-gray-200 shadow-lg" style={{ minHeight: '400px' }}>
          <MapContainer center={userPos} zoom={12} style={{ height: '100%', minHeight: '400px', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {flyCoords && <FlyTo coords={flyCoords} />}
            {/* User marker */}
            <Marker position={userPos} icon={blueIcon}>
              <Popup>📍 <strong>Your Location</strong></Popup>
            </Marker>
            {/* Facility markers */}
            {facilities.map(f => {
              const coords = f.location?.coordinates;
              if (!coords || coords[0] === 0) return null;
              return (
                <Marker key={f._id} position={[coords[1], coords[0]]} icon={greenIcon}
                  eventHandlers={{ click: () => handleSelect(f) }}>
                  <Popup>
                    <div className="text-sm min-w-[200px]">
                      <strong className="text-emerald-700">{f.name}</strong>
                      <br />{f.address?.street}, {f.address?.city}
                      {f.isVerified && <><br /><span className="text-emerald-600 font-semibold">✓ Verified</span></>}
                      <br />
                      <button
                        onClick={() => openDirections(f)}
                        className="mt-2 w-full bg-emerald-600 text-white text-xs font-bold py-1.5 px-3 rounded-lg hover:bg-emerald-700 transition-colors">
                        🗺️ Get Directions
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="card border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="font-black text-gray-900 text-lg">{selected.name}</h2>
              <p className="text-sm text-gray-600">{selected.address?.street}, {selected.address?.city}, {selected.address?.state}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-white transition-colors">✕</button>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 text-sm mb-4">
            <div className="bg-white rounded-xl p-3">
              <div className="font-bold text-gray-700 mb-1">📞 Contact</div>
              <div>{selected.phone}</div>
              <div className="text-gray-500 text-xs">{selected.email}</div>
            </div>
            <div className="bg-white rounded-xl p-3">
              <div className="font-bold text-gray-700 mb-1">⏰ Hours</div>
              <div>Weekdays: {selected.operatingHours?.weekdays || '—'}</div>
              <div>Weekends: {selected.operatingHours?.weekends || '—'}</div>
            </div>
            <div className="bg-white rounded-xl p-3">
              <div className="font-bold text-gray-700 mb-1">📜 Certifications</div>
              {selected.certifications?.length ? selected.certifications.map((c, i) => (
                <div key={i} className="text-xs">
                  {c.name}
                  {c.documentUrl && (
                    <a href={c.documentUrl} target="_blank" rel="noopener noreferrer"
                      className="ml-1 text-emerald-600 hover:underline">View</a>
                  )}
                </div>
              )) : <div className="text-gray-400 text-xs">None listed</div>}
            </div>
          </div>

          {/* Big directions button in detail panel */}
          <button
            onClick={() => openDirections(selected)}
            className="btn-primary w-full py-3 text-base">
            🗺️ Get Directions to {selected.name}
          </button>

          {selected.collectionEvents?.length > 0 && (
            <div className="mt-4">
              <div className="font-bold text-gray-700 mb-2">📅 Upcoming Collection Events</div>
              {selected.collectionEvents.slice(0, 3).map((ev, i) => (
                <div key={i} className="bg-white rounded-xl p-3 text-sm mb-2 border border-emerald-100">
                  <strong>{ev.title}</strong> — {new Date(ev.date).toLocaleDateString('en-IN')} at {ev.location}
                  {ev.description && <p className="text-gray-500 mt-0.5 text-xs">{ev.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
