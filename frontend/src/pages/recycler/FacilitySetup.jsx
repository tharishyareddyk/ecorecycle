import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { WASTE_CATEGORIES } from '../../utils/constants';

export default function FacilitySetup() {
  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    address: { street: '', city: '', state: '', pincode: '' },
    location: { type: 'Point', coordinates: [0, 0] },
    acceptedWasteTypes: [],
    operatingHours: { weekdays: '9:00 AM - 6:00 PM', weekends: '10:00 AM - 4:00 PM' },
    compensationRates: {},
  });

  useEffect(() => {
    // Try loading existing facility via stats endpoint
    api.get('/recycler/stats').then(r => {
      if (r.data.facility?.name) {
        // Facility exists - fetch full details by searching
        api.get('/facilities').then(fr => {
          // find by name match (basic)
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
            });
          }
        });
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const useMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setForm(f => ({ ...f, location: { type: 'Point', coordinates: [pos.coords.longitude, pos.coords.latitude] } }));
        setMsg('✅ Location captured!');
      });
    }
  };

  const toggleWasteType = (type) => {
    setForm(f => ({
      ...f,
      acceptedWasteTypes: f.acceptedWasteTypes.includes(type)
        ? f.acceptedWasteTypes.filter(t => t !== type)
        : [...f.acceptedWasteTypes, type]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      if (facility) {
        await api.put(`/facilities/${facility._id}`, form);
      } else {
        const { data } = await api.post('/facilities', form);
        setFacility(data.facility);
      }
      setMsg('✅ Facility saved successfully!');
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.message || 'Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{facility ? 'Manage Facility' : 'Register Facility'}</h1>
        <p className="text-gray-500 mt-1">{facility ? 'Update your facility information' : 'Register your recycling facility on EcoRecycle'}</p>
      </div>

      {msg && <div className={`text-sm px-4 py-3 rounded-lg ${msg.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Basic Information</h2>
          <div>
            <label className="label">Facility Name</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
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
          <h2 className="font-semibold text-gray-900">Address & GPS Location</h2>
          <input className="input" placeholder="Street" value={form.address.street} onChange={e => setForm(f => ({ ...f, address: { ...f.address, street: e.target.value } }))} />
          <div className="grid grid-cols-2 gap-3">
            <input className="input" placeholder="City" value={form.address.city} onChange={e => setForm(f => ({ ...f, address: { ...f.address, city: e.target.value } }))} required />
            <input className="input" placeholder="State" value={form.address.state} onChange={e => setForm(f => ({ ...f, address: { ...f.address, state: e.target.value } }))} />
          </div>
          <input className="input" placeholder="PIN Code" value={form.address.pincode} onChange={e => setForm(f => ({ ...f, address: { ...f.address, pincode: e.target.value } }))} />
          <div className="flex items-center gap-3">
            <button type="button" className="btn-secondary text-sm" onClick={useMyLocation}>📍 Use My Location</button>
            <span className="text-xs text-gray-400">
              {form.location.coordinates[0] !== 0 ? `Lat: ${form.location.coordinates[1].toFixed(4)}, Lng: ${form.location.coordinates[0].toFixed(4)}` : 'No location set'}
            </span>
          </div>
        </div>

        {/* Operating hours */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Operating Hours</h2>
          <div>
            <label className="label">Weekdays</label>
            <input className="input" placeholder="e.g. 9:00 AM - 6:00 PM" value={form.operatingHours.weekdays} onChange={e => setForm(f => ({ ...f, operatingHours: { ...f.operatingHours, weekdays: e.target.value } }))} />
          </div>
          <div>
            <label className="label">Weekends</label>
            <input className="input" placeholder="e.g. 10:00 AM - 4:00 PM" value={form.operatingHours.weekends} onChange={e => setForm(f => ({ ...f, operatingHours: { ...f.operatingHours, weekends: e.target.value } }))} />
          </div>
        </div>

        {/* Accepted waste types */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Accepted Waste Types</h2>
          <div className="grid grid-cols-2 gap-2">
            {WASTE_CATEGORIES.map(cat => (
              <label key={cat.value} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors
                ${form.acceptedWasteTypes.includes(cat.value) ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="checkbox" className="sr-only" checked={form.acceptedWasteTypes.includes(cat.value)} onChange={() => toggleWasteType(cat.value)} />
                <span className="text-lg">{cat.icon}</span>
                <span className="text-xs font-medium text-gray-700">{cat.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Compensation rates */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Compensation Rates (₹ per kg)</h2>
          <p className="text-xs text-gray-500">Set rates for waste types you accept. Leave blank to use defaults.</p>
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

        <button type="submit" className="btn-primary w-full py-3" disabled={saving}>
          {saving ? 'Saving...' : facility ? '💾 Update Facility' : '🏭 Register Facility'}
        </button>
      </form>
    </div>
  );
}
