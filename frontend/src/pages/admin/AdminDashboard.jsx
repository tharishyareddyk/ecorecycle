// Admin Dashboard
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data.stats)).finally(() => setLoading(false));
  }, []);

  const byStatus = (s) => stats?.requestsByStatus?.find(x => x._id === s)?.count || 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      {loading ? <div className="text-center py-16 text-gray-400">Loading...</div> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: stats?.totalUsers, icon: '👥', color: 'bg-blue-50' },
              { label: 'Facilities', value: stats?.totalFacilities, icon: '🏭', color: 'bg-green-50' },
              { label: 'Total Requests', value: stats?.totalRequests, icon: '📋', color: 'bg-yellow-50' },
              { label: 'Waste Recycled', value: `${stats?.totalWasteRecycled?.toFixed(1) || 0} kg`, icon: '♻️', color: 'bg-primary-50' },
            ].map(s => (
              <div key={s.label} className={`card ${s.color}`}>
                <div className="text-3xl font-bold text-gray-900">{s.value}</div>
                <div className="text-sm text-gray-600 mt-1">{s.icon} {s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <Link to="/admin/users" className="card hover:shadow-md transition-all text-center">
              <div className="text-3xl mb-2">👥</div>
              <div className="font-semibold">Manage Users</div>
            </Link>
            <Link to="/admin/facilities" className="card hover:shadow-md transition-all text-center">
              <div className="text-3xl mb-2">🏭</div>
              <div className="font-semibold">Verify Facilities</div>
            </Link>
            <Link to="/admin/requests" className="card hover:shadow-md transition-all text-center">
              <div className="text-3xl mb-2">📋</div>
              <div className="font-semibold">All Requests</div>
            </Link>
          </div>

          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Requests by Status</h2>
            <div className="grid grid-cols-3 gap-3">
              {['pending', 'confirmed', 'collected', 'processing', 'recycled', 'cancelled'].map(s => (
                <div key={s} className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900">{byStatus(s)}</div>
                  <div className="text-xs text-gray-500 capitalize mt-1">{s}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
