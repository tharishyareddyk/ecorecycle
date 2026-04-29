import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import api from '../../utils/api';
import { WASTE_CATEGORIES } from '../../utils/constants';

// Fix default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CERT_TYPES = [
  'CPCB Authorization (Central Pollution Control Board)',
  'SPCB Authorization (State Pollution Control Board)',
  'ISO 14001 Environmental Management',
  'E-Waste Recycler Registration Certificate',
  'Pollution Under Control Certificate',
  'Other',
];

// Component that listens for map clicks and sets the marker
function MapClickHandler({ onLocationPick }) {
  useMapEvents({
    click(e) {
      onLocationPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function FacilitySetup() {
  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // 'gps' | 'manual' | 'map'
  const [locationMethod, setLocationMethod] = useState('gps');
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    address: { street: '', city: '', state: '', pincode: '' },
    location: { type: 'Point', coordinates: [0, 0] },
    acceptedWasteTypes: [],
    operatingHours: { weekdays: '9:00 AM - 6:00 PM', weekends: '10:00 AM - 4:00 PM' },
    compensationRates: {},
    certifications: [],
  });

  const [newCert, setNewCert] = useState({
    name: '', issuedBy: '', validUntil: '', documentBase64: '', fileName: ''
  });

  useEffect(() => {
    api.get('/recycler/stats').then(r => {
      if (r.data.facility?.name) {
        api.get('/facilities').then(fr => {
          const f = fr.data.facilities?.find(fac => fac.name === r.data.facility.name);
          if (f) {
            setFacility(f);
            setForm({
              name: f.name || '',
              email: f.email || '',
              phone: f.phone || '',
              address: f.address || { street: '', city: '', state: '', pincode: '' },
              location: f.location || { type: 'Point', coordinates: [0, 0] },
              acceptedWasteTypes: f.acceptedWasteTypes || [],
              operatingHours: f.operatingHours || { weekdays: '', weekends: '' },
              compensationRates: f.compensationRates || {},
              certifications: f.certifications || [],
            });
            // Pre-fill manual fields if location exists
            const coords = f.location?.coordinates;
            if (coords && coords[0] !== 0) {
              setManualLat(coords[1].toString());
              setManualLng(coords[0].toString());
            }
          }
        });
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Helper to update location in form
  const applyCoords = (lat, lng) => {
    setForm(f => ({ ...f, location: { type: 'Point', coordinates: [lng, lat] } }));
  };

  // GPS method
  const useMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        applyCoords(lat, lng);
        setManualLat(lat.toFixed(6));
        setManualLng(lng.toFixed(6));
        setMsg('✅ Location captured from GPS!');
      }, () => {
        setMsg('❌ Could not get GPS location. Try another method.');
      });
    } else {
      setMsg('❌ Geolocation not supported in this browser.');
    }
  };

  // Manual coordinate entry
  const applyManualCoords = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setMsg('❌ Invalid coordinates. Latitude must be −90 to 90, Longitude −180 to 180.');
      return;
    }
    applyCoords(lat, lng);
    setMsg('✅ Coordinates set!');
  };

  // Map click handler
  const handleMapPick = (lat, lng) => {
    applyCoords(lat, lng);
    setManualLat(lat.toFixed(6));
    setManualLng(lng.toFixed(6));
    setMsg('✅ Location pinned on map!');
  };

  const locationSet = form.location.coordinates[0] !== 0 || form.location.coordinates[1] !== 0;
  const currentLat = form.location.coordinates[1];
  const currentLng = form.location.coordinates[0];

  const toggleWasteType = (type) => {
    setForm(f => ({
      ...f,
      acceptedWasteTypes: f.acceptedWasteTypes.includes(type)
        ? f.acceptedWasteTypes.filter(t => t !== type)
        : [...f.acceptedWasteTypes, type]
    }));
  };

  const handleCertFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setMsg('❌ File too large. Max 5MB.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setNewCert(c => ({ ...c, documentBase64: ev.target.result, fileName: file.name }));
    };
    reader.readAsDataURL(file);
  };

  const addCertification = () => {
    if (!newCert.name || !newCert.issuedBy || !newCert.validUntil) {
      setMsg('❌ Please fill in all certification fields.'); return;
    }
    if (!newCert.documentBase64) {
      setMsg('❌ Please upload the certification document.'); return;
    }
    setForm(f => ({
      ...f,
      certifications: [...f.certifications, {
        name: newCert.name,
        issuedBy: newCert.issuedBy,
        validUntil: newCert.validUntil,
        documentUrl: newCert.documentBase64,
        fileName: newCert.fileName,
      }]
    }));
    setNewCert({ name: '', issuedBy: '', validUntil: '', documentBase64: '', fileName: '' });
    setMsg('✅ Certification added!');
  };

  const removeCert = (i) => {
    setForm(f => ({ ...f, certifications: f.certifications.filter((_, idx) => idx !== i) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.certifications.length === 0) {
      setMsg('❌ Please add at least one certification (CPCB/SPCB authorization is mandatory).'); return;
    }
    setSaving(true); setMsg('');
    try {
      if (facility) {
        await api.put(`/facilities/${facility._id}`, form);
      } else {
        const { data } = await api.post('/facilities', form);
        setFacility(data.facility);
      }
      setMsg('✅ Facility saved! Pending admin verification.');
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.message || 'Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-spin">♻️</div>
        <div className="text-gray-500">Loading facility details...</div>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">{facility ? '🏭 Manage Facility' : '🏭 Register Facility'}</h1>
        <p className="text-gray-500 mt-1">{facility ? 'Update your facility information' : 'Register your recycling facility on EcoRecycle'}</p>
      </div>

      {/* Verification status */}
      {facility && (
        <div className={`rounded-2xl p-4 flex items-center gap-3 ${facility.isVerified
          ? 'bg-emerald-50 border-2 border-emerald-200'
          : 'bg-amber-50 border-2 border-amber-200'}`}>
          <span className="text-2xl">{facility.isVerified ? '✅' : '⏳'}</span>
          <div>
            <div className={`font-bold text-sm ${facility.isVerified ? 'text-emerald-800' : 'text-amber-800'}`}>
              {facility.isVerified ? 'Facility Verified — Visible to Users' : 'Pending Admin Verification'}
            </div>
            <div className={`text-xs mt-0.5 ${facility.isVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
              {facility.isVerified
                ? 'Your facility appears on the map for users to find.'
                : 'Admin will review your certifications and verify your facility. You will be notified.'}
            </div>
          </div>
        </div>
      )}

      {msg && (
        <div className={`text-sm px-4 py-3 rounded-xl font-medium ${msg.startsWith('✅')
          ? 'bg-emerald-50 border-2 border-emerald-200 text-emerald-800'
          : 'bg-red-50 border-2 border-red-200 text-red-800'}`}>{msg}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Basic info */}
        <div className="card space-y-4">
          <div className="section-title">📋 Basic Information</div>
          <div>
            <label className="label">Facility Name</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. GreenCycle Solutions" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Contact Email</label>
              <input type="email" className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Contact Phone</label>
              <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
            </div>
          </div>
        </div>

        {/* Address & Location */}
        <div className="card space-y-4">
          <div className="section-title">📍 Address & GPS Location</div>

          <input className="input" placeholder="Street / Area" value={form.address.street} onChange={e => setForm(f => ({ ...f, address: { ...f.address, street: e.target.value } }))} />
          <div className="grid grid-cols-2 gap-3">
            <input className="input" placeholder="City" value={form.address.city} onChange={e => setForm(f => ({ ...f, address: { ...f.address, city: e.target.value } }))} required />
            <input className="input" placeholder="State" value={form.address.state} onChange={e => setForm(f => ({ ...f, address: { ...f.address, state: e.target.value } }))} />
          </div>
          <input className="input" placeholder="PIN Code" value={form.address.pincode} onChange={e => setForm(f => ({ ...f, address: { ...f.address, pincode: e.target.value } }))} />

          {/* Location method selector */}
          <div>
            <label className="label">Set GPS Coordinates</label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { value: 'gps', icon: '📡', label: 'Auto-detect' },
                { value: 'manual', icon: '⌨️', label: 'Enter Coords' },
                { value: 'map', icon: '🗺️', label: 'Pick on Map' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLocationMethod(opt.value)}
                  className={`py-2 px-3 rounded-xl border-2 text-sm font-medium transition-all flex flex-col items-center gap-1
                    ${locationMethod === opt.value
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  <span className="text-lg">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>

            {/* GPS method */}
            {locationMethod === 'gps' && (
              <div className="flex items-center gap-3">
                <button type="button" className="btn-secondary text-sm py-2" onClick={useMyLocation}>
                  📡 Use My Current Location
                </button>
                <span className="text-xs text-gray-400">
                  Requires browser permission
                </span>
              </div>
            )}

            {/* Manual coordinate entry */}
            {locationMethod === 'manual' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Latitude</label>
                    <input
                      className="input font-mono"
                      placeholder="e.g. 17.3850"
                      value={manualLat}
                      onChange={e => setManualLat(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Longitude</label>
                    <input
                      className="input font-mono"
                      placeholder="e.g. 78.4867"
                      value={manualLng}
                      onChange={e => setManualLng(e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  💡 You can find coordinates via <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">Google Maps</a> → right-click your location → copy the numbers shown.
                </p>
                <button type="button" className="btn-secondary text-sm py-2" onClick={applyManualCoords}>
                  ✅ Set These Coordinates
                </button>
              </div>
            )}

            {/* Map picker */}
            {locationMethod === 'map' && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">🖱️ Click anywhere on the map to pin your facility's location.</p>
                <div className="rounded-xl overflow-hidden border-2 border-gray-200" style={{ height: '300px' }}>
                  <MapContainer
                    center={locationSet ? [currentLat, currentLng] : [17.385, 78.486]}
                    zoom={locationSet ? 15 : 12}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapClickHandler onLocationPick={handleMapPick} />
                    {locationSet && (
                      <Marker position={[currentLat, currentLng]} />
                    )}
                  </MapContainer>
                </div>
              </div>
            )}

            {/* Location status indicator — always visible */}
            <div className={`mt-3 flex items-center gap-2 text-xs px-3 py-2 rounded-lg
              ${locationSet ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
              <span>{locationSet ? '✅' : '⚠️'}</span>
              <span className="font-mono">
                {locationSet
                  ? `Lat: ${currentLat.toFixed(5)}, Lng: ${currentLng.toFixed(5)}`
                  : 'No location set — required for map visibility'}
              </span>
            </div>
          </div>
        </div>

        {/* Operating hours */}
        <div className="card space-y-4">
          <div className="section-title">⏰ Operating Hours</div>
          <div>
            <label className="label">Weekdays</label>
            <input className="input" placeholder="e.g. 9:00 AM - 6:00 PM" value={form.operatingHours.weekdays} onChange={e => setForm(f => ({ ...f, operatingHours: { ...f.operatingHours, weekdays: e.target.value } }))} />
          </div>
          <div>
            <label className="label">Weekends</label>
            <input className="input" placeholder="e.g. 10:00 AM - 4:00 PM or Closed" value={form.operatingHours.weekends} onChange={e => setForm(f => ({ ...f, operatingHours: { ...f.operatingHours, weekends: e.target.value } }))} />
          </div>
        </div>

        {/* Accepted waste types */}
        <div className="card space-y-4">
          <div className="section-title">♻️ Accepted Waste Types</div>
          <div className="grid grid-cols-2 gap-2">
            {WASTE_CATEGORIES.map(cat => (
              <label key={cat.value} className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all
                ${form.acceptedWasteTypes.includes(cat.value)
                  ? 'border-emerald-400 bg-emerald-50'
                  : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="checkbox" className="sr-only" checked={form.acceptedWasteTypes.includes(cat.value)} onChange={() => toggleWasteType(cat.value)} />
                <span className="text-lg">{cat.icon}</span>
                <span className="text-xs font-medium text-gray-700">{cat.label}</span>
                {form.acceptedWasteTypes.includes(cat.value) && <span className="ml-auto text-emerald-500 text-sm font-bold">✓</span>}
              </label>
            ))}
          </div>
        </div>

        {/* Compensation rates */}
        {form.acceptedWasteTypes.length > 0 && (
          <div className="card space-y-4">
            <div className="section-title">💰 Compensation Rates (₹ per kg)</div>
            <p className="text-xs text-gray-500">Set how much you pay users per kg for each accepted waste type.</p>
            <div className="grid grid-cols-2 gap-3">
              {form.acceptedWasteTypes.map(type => {
                const cat = WASTE_CATEGORIES.find(c => c.value === type);
                return (
                  <div key={type}>
                    <label className="label text-xs">{cat?.icon} {cat?.label}</label>
                    <input type="number" className="input" placeholder="₹/kg"
                      value={form.compensationRates[type] || ''}
                      onChange={e => setForm(f => ({ ...f, compensationRates: { ...f.compensationRates, [type]: parseFloat(e.target.value) || 0 } }))} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Certifications */}
        <div className="card space-y-4">
          <div className="section-title">📜 Certifications & Permits</div>
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-3 text-sm text-amber-800">
            <strong>⚠️ Mandatory:</strong> E-waste recycling facilities in India must have authorization from CPCB or SPCB. Upload your certificates below. Admin will verify before your facility goes live.
          </div>

          {form.certifications.length > 0 && (
            <div className="space-y-2">
              {form.certifications.map((cert, i) => (
                <div key={i} className="flex items-center justify-between bg-emerald-50 border-2 border-emerald-200 rounded-xl p-3">
                  <div>
                    <div className="font-semibold text-emerald-900 text-sm">{cert.name}</div>
                    <div className="text-xs text-emerald-700 mt-0.5">
                      Issued by: {cert.issuedBy} · Valid until: {cert.validUntil ? new Date(cert.validUntil).toLocaleDateString('en-IN') : '—'}
                    </div>
                    {cert.fileName && <div className="text-xs text-gray-500 mt-0.5">📎 {cert.fileName}</div>}
                  </div>
                  <button type="button" onClick={() => removeCert(i)} className="text-red-400 hover:text-red-600 text-sm font-bold ml-3">✕</button>
                </div>
              ))}
            </div>
          )}

          <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 space-y-3">
            <div className="text-sm font-semibold text-gray-700">➕ Add Certification</div>
            <div>
              <label className="label">Certification Type</label>
              <select className="input" value={newCert.name} onChange={e => setNewCert(c => ({ ...c, name: e.target.value }))}>
                <option value="">Select certification type</option>
                {CERT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Issued By</label>
                <input className="input" placeholder="e.g. CPCB, ISO, SPCB Telangana"
                  value={newCert.issuedBy} onChange={e => setNewCert(c => ({ ...c, issuedBy: e.target.value }))} />
              </div>
              <div>
                <label className="label">Valid Until</label>
                <input type="date" className="input" value={newCert.validUntil} onChange={e => setNewCert(c => ({ ...c, validUntil: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label">Upload Document (PDF / Image, max 5MB)</label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleCertFile}
                className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer" />
              {newCert.fileName && <div className="text-xs text-emerald-600 mt-1">✅ {newCert.fileName} ready to upload</div>}
            </div>
            <button type="button" className="btn-secondary text-sm w-full" onClick={addCertification}>
              ➕ Add This Certification
            </button>
          </div>
        </div>

        <button type="submit" className="btn-primary w-full py-3 text-base" disabled={saving}>
          {saving ? '⏳ Saving...' : facility ? '💾 Update Facility' : '🏭 Register Facility'}
        </button>
      </form>
    </div>
  );
}
