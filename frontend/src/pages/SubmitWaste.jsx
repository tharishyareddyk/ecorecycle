import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { WASTE_CATEGORIES, formatCurrency } from '../utils/constants';

const STEPS = ['Classify Waste', 'Select Facility', 'Add Details', 'Schedule', 'Review'];

export default function SubmitWaste() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [allFacilities, setAllFacilities] = useState([]);
  const [loadingFacilities, setLoadingFacilities] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    selectedCategories: [],
    facilityId: '',
    wasteItems: [],
    serviceType: 'drop_off',
    wasteCategory: 'small',
    pickupAddress: { street: '', city: '', state: '', pincode: '' },
    scheduledDate: '',
    scheduledTime: '',
    userNotes: '',
  });

  const selectedFacility = allFacilities.find(f => f._id === form.facilityId);

  useEffect(() => {
    setLoadingFacilities(true);
    const load = (lat, lng) => {
      const url = lat && lng
        ? `/facilities/nearby?lat=${lat}&lng=${lng}&maxDistance=100000`
        : '/facilities';
      api.get(url)
        .then(r => setAllFacilities(r.data.facilities || []))
        .catch(() => api.get('/facilities').then(r => setAllFacilities(r.data.facilities || [])))
        .finally(() => setLoadingFacilities(false));
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => load(pos.coords.latitude, pos.coords.longitude),
        () => load(null, null)
      );
    } else {
      load(null, null);
    }
  }, []);

  const matchingFacilities = allFacilities.filter(f =>
    form.selectedCategories.length === 0 ||
    form.selectedCategories.every(cat => f.acceptedWasteTypes?.includes(cat))
  );

  const toggleCategory = (cat) => {
    setForm(f => {
      const already = f.selectedCategories.includes(cat);
      const updated = already
        ? f.selectedCategories.filter(c => c !== cat)
        : [...f.selectedCategories, cat];
      const items = updated.map(c => ({
        category: c, estimatedWeight: 1, brand: '', model: '', condition: 'unknown', description: ''
      }));
      return { ...f, selectedCategories: updated, wasteItems: items, facilityId: '' };
    });
  };

  const updateItem = (i, field, value) => setForm(f => ({
    ...f,
    wasteItems: f.wasteItems.map((item, idx) => idx === i ? { ...item, [field]: value } : item)
  }));

  const addItem = () => setForm(f => ({
    ...f,
    wasteItems: [...f.wasteItems, {
      category: f.selectedCategories[0] || 'other',
      estimatedWeight: 1, brand: '', model: '', condition: 'unknown', description: ''
    }]
  }));

  const removeItem = (i) => setForm(f => ({ ...f, wasteItems: f.wasteItems.filter((_, idx) => idx !== i) }));

  const totalWeight = form.wasteItems.reduce((s, i) => s + (parseFloat(i.estimatedWeight) || 0), 0);
  const isBulk = totalWeight >= 20 || form.wasteItems.length >= 5;

  const estimatedComp = form.wasteItems.reduce((s, item) => {
    if (!selectedFacility) return s;
    const rate = selectedFacility.compensationRates?.[item.category] || 10;
    return s + rate * (parseFloat(item.estimatedWeight) || 0);
  }, 0);

  useEffect(() => {
    setForm(f => ({
      ...f,
      wasteCategory: isBulk ? 'bulk' : 'small',
      serviceType: isBulk ? f.serviceType : 'drop_off'
    }));
  }, [isBulk]);

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await api.post('/waste', {
        ...form,
        facilityId: form.facilityId,
        pickupAddress: form.serviceType === 'pickup' ? form.pickupAddress : undefined,
      });
      navigate('/my-requests');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Submit E-Waste</h1>
        <p className="text-gray-500 mt-1">Classify your waste first — we will show facilities that accept it</p>
      </div>

      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
              ${i < step ? 'bg-primary-600 text-white' : i === step ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-500' : 'bg-gray-100 text-gray-400'}`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-primary-700' : 'text-gray-400'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${i < step ? 'bg-primary-400' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

      {step === 0 && (
        <div className="card space-y-5">
          <div>
            <h2 className="font-semibold text-gray-900 text-lg">What type of e-waste do you have?</h2>
            <p className="text-sm text-gray-500 mt-1">Select all categories that apply. We will filter facilities accordingly.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {WASTE_CATEGORIES.map(cat => {
              const selected = form.selectedCategories.includes(cat.value);
              return (
                <button key={cat.value} type="button" onClick={() => toggleCategory(cat.value)}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all
                    ${selected ? 'border-primary-500 bg-primary-50 shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                  {selected && (
                    <span className="absolute top-2 right-2 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold">✓</span>
                  )}
                  <span className="text-3xl">{cat.icon}</span>
                  <span className={`text-xs font-medium leading-tight ${selected ? 'text-primary-700' : 'text-gray-700'}`}>{cat.label}</span>
                </button>
              );
            })}
          </div>
          {form.selectedCategories.length > 0 && (
            <div className="bg-primary-50 rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                {form.selectedCategories.map(c => {
                  const cat = WASTE_CATEGORIES.find(x => x.value === c);
                  return (
                    <span key={c} className="bg-primary-600 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                      {cat?.icon} {cat?.label}
                      <button onClick={() => toggleCategory(c)} className="ml-1 text-primary-200 hover:text-white font-bold">x</button>
                    </span>
                  );
                })}
              </div>
              {form.selectedCategories.map(c => {
                const cat = WASTE_CATEGORIES.find(x => x.value === c);
                return cat?.hazard ? (
                  <div key={c} className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-1.5">
                    ⚠️ {cat.label}: {cat.hazard}
                  </div>
                ) : null;
              })}
              {!loadingFacilities && (
                <div className={`text-sm font-medium ${matchingFacilities.length === 0 ? 'text-red-600' : 'text-green-700'}`}>
                  {matchingFacilities.length === 0
                    ? '⚠️ No facilities found that accept all selected types. Try removing some.'
                    : `✅ ${matchingFacilities.length} facility(ies) near you accept all these waste types`}
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end">
            <button className="btn-primary"
              disabled={form.selectedCategories.length === 0 || matchingFacilities.length === 0}
              onClick={() => setStep(1)}>
              Find Matching Facilities →
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="card space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900 text-lg">Select a Recycling Facility</h2>
            <p className="text-sm text-gray-500 mt-1">
              {matchingFacilities.length} facility(ies) accept {form.selectedCategories.map(c => WASTE_CATEGORIES.find(x => x.value === c)?.label).join(', ')}
            </p>
          </div>
          {loadingFacilities ? (
            <div className="text-center py-8 text-gray-400">Finding nearby facilities...</div>
          ) : (
            <div className="space-y-3">
              {matchingFacilities.map(f => {
                const rates = form.selectedCategories.map(c => ({
                  cat: WASTE_CATEGORIES.find(x => x.value === c),
                  rate: f.compensationRates?.[c] || 10
                }));
                return (
                  <label key={f._id} className={`block border-2 rounded-xl p-4 cursor-pointer transition-all
                    ${form.facilityId === f._id ? 'border-primary-500 bg-primary-50 shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                    <input type="radio" className="sr-only" checked={form.facilityId === f._id}
                      onChange={() => setForm(frm => ({ ...frm, facilityId: f._id }))} />
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-semibold text-gray-900">{f.name}</div>
                        <div className="text-sm text-gray-500 mt-0.5">{f.address?.street}, {f.address?.city}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{f.operatingHours?.weekdays || 'Contact for hours'}</div>
                      </div>
                      {f.isVerified && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex-shrink-0">✓ Verified</span>}
                    </div>
                    <div className="border-t border-gray-100 pt-2">
                      <div className="text-xs text-gray-500 mb-1.5 font-medium">Compensation for your waste:</div>
                      <div className="flex flex-wrap gap-2">
                        {rates.map(({ cat, rate }) => cat ? (
                          <span key={cat.value} className="bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full border border-green-200">
                            {cat.icon} {cat.label}: ₹{rate}/kg
                          </span>
                        ) : null)}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
          <div className="flex justify-between">
            <button className="btn-secondary" onClick={() => setStep(0)}>← Back</button>
            <button className="btn-primary" disabled={!form.facilityId} onClick={() => setStep(2)}>Next →</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 text-lg">Item Details</h2>
              <p className="text-sm text-gray-500 mt-0.5">Enter weights and details for each item</p>
            </div>
            <button onClick={addItem} className="btn-secondary text-sm py-1.5">+ Add Item</button>
          </div>
          {form.wasteItems.map((item, i) => {
            const cat = WASTE_CATEGORIES.find(c => c.value === item.category);
            const rate = selectedFacility?.compensationRates?.[item.category] || 10;
            const itemEst = rate * (parseFloat(item.estimatedWeight) || 0);
            return (
              <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800 flex items-center gap-2">
                    <span className="text-xl">{cat?.icon}</span> Item {i + 1}
                  </span>
                  {form.wasteItems.length > 1 && (
                    <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-sm">Remove</button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Category</label>
                    <select className="input" value={item.category} onChange={e => updateItem(i, 'category', e.target.value)}>
                      {form.selectedCategories.map(c => {
                        const cx = WASTE_CATEGORIES.find(x => x.value === c);
                        return <option key={c} value={c}>{cx?.label}</option>;
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="label">Weight (kg)</label>
                    <input type="number" className="input" min="0.1" step="0.1"
                      value={item.estimatedWeight}
                      onChange={e => updateItem(i, 'estimatedWeight', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Brand (optional)</label>
                    <input className="input" value={item.brand}
                      onChange={e => updateItem(i, 'brand', e.target.value)} placeholder="e.g. Samsung" />
                  </div>
                  <div>
                    <label className="label">Condition</label>
                    <select className="input" value={item.condition}
                      onChange={e => updateItem(i, 'condition', e.target.value)}>
                      <option value="working">Working</option>
                      <option value="not_working">Not Working</option>
                      <option value="damaged">Damaged</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </div>
                </div>
                <div className="text-xs text-green-700 bg-green-50 rounded px-3 py-1.5">
                  ₹{rate}/kg at {selectedFacility?.name} — Est. ₹{itemEst.toFixed(0)} for this item
                </div>
              </div>
            );
          })}
          <div className="bg-primary-50 rounded-lg p-3 text-sm space-y-1">
            <div className="flex justify-between"><span>Total items:</span><strong>{form.wasteItems.length}</strong></div>
            <div className="flex justify-between"><span>Total weight:</span><strong>{totalWeight.toFixed(1)} kg</strong></div>
            <div className="flex justify-between"><span>Type:</span><strong>{isBulk ? '🚛 Bulk (pickup eligible)' : '📦 Small (drop-off)'}</strong></div>
            <div className="flex justify-between"><span>Est. compensation:</span><strong className="text-primary-700">{formatCurrency(estimatedComp)}</strong></div>
          </div>
          <div className="flex justify-between">
            <button className="btn-secondary" onClick={() => setStep(1)}>← Back</button>
            <button className="btn-primary" onClick={() => setStep(3)}>Next →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900 text-lg">Schedule</h2>
          {isBulk ? (
            <div>
              <label className="label">Service Type</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'drop_off', icon: '🚶', label: 'Drop-Off', desc: 'You bring it to the facility' },
                  { value: 'pickup', icon: '🚚', label: 'Pickup', desc: 'We come to your location' },
                ].map(opt => (
                  <label key={opt.value} className={`block border-2 rounded-xl p-3 cursor-pointer transition-colors
                    ${form.serviceType === opt.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" className="sr-only" checked={form.serviceType === opt.value}
                      onChange={() => setForm(f => ({ ...f, serviceType: opt.value }))} />
                    <div className="text-2xl mb-1">{opt.icon}</div>
                    <div className="font-medium text-sm">{opt.label}</div>
                    <div className="text-xs text-gray-500">{opt.desc}</div>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              📦 Small waste: Drop-off only. Please bring your items to the facility.
            </div>
          )}
          {form.serviceType === 'pickup' && (
            <div className="space-y-3">
              <label className="label">Pickup Address</label>
              <input className="input" placeholder="Street / Area"
                value={form.pickupAddress.street}
                onChange={e => setForm(f => ({ ...f, pickupAddress: { ...f.pickupAddress, street: e.target.value } }))} />
              <div className="grid grid-cols-2 gap-3">
                <input className="input" placeholder="City"
                  value={form.pickupAddress.city}
                  onChange={e => setForm(f => ({ ...f, pickupAddress: { ...f.pickupAddress, city: e.target.value } }))} />
                <input className="input" placeholder="PIN Code"
                  value={form.pickupAddress.pincode}
                  onChange={e => setForm(f => ({ ...f, pickupAddress: { ...f.pickupAddress, pincode: e.target.value } }))} />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Preferred Date</label>
              <input type="date" className="input" value={form.scheduledDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))} />
            </div>
            <div>
              <label className="label">Preferred Time</label>
              <select className="input" value={form.scheduledTime}
                onChange={e => setForm(f => ({ ...f, scheduledTime: e.target.value }))}>
                <option value="">Select time</option>
                {['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Additional Notes (optional)</label>
            <textarea className="input" rows={3} placeholder="Any special instructions..."
              value={form.userNotes}
              onChange={e => setForm(f => ({ ...f, userNotes: e.target.value }))} />
          </div>
          <div className="flex justify-between">
            <button className="btn-secondary" onClick={() => setStep(2)}>← Back</button>
            <button className="btn-primary" disabled={!form.scheduledDate} onClick={() => setStep(4)}>Review →</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900 text-lg">Review and Submit</h2>
          <div className="space-y-3 text-sm">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="font-semibold text-gray-700">♻️ Waste Types</div>
              <div className="flex flex-wrap gap-2">
                {form.selectedCategories.map(c => {
                  const cat = WASTE_CATEGORIES.find(x => x.value === c);
                  return (
                    <span key={c} className="bg-primary-100 text-primary-700 text-xs px-3 py-1 rounded-full">
                      {cat?.icon} {cat?.label}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-1">
              <div className="font-semibold text-gray-700">📍 Facility</div>
              <div className="font-medium">{selectedFacility?.name}</div>
              <div className="text-gray-500">{selectedFacility?.address?.street}, {selectedFacility?.address?.city}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="font-semibold text-gray-700">📦 Items ({form.wasteItems.length})</div>
              {form.wasteItems.map((item, i) => {
                const cat = WASTE_CATEGORIES.find(c => c.value === item.category);
                return (
                  <div key={i} className="flex justify-between">
                    <span>{cat?.icon} {cat?.label} {item.brand ? `(${item.brand})` : ''}</span>
                    <span className="font-medium">{item.estimatedWeight} kg</span>
                  </div>
                );
              })}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total</span><span>{totalWeight.toFixed(1)} kg</span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-1">
              <div className="font-semibold text-gray-700">📅 Schedule</div>
              <div>Service: <span className="font-medium capitalize">{form.serviceType.replace('_', ' ')}</span></div>
              <div>Date: <span className="font-medium">{form.scheduledDate}</span></div>
              <div>Time: <span className="font-medium">{form.scheduledTime || 'Flexible'}</span></div>
              {form.serviceType === 'pickup' && <div>Pickup: {form.pickupAddress.street}, {form.pickupAddress.city}</div>}
            </div>
            <div className="bg-primary-50 rounded-xl p-4 flex justify-between items-center">
              <span className="font-semibold text-primary-900">Estimated Compensation</span>
              <span className="text-xl font-bold text-primary-700">{formatCurrency(estimatedComp)}</span>
            </div>
            <div className="text-xs text-gray-400 bg-amber-50 p-3 rounded-lg border border-amber-100">
              ⚠️ Final compensation is determined after the facility verifies and weighs your actual e-waste.
            </div>
          </div>
          <div className="flex justify-between">
            <button className="btn-secondary" onClick={() => setStep(3)}>← Back</button>
            <button className="btn-primary" disabled={submitting} onClick={handleSubmit}>
              {submitting ? 'Submitting...' : '✅ Submit Request'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}