import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, formatDate } from '../utils/constants';

export default function Dashboard() {
  const { user } = useAuth();
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/history').then(r => setHistory(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const recentRequests = history?.requests?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-500 mt-1">Here's your e-waste recycling overview</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-primary-600 text-white">
          <div className="text-3xl font-bold">{loading ? '...' : `${history?.stats?.totalEwasteSubmitted?.toFixed(1) || 0} kg`}</div>
          <div className="text-primary-100 text-sm mt-1">Total E-Waste Recycled</div>
          <div className="text-4xl mt-3 opacity-30">♻️</div>
        </div>
        <div className="card">
          <div className="text-3xl font-bold text-gray-900">{loading ? '...' : formatCurrency(history?.stats?.totalCompensationEarned)}</div>
          <div className="text-gray-500 text-sm mt-1">Total Compensation Earned</div>
          <div className="text-4xl mt-3 opacity-30">💰</div>
        </div>
        <div className="card">
          <div className="text-3xl font-bold text-gray-900">{loading ? '...' : (history?.requests?.length || 0)}</div>
          <div className="text-gray-500 text-sm mt-1">Total Requests</div>
          <div className="text-4xl mt-3 opacity-30">📋</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: '/submit', icon: '📦', label: 'Submit E-Waste' },
            { to: '/facilities', icon: '📍', label: 'Find Facility' },
            { to: '/my-requests', icon: '📋', label: 'My Requests' },
            { to: '/track', icon: '🔖', label: 'Track Waste' },
          ].map(a => (
            <Link key={a.to} to={a.to} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-colors group">
              <span className="text-2xl">{a.icon}</span>
              <span className="text-sm font-medium text-gray-700 group-hover:text-primary-700 text-center">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent requests */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Requests</h2>
          <Link to="/my-requests" className="text-sm text-primary-600 hover:underline">View all →</Link>
        </div>
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : recentRequests.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-gray-500 mb-4">No requests yet. Start recycling!</p>
            <Link to="/submit" className="btn-primary text-sm">Submit Your First E-Waste</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 font-medium text-gray-500">Tracking ID</th>
                  <th className="text-left py-2 font-medium text-gray-500">Facility</th>
                  <th className="text-left py-2 font-medium text-gray-500">Type</th>
                  <th className="text-left py-2 font-medium text-gray-500">Status</th>
                  <th className="text-left py-2 font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map(r => (
                  <tr key={r._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 font-mono text-xs text-primary-600">
                      {r.trackingId || <span className="text-gray-400 italic">Pending</span>}
                    </td>
                    <td className="py-3 text-gray-700">{r.facility?.name || '—'}</td>
                    <td className="py-3 capitalize">{r.serviceType?.replace('_', '-')}</td>
                    <td className="py-3"><StatusBadge status={r.status} /></td>
                    <td className="py-3 text-gray-400">{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Env impact */}
      <div className="card bg-green-50 border-green-100">
        <h2 className="text-lg font-semibold text-green-900 mb-2">🌱 Your Environmental Impact</h2>
        <p className="text-sm text-green-700">
          By recycling <strong>{history?.stats?.totalEwasteSubmitted?.toFixed(1) || 0} kg</strong> of e-waste, you've helped prevent toxic chemicals from entering landfills and groundwater.
          That's equivalent to keeping approximately <strong>{((history?.stats?.totalEwasteSubmitted || 0) * 2.5).toFixed(0)} liters</strong> of water safe from contamination.
        </p>
      </div>
    </div>
  );
}
