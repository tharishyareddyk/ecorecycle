import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/constants';

export default function RecyclerDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/recycler/stats').then(r => setStats(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const byStatus = (s) => stats?.stats?.find(x => x._id === s)?.count || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recycler Dashboard</h1>
        <p className="text-gray-500 mt-1">{stats?.facility?.name || 'Your Facility'}</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading stats...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Pending', value: byStatus('pending'), icon: '🕐', color: 'bg-yellow-50 border-yellow-200' },
              { label: 'Confirmed', value: byStatus('confirmed'), icon: '✅', color: 'bg-blue-50 border-blue-200' },
              { label: 'Processing', value: byStatus('processing'), icon: '⚙️', color: 'bg-orange-50 border-orange-200' },
              { label: 'Recycled', value: byStatus('recycled'), icon: '♻️', color: 'bg-green-50 border-green-200' },
            ].map(s => (
              <div key={s.label} className={`card border ${s.color}`}>
                <div className="text-3xl font-bold text-gray-900">{s.value}</div>
                <div className="text-sm text-gray-600 mt-1">{s.icon} {s.label}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="text-3xl font-bold text-primary-700">{stats?.facility?.totalWasteProcessed?.toFixed(1) || 0} kg</div>
            <div className="text-gray-500 text-sm mt-1">Total E-Waste Processed</div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <Link to="/recycler/requests" className="card hover:border-primary-200 hover:shadow-md transition-all text-center">
              <div className="text-3xl mb-2">📋</div>
              <div className="font-semibold text-gray-900">View Requests</div>
              <div className="text-sm text-gray-500 mt-1">Manage all incoming requests</div>
            </Link>
            <Link to="/recycler/requests?status=pending" className="card hover:border-primary-200 hover:shadow-md transition-all text-center">
              <div className="text-3xl mb-2">🕐</div>
              <div className="font-semibold text-gray-900">Pending Actions</div>
              <div className="text-sm text-gray-500 mt-1">{byStatus('pending') + byStatus('confirmed')} request(s) need attention</div>
            </Link>
            <Link to="/recycler/facility" className="card hover:border-primary-200 hover:shadow-md transition-all text-center">
              <div className="text-3xl mb-2">🏭</div>
              <div className="font-semibold text-gray-900">Manage Facility</div>
              <div className="text-sm text-gray-500 mt-1">Update info, certifications</div>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
