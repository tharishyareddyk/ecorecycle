import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import api from '../utils/api';
import { WASTE_CATEGORIES } from '../utils/constants';

// Fix default leaflet marker icons
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

export default function FindFacilities() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPos, setUserPos] = useState([17.385, 78.486]); // Default Hyderabad
  const [wasteFilter, setWasteFilter] = useState('');
  const [selected, setSelected] = useState(null);

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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find Recycling Facilities</h1>
        <p className="text-gray-500 mt-1">GPS-based facility recommendations near you</p>
      </div>

      {/* Filter */}
      <div className="flex gap-3 flex-wrap items-center">
        <select className="input max-w-xs" value={wasteFilter} onChange={e => setWasteFilter(e.target.value)}>
          <option value="">All Waste Types</option>
          {WASTE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
        </select>
        <span className="text-sm text-gray-500">{facilities.length} facility(ies) found</span>
      </div>

      <div className="grid lg:grid-cols-5 gap-4" style={{ minHeight: '70vh' }}>
        {/* List */}
        <div className="lg:col-span-2 space-y-3 overflow-y-auto" style={{ maxHeight: '70vh' }}>
          {loading ? (
            <div className="text-center py-12 text-gray-400">Searching...</div>
          ) : facilities.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-3">📍</div>
              <p className="text-gray-500">No facilities found. Try expanding your search or remove the filter.</p>
            </div>
          ) : (
            facilities.map(f => (
              <div key={f._id}
                onClick={() => setSelected(f)}
                className={`card cursor-pointer hover:border-primary-200 transition-all
                  ${selected?._id === f._id ? 'border-primary-400 shadow-md' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="font-semibold text-gray-900">{f.name}</div>
                  {f.isVerified && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex-shrink-0">✓ Certified</span>}
                </div>
                <div className="text-sm text-gray-500">{f.address?.street}, {f.address?.city}</div>
                <div className="text-sm text-gray-500 mt-0.5">📞 {f.phone}</div>
                <div className="text-xs text-gray-400 mt-1">⏰ {f.operatingHours?.weekdays || 'Contact for hours'}</div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {f.acceptedWasteTypes?.slice(0, 3).map(t => (
                    <span key={t} className="bg-primary-50 text-primary-700 text-xs px-2 py-0.5 rounded">{t.replace(/_/g, ' ')}</span>
                  ))}
                  {f.acceptedWasteTypes?.length > 3 && (
                    <span className="text-xs text-gray-400">+{f.acceptedWasteTypes.length - 3} more</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Map */}
        <div className="lg:col-span-3 rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ minHeight: '400px' }}>
          <MapContainer center={userPos} zoom={12} style={{ height: '100%', minHeight: '400px', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* User marker */}
            <Marker position={userPos}>
              <Popup>📍 Your Location</Popup>
            </Marker>
            {/* Facility markers */}
            {facilities.map(f => {
              const coords = f.location?.coordinates;
              if (!coords || coords[0] === 0) return null;
              return (
                <Marker key={f._id} position={[coords[1], coords[0]]} icon={greenIcon}
                  eventHandlers={{ click: () => setSelected(f) }}>
                  <Popup>
                    <div className="text-sm">
                      <strong>{f.name}</strong><br />
                      {f.address?.street}, {f.address?.city}<br />
                      {f.isVerified && <span className="text-green-600">✓ Certified</span>}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="card border-primary-200 bg-primary-50">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">{selected.name}</h2>
              <p className="text-sm text-gray-600">{selected.address?.street}, {selected.address?.city}, {selected.address?.state}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-700 mb-1">📞 Contact</div>
              <div>{selected.phone}</div>
              <div className="text-gray-500">{selected.email}</div>
            </div>
            <div>
              <div className="font-medium text-gray-700 mb-1">⏰ Hours</div>
              <div>Weekdays: {selected.operatingHours?.weekdays || '—'}</div>
              <div>Weekends: {selected.operatingHours?.weekends || '—'}</div>
            </div>
            <div>
              <div className="font-medium text-gray-700 mb-1">✅ Certifications</div>
              {selected.certifications?.length ? selected.certifications.map((c, i) => (
                <div key={i}>{c.name} ({c.issuedBy})</div>
              )) : <div className="text-gray-400">None listed</div>}
            </div>
          </div>
          {selected.collectionEvents?.length > 0 && (
            <div className="mt-4">
              <div className="font-medium text-gray-700 mb-2">📅 Upcoming Collection Events</div>
              {selected.collectionEvents.slice(0, 3).map((ev, i) => (
                <div key={i} className="bg-white rounded-lg p-3 text-sm mb-2">
                  <strong>{ev.title}</strong> — {new Date(ev.date).toLocaleDateString('en-IN')} at {ev.location}
                  {ev.description && <p className="text-gray-500 mt-0.5">{ev.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
