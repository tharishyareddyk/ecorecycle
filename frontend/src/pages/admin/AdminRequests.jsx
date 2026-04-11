import { useState, useEffect } from 'react';
import api from '../../utils/api';
import StatusBadge from '../../components/StatusBadge';
import { formatDate, formatCurrency } from '../../utils/constants';

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    const params = filter !== 'all' ? `?status=${filter}` : '';
    api.get(`/admin/requests${params}`).then(r => setRequests(r.data.requests)).finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">All Requests</h1>
        <span className="text-sm text-gray-500">{requests.length} requests</span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'confirmed', 'collected', 'processing', 'recycled', 'cancelled'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors
              ${filter === s ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="py-3 font-medium text-gray-500">Tracking ID</th>
                <th className="py-3 font-medium text-gray-500">User</th>
                <th className="py-3 font-medium text-gray-500">Facility</th>
                <th className="py-3 font-medium text-gray-500">Type</th>
                <th className="py-3 font-medium text-gray-500">Status</th>
                <th className="py-3 font-medium text-gray-500">Compensation</th>
                <th className="py-3 font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 font-mono text-xs text-primary-600">{r.trackingId || '—'}</td>
                  <td className="py-3">
                    <div className="font-medium">{r.user?.name}</div>
                    <div className="text-xs text-gray-400 capitalize">{r.user?.role}</div>
                  </td>
                  <td className="py-3 text-gray-600">{r.facility?.name}</td>
                  <td className="py-3 capitalize text-xs">{r.serviceType?.replace('_', ' ')}</td>
                  <td className="py-3"><StatusBadge status={r.status} /></td>
                  <td className="py-3">
                    <div>{formatCurrency(r.estimatedCompensation)} est.</div>
                    {r.finalCompensation > 0 && <div className="text-primary-600 font-medium">{formatCurrency(r.finalCompensation)} final</div>}
                  </td>
                  <td className="py-3 text-gray-400">{formatDate(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {requests.length === 0 && (
            <div className="text-center py-10 text-gray-400">No requests found.</div>
          )}
        </div>
      )}
    </div>
  );
}
