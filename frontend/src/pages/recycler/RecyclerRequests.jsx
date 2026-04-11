import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import StatusBadge from '../../components/StatusBadge';
import { formatDate, getCategoryInfo } from '../../utils/constants';

export default function RecyclerRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState(searchParams.get('status') || 'all');

  const load = () => {
    setLoading(true);
    const params = filter !== 'all' ? `?status=${filter}` : '';
    api.get(`/recycler/requests${params}`).then(r => setRequests(r.data.requests)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Waste Requests</h1>
        <span className="text-sm text-gray-500">{requests.length} request(s)</span>
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
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-gray-500">No requests found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => (
            <Link key={r._id} to={`/recycler/requests/${r._id}`}
              className="card hover:border-primary-200 hover:shadow-md transition-all block">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="font-semibold text-gray-900">{r.user?.name}</span>
                    {r.user?.companyName && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">🏢 {r.user.companyName}</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.wasteCategory === 'bulk' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>
                      {r.wasteCategory === 'bulk' ? '🚛 Bulk' : '📦 Small'}
                    </span>
                    <span className="text-xs text-gray-400 capitalize">{r.serviceType?.replace('_', ' ')}</span>
                  </div>
                  <div className="text-sm text-gray-500">{r.user?.email} · {r.user?.phone}</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {r.wasteItems?.slice(0, 3).map((item, i) => {
                      const cat = getCategoryInfo(item.category);
                      return <span key={i} className="bg-gray-100 text-xs px-2 py-0.5 rounded">{cat.icon} {cat.label}</span>;
                    })}
                    {r.wasteItems?.length > 3 && <span className="text-xs text-gray-400">+{r.wasteItems.length - 3} more</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-4">
                  <StatusBadge status={r.status} />
                  <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span>
                  {r.trackingId && <span className="font-mono text-xs text-primary-600">{r.trackingId}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
