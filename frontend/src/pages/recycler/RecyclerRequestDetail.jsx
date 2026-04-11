import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import StatusBadge from '../../components/StatusBadge';
import TrackingTimeline from '../../components/TrackingTimeline';
import { formatCurrency, formatDateTime, getCategoryInfo } from '../../utils/constants';

export default function RecyclerRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [msg, setMsg] = useState('');

  // For collect form
  const [actualWeights, setActualWeights] = useState([]);
  const [recyclerNotes, setRecyclerNotes] = useState('');
  const [finalCompensation, setFinalCompensation] = useState('');

  useEffect(() => {
    api.get(`/waste/${id}`).then(r => {
      setRequest(r.data.request);
      setActualWeights(r.data.request.wasteItems.map(i => i.actualWeight || i.estimatedWeight || 0));
      setFinalCompensation(r.data.request.estimatedCompensation || '');
    }).finally(() => setLoading(false));
  }, [id]);

  const action = async (endpoint, body = {}) => {
    setProcessing(true);
    setMsg('');
    try {
      const { data } = await api.put(`/recycler/requests/${id}/${endpoint}`, body);
      setRequest(data.request);
      if (data.trackingId) setMsg(`✅ Tracking ID generated: ${data.trackingId}`);
      else setMsg('✅ Status updated successfully');
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.message || 'Failed'));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400">Loading...</div>;
  if (!request) return <div className="text-center py-16 text-gray-400">Request not found.</div>;

  const r = request;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/recycler/requests')} className="text-gray-400 hover:text-gray-600">← Back</button>
        <h1 className="text-xl font-bold text-gray-900 flex-1">Request Detail</h1>
        <StatusBadge status={r.status} />
      </div>

      {msg && (
        <div className={`text-sm px-4 py-3 rounded-lg border ${msg.startsWith('✅') ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {msg}
        </div>
      )}

      {/* Tracking ID */}
      {r.trackingId && (
        <div className="card bg-primary-50 border-primary-200">
          <div className="text-xs text-primary-600 font-semibold mb-1">TRACKING ID (sent to user)</div>
          <div className="font-mono font-bold text-primary-800 text-2xl">{r.trackingId}</div>
        </div>
      )}

      {/* User info */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-3">👤 User / Company</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-500">Name:</span> <strong>{r.user?.name}</strong></div>
          <div><span className="text-gray-500">Role:</span> <strong className="capitalize">{r.user?.role}</strong></div>
          <div><span className="text-gray-500">Email:</span> {r.user?.email}</div>
          <div><span className="text-gray-500">Phone:</span> {r.user?.phone}</div>
          {r.user?.companyName && <div className="col-span-2"><span className="text-gray-500">Company:</span> <strong>{r.user.companyName}</strong></div>}
        </div>
      </div>

      {/* Items */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-3">📦 Waste Items</h2>
        <div className="space-y-2">
          {r.wasteItems?.map((item, i) => {
            const cat = getCategoryInfo(item.category);
            return (
              <div key={i} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="font-medium text-sm">{cat.icon} {cat.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {item.brand && `${item.brand} · `}
                    {item.condition} · Est: {item.estimatedWeight} kg
                  </div>
                  {item.description && <div className="text-xs text-gray-400 mt-0.5">{item.description}</div>}
                </div>
                {/* Actual weight input (shown when confirming collect) */}
                {r.status === 'confirmed' && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">Actual kg:</label>
                    <input
                      type="number" step="0.1" min="0"
                      className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                      value={actualWeights[i] || ''}
                      onChange={e => {
                        const w = [...actualWeights];
                        w[i] = parseFloat(e.target.value) || 0;
                        setActualWeights(w);
                      }}
                    />
                  </div>
                )}
                {item.actualWeight && r.status !== 'confirmed' && (
                  <div className="text-sm font-semibold text-primary-700">{item.actualWeight} kg actual</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Schedule info */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-3">📅 Schedule</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-500">Service:</span> <strong className="capitalize">{r.serviceType?.replace('_', ' ')}</strong></div>
          <div><span className="text-gray-500">Category:</span> <strong className="capitalize">{r.wasteCategory}</strong></div>
          <div><span className="text-gray-500">Date:</span> <strong>{r.scheduledDate ? new Date(r.scheduledDate).toLocaleDateString('en-IN') : '—'}</strong></div>
          <div><span className="text-gray-500">Time:</span> <strong>{r.scheduledTime || '—'}</strong></div>
          {r.serviceType === 'pickup' && r.pickupAddress && (
            <div className="col-span-2">
              <span className="text-gray-500">Pickup Address:</span> <strong>{r.pickupAddress.street}, {r.pickupAddress.city}, {r.pickupAddress.pincode}</strong>
            </div>
          )}
          {r.userNotes && <div className="col-span-2"><span className="text-gray-500">User Notes:</span> {r.userNotes}</div>}
        </div>
      </div>

      {/* Compensation */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-3">💰 Compensation</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-gray-500 text-xs">Estimated</div>
            <div className="font-bold mt-1">{formatCurrency(r.estimatedCompensation)}</div>
          </div>
          <div className="bg-primary-50 p-3 rounded-lg">
            <div className="text-primary-600 text-xs">Final (after verification)</div>
            <div className="font-bold text-primary-700 mt-1">{r.finalCompensation > 0 ? formatCurrency(r.finalCompensation) : 'Not set'}</div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Lifecycle Timeline</h2>
        <TrackingTimeline status={r.status} timestamps={r} />
      </div>

      {/* Action buttons */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900">Actions</h2>

        {r.status === 'pending' && (
          <div>
            <p className="text-sm text-gray-600 mb-3">Confirm that you accept this request.</p>
            <button className="btn-primary w-full" onClick={() => action('confirm')} disabled={processing}>
              {processing ? '...' : '✅ Confirm Request'}
            </button>
          </div>
        )}

        {r.status === 'confirmed' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Mark as collected once the e-waste has been dropped off or picked up. Enter actual weights above.
              This will <strong>generate the Tracking ID</strong> and notify the user.
            </p>
            <div>
              <label className="label">Recycler Notes (optional)</label>
              <textarea className="input" rows={2} value={recyclerNotes} onChange={e => setRecyclerNotes(e.target.value)} placeholder="Any notes about the collected items..." />
            </div>
            <button
              className="btn-primary w-full bg-indigo-600 hover:bg-indigo-700"
              onClick={() => action('collect', { actualWeights, recyclerNotes })}
              disabled={processing}>
              {processing ? '...' : '🚚 Mark as Collected & Generate Tracking ID'}
            </button>
          </div>
        )}

        {r.status === 'collected' && (
          <div>
            <p className="text-sm text-gray-600 mb-3">Start processing the e-waste.</p>
            <button className="btn-primary w-full bg-orange-600 hover:bg-orange-700" onClick={() => action('process')} disabled={processing}>
              {processing ? '...' : '⚙️ Mark as Processing'}
            </button>
          </div>
        )}

        {r.status === 'processing' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Set final compensation and mark as fully recycled.</p>
            <div>
              <label className="label">Final Compensation Amount (₹)</label>
              <input type="number" className="input" value={finalCompensation} onChange={e => setFinalCompensation(e.target.value)} placeholder="e.g. 450" />
            </div>
            <button
              className="btn-primary w-full bg-green-600 hover:bg-green-700"
              onClick={() => action('recycle', { finalCompensation: parseFloat(finalCompensation) || 0 })}
              disabled={processing}>
              {processing ? '...' : '♻️ Mark as Recycled & Set Compensation'}
            </button>
          </div>
        )}

        {['recycled', 'cancelled'].includes(r.status) && (
          <div className="text-center text-gray-500 text-sm py-4">
            {r.status === 'recycled' ? '✅ This request has been fully processed.' : '❌ This request was cancelled.'}
          </div>
        )}
      </div>
    </div>
  );
}
