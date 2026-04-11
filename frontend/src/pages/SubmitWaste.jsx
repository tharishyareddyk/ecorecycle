import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { WASTE_CATEGORIES, formatCurrency } from '../utils/constants';

const STEPS = ['Select Facility', 'Add Items', 'Schedule', 'Review'];

export default function SubmitWaste() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [facilities, setFacilities] = useState([]);
  const [loadingFacilities, setLoadingFacilities] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    facilityId: '',
    wasteItems: [{ category: 'mobile_phones', estimatedWeight: 1, brand: '', model: '', condition: 'unknown', description: '' }],
    serviceType: 'drop_off',
    wasteCategory: 'small',
    pickupAddress: { street: '', city: '', state: '', pincode: '' },
    scheduledDate: '',
    scheduledTime: '',
    userNotes: '',
  });

  const selectedFacility = facilities.find(f => f._id === form.facilityId);

  useEffect(() => {
    setLoadingFacilities(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          api.get(`/facilities/nearby?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}&maxDistance=50000`)
            .then(r => setFacilities(r.data.facilities))
            .catch(() => loadAllFacilities())
            .finally(() => setLoadingFacilities(false));
        },
        () => loadAllFacilities()
      );
    } else {
      loadAllFacilities();
    }
  }, []);

  const loadAllFacilities = () => {
    api.get('/facilities').then(r => setFacilities(r.data.facilities)).finally(() => setLoadingFacilities(false));
  };

  const addItem = () => setForm(f => ({
    ...f,
    wasteItems: [...f.wasteItems, { category: 'mobile_phones', estimatedWeight: 1, brand: '', model: '', condition: 'unknown', description: '' }]
  }));

  const removeItem = (i) => setForm(f => ({ ...f, wasteItems: f.wasteItems.filter((_, idx) => idx !== i) }));

  const updateItem = (i, field, value) => setForm(f => ({
    ...f,
    wasteItems: f.wasteItems.map((item, idx) => idx === i ? { ...item, [field]: value } : item)
  }));

  const totalWeight = form.wasteItems.reduce((s, i) => s + (parseFloat(i.estimatedWeight) || 0), 0);

  const estimatedComp = form.wasteItems.reduce((s, item) => {
    if (!selectedFacility) return s;
    const rate = selectedFacility.compensationRates?.[item.category] || 10;
    return s + rate * (parseFloat(item.estimatedWeight) || 0);
  }, 0);

  const isBulk = totalWeight >= 20 || form.wasteItems.length >= 5;

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
      const payload = {
        ...form,
        facilityId: form.facilityId,
        pickupAddress: form.serviceType === 'pickup' ? form.pickupAddress : undefined,
      };
      await api.post('/waste', payload);
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
        <p className="text-gray-500 mt-1">Complete the form to schedule disposal of your electronics</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
              ${i < step ? 'bg-primary-600 text-white' : i === step ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-500' : 'bg-gray-100 text-gray-400'}`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-primary-700' : 'text-gray-400'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-primary-400' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

      {/* Step 0: Select Facility */}
      {step === 0 && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Select a Recycling Facility</h2>
          {loadingFacilities ? (
            <div className="text-center py-8 text-gray-400">Finding nearby facilities...</div>
          ) : facilities.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No facilities found in your area.</div>
          ) : (
            <div className="space-y-3">
              {facilities.map(f => (
                <label key={f._id} className={`block border rounded-xl p-4 cursor-pointer transition-colors
                  ${form.facilityId === f._id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" className="sr-only" checked={form.facilityId === f._id} onChange={() => setForm(frm => ({ ...frm, facilityId: f._id }))} />
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{f.name}</div>
                      <div className="text-sm text-gray-500 mt-0.5">{f.address?.street}, {f.address?.city}</div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {f.acceptedWasteTypes?.slice(0, 4).map(t => (
                          <span key={t} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">{t.replace(/_/g, ' ')}</span>
                        ))}
                        {f.acceptedWasteTypes?.length > 4 && <span className="text-xs text-gray-400">+{f.acceptedWasteTypes.length - 4} more</span>}
                      </div>
                    </div>
                    {f.isVerified && <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex-shrink-0">✓ Verified</span>}
                  </div>
                </label>
              ))}
            </div>
          )}
          <div className="flex justify-end">
            <button className="btn-primary" disabled={!form.facilityId} onClick={() => setStep(1)}>Next →</button>
          </div>
        </div>
      )}

      {/* Step 1: Add items */}
      {step === 1 && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Add E-Waste Items</h2>
            <button onClick={addItem} className="btn-secondary text-sm py-1.5">+ Add Item</button>
          </div>

          {form.wasteItems.map((item, i) => {
            const cat = WASTE_CATEGORIES.find(c => c.value === item.category);
            return (
              <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">Item {i + 1}</span>
                  {form.wasteItems.length > 1 && (
                    <button onClick={() => removeItem(i)} className="text-red-500 text-sm hover:text-red-700">Remove</button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Category</label>
                    <select className="input" value={item.category} onChange={e => updateItem(i, 'category', e.target.value)}>
                      {WASTE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Est. Weight (kg)</label>
                    <input type="number" className="input" min="0.1" step="0.1" value={item.estimatedWeight} onChange={e => updateItem(i, 'estimatedWeight', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Brand (optional)</label>
                    <input className="input" value={item.brand} onChange={e => updateItem(i, 'brand', e.target.value)} placeholder="e.g. Samsung" />
                  </div>
                  <div>
                    <label className="label">Condition</label>
                    <select className="input" value={item.condition} onChange={e => updateItem(i, 'condition', e.target.value)}>
                      <option value="working">Working</option>
                      <option value="not_working">Not Working</option>
                      <option value="damaged">Damaged</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </div>
                </div>
                {cat?.hazard && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-700">
                    ⚠️ Hazard Info: {cat.hazard}
                  </div>
                )}
              </div>
            );
          })}

          <div className="bg-primary-50 rounded-lg p-3 text-sm">
            <div className="flex justify-between"><span>Total items:</span><strong>{form.wasteItems.length}</strong></div>
            <div className="flex justify-between mt-1"><span>Total weight:</span><strong>{totalWeight.toFixed(1)} kg</strong></div>
            <div className="flex justify-between mt-1"><span>Category:</span><strong className="capitalize">{isBulk ? '🚛 Bulk' : '📦 Small'}</strong></div>
            <div className="flex justify-between mt-1"><span>Est. compensation:</span><strong className="text-primary-700">{formatCurrency(estimatedComp)}</strong></div>
          </div>

          <div className="flex justify-between">
            <button className="btn-secondary" onClick={() => setStep(0)}>← Back</button>
            <button className="btn-primary" onClick={() => setStep(2)}>Next →</button>
          </div>
        </div>
      )}

      {/* Step 2: Schedule */}
      {step === 2 && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Schedule & Service Type</h2>

          {isBulk && (
            <div>
              <label className="label">Service Type</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'drop_off', icon: '🚶', label: 'Drop-Off', desc: 'You bring it to the facility' },
                  { value: 'pickup', icon: '🚚', label: 'Pickup', desc: 'We come to your location (bulk only)' },
                ].map(opt => (
                  <label key={opt.value} className={`block border rounded-xl p-3 cursor-pointer transition-colors
                    ${form.serviceType === opt.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
                    <input type="radio" className="sr-only" checked={form.serviceType === opt.value} onChange={() => setForm(f => ({ ...f, serviceType: opt.value }))} />
                    <div className="text-xl mb-1">{opt.icon}</div>
                    <div className="font-medium text-sm">{opt.label}</div>
                    <div className="text-xs text-gray-500">{opt.desc}</div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {!isBulk && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              📦 Small waste: Drop-off only. Please bring your items to the selected facility on the scheduled date.
            </div>
          )}

          {form.serviceType === 'pickup' && (
            <div className="space-y-3">
              <label className="label">Pickup Address</label>
              <input className="input" placeholder="Street / Area" value={form.pickupAddress.street} onChange={e => setForm(f => ({ ...f, pickupAddress: { ...f.pickupAddress, street: e.target.value } }))} required />
              <div className="grid grid-cols-2 gap-3">
                <input className="input" placeholder="City" value={form.pickupAddress.city} onChange={e => setForm(f => ({ ...f, pickupAddress: { ...f.pickupAddress, city: e.target.value } }))} />
                <input className="input" placeholder="PIN Code" value={form.pickupAddress.pincode} onChange={e => setForm(f => ({ ...f, pickupAddress: { ...f.pickupAddress, pincode: e.target.value } }))} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Preferred Date</label>
              <input type="date" className="input" value={form.scheduledDate} min={new Date().toISOString().split('T')[0]}
                onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Preferred Time</label>
              <select className="input" value={form.scheduledTime} onChange={e => setForm(f => ({ ...f, scheduledTime: e.target.value }))}>
                <option value="">Select time</option>
                {['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Additional Notes (optional)</label>
            <textarea className="input" rows={3} placeholder="Any special instructions..." value={form.userNotes} onChange={e => setForm(f => ({ ...f, userNotes: e.target.value }))} />
          </div>

          <div className="flex justify-between">
            <button className="btn-secondary" onClick={() => setStep(1)}>← Back</button>
            <button className="btn-primary" disabled={!form.scheduledDate} onClick={() => setStep(3)}>Review →</button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Review & Submit</h2>

          <div className="space-y-3 text-sm">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="font-semibold text-gray-700">📍 Facility</div>
              <div>{selectedFacility?.name}</div>
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
                <span>Total</span>
                <span>{totalWeight.toFixed(1)} kg</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-1">
              <div className="font-semibold text-gray-700">📅 Schedule</div>
              <div>Service: <span className="capitalize font-medium">{form.serviceType.replace('_', ' ')}</span></div>
              <div>Date: <span className="font-medium">{form.scheduledDate}</span></div>
              <div>Time: <span className="font-medium">{form.scheduledTime || 'Flexible'}</span></div>
              {form.serviceType === 'pickup' && <div>Address: {form.pickupAddress.street}, {form.pickupAddress.city}</div>}
            </div>

            <div className="bg-primary-50 rounded-xl p-4 flex justify-between items-center">
              <span className="font-semibold text-primary-900">Estimated Compensation</span>
              <span className="text-xl font-bold text-primary-700">{formatCurrency(estimatedComp)}</span>
            </div>

            <div className="text-xs text-gray-400 bg-amber-50 p-3 rounded-lg border border-amber-100">
              ⚠️ Final compensation is determined after the facility verifies and weighs your actual e-waste. Estimated amount may vary.
            </div>
          </div>

          <div className="flex justify-between">
            <button className="btn-secondary" onClick={() => setStep(2)}>← Back</button>
            <button className="btn-primary" disabled={submitting} onClick={handleSubmit}>
              {submitting ? 'Submitting...' : '✅ Submit Request'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
