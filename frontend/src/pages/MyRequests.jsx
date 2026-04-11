import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import StatusBadge from '../components/StatusBadge';
import TrackingTimeline from '../components/TrackingTimeline';
import { formatCurrency, formatDate, formatDateTime, getCategoryInfo } from '../utils/constants';

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/waste/my').then(r => setRequests(r.data.requests)).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this request?')) return;
    await api.put(`/waste/${id}/cancel`);
    setRequests(rs => rs.map(r => r._id === id ? { ...r, status: 'cancelled' } : r));
    if (selected?._id === id) setSelected(s => ({ ...s, status: 'cancelled' }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Requests</h1>
          <p className="text-gray-500 mt-1">Track all your e-waste disposal requests</p>
        </div>
        <Link to="/submit" className="btn-primary text-sm">+ New Request</Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'confirmed', 'collected', 'processing', 'recycled', 'cancelled'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors capitalize
              ${filter === s ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading requests...</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-gray-500">No requests found.</p>
          <Link to="/submit" className="btn-primary text-sm mt-4 inline-block">Submit E-Waste</Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-6">
          {/* List */}
          <div className="lg:col-span-2 space-y-3">
            {filtered.map(r => (
              <div key={r._id}
                onClick={() => setSelected(r)}
                className={`card cursor-pointer hover:border-primary-200 hover:shadow-md transition-all
                  ${selected?._id === r._id ? 'border-primary-400 shadow-md' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <StatusBadge status={r.status} />
                  <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span>
                </div>
                <div className="font-medium text-gray-900 text-sm">{r.facility?.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{r.facility?.address?.city}</div>
                {r.trackingId ? (
                  <div className="font-mono text-xs text-primary-600 mt-2 bg-primary-50 px-2 py-1 rounded">
                    🔖 {r.trackingId}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 mt-2 italic">Tracking ID not yet generated</div>
                )}
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span className="capitalize">{r.serviceType?.replace('_', ' ')}</span>
                  <span>{r.wasteItems?.length} item(s)</span>
                </div>
              </div>
            ))}
          </div>

          {/* Detail */}
          <div className="lg:col-span-3">
            {selected ? (
              <div className="card space-y-5 sticky top-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900 text-lg">{selected.facility?.name}</h2>
                    <div className="text-sm text-gray-500 mt-0.5">{selected.facility?.address?.city} • {selected.facility?.phone}</div>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>

                {selected.trackingId && (
                  <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
                    <div className="text-xs text-primary-600 font-semibold mb-1">YOUR TRACKING ID</div>
                    <div className="font-mono font-bold text-primary-800 text-xl">{selected.trackingId}</div>
                    <Link to={`/track/${selected.trackingId}`} className="text-xs text-primary-600 hover:underline mt-1 inline-block">
                      Open tracking page →
                    </Link>
                  </div>
                )}

                {/* Timeline */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Lifecycle</h3>
                  <TrackingTimeline status={selected.status} timestamps={selected} />
                </div>

                {/* Items */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Items</h3>
                  <div className="space-y-2">
                    {selected.wasteItems?.map((item, i) => {
                      const cat = getCategoryInfo(item.category);
                      return (
                        <div key={i} className="flex justify-between items-center text-sm bg-gray-50 rounded-lg px-3 py-2">
                          <span>{cat.icon} {cat.label} {item.brand ? `(${item.brand})` : ''}</span>
                          <span className="text-gray-500">{item.actualWeight || item.estimatedWeight} kg</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Compensation */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-gray-400 text-xs">Est. Compensation</div>
                    <div className="font-bold mt-0.5">{formatCurrency(selected.estimatedCompensation)}</div>
                  </div>
                  <div className="bg-primary-50 rounded-lg p-3">
                    <div className="text-primary-600 text-xs">Final Compensation</div>
                    <div className="font-bold text-primary-700 mt-0.5">
                      {selected.finalCompensation > 0 ? formatCurrency(selected.finalCompensation) : 'Pending'}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {['pending', 'confirmed'].includes(selected.status) && (
                  <button onClick={() => handleCancel(selected._id)} className="btn-danger text-sm w-full">
                    Cancel Request
                  </button>
                )}
              </div>
            ) : (
              <div className="card text-center py-16 text-gray-400">
                <div className="text-4xl mb-3">👆</div>
                Select a request to view details
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
