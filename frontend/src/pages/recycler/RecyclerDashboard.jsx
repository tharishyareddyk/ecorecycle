
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/constants';

export default function RecyclerDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState(null);

  useEffect(() => {
    api.get('/recycler/stats').then(r => {
      setStats(r.data);

      const facility = r.data?.facility;
      if (!facility) return;

      const seenKey = `facility_status_seen_${facility._id}`;
      const alreadySeen = localStorage.getItem(seenKey);

      if (!alreadySeen) {
        if (facility.isVerified) {
          setPopup({ type: 'approved' });
          localStorage.setItem(seenKey, 'approved');
        } else if (facility.isRejected) {
          setPopup({ type: 'rejected', reason: facility.rejectionReason });
          localStorage.setItem(seenKey, 'rejected');
        }
      } else {
        if (facility.isVerified && alreadySeen !== 'approved') {
          setPopup({ type: 'approved' });
          localStorage.setItem(seenKey, 'approved');
        } else if (facility.isRejected && alreadySeen !== 'rejected') {
          setPopup({ type: 'rejected', reason: facility.rejectionReason });
          localStorage.setItem(seenKey, 'rejected');
        }
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const byStatus = (s) => stats?.stats?.find(x => x._id === s)?.count || 0;
  const facility = stats?.facility;

  return (
    <div className="space-y-6">

      {popup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center space-y-4">
            {popup.type === 'approved' ? (
              <>
                <div className="text-6xl mb-2">🎉</div>
                <h2 className="text-2xl font-black text-gray-900">Congratulations!</h2>
                <p className="text-gray-600">
                  Your facility <strong>{facility?.name}</strong> has been <span className="text-green-600 font-semibold">verified and approved</span> by EcoRecycle admin.
                </p>
                <p className="text-sm text-gray-500">
                  {"You're now live on the platform — users can find your facility and submit e-waste requests!"}
                </p>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left text-sm text-green-800 space-y-1">
                  <div>✅ Facility visible on the map</div>
                  <div>✅ Users can submit requests to you</div>
                  <div>{"✅ You'll receive notifications for new requests"}</div>
                </div>
                <button onClick={() => setPopup(null)} className="btn-primary w-full py-3 text-base">
                  {"Let's Go! 🚀"}
                </button>
              </>
            ) : (
              <>
                <div className="text-6xl mb-2">😔</div>
                <h2 className="text-2xl font-black text-gray-900">Application Not Approved</h2>
                <p className="text-gray-600">
                  Unfortunately, your facility <strong>{facility?.name}</strong> was <span className="text-red-600 font-semibold">not approved</span> at this time.
                </p>
                {popup.reason && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left text-sm text-red-800">
                    <div className="font-semibold mb-1">Reason given by admin:</div>
                    <div>"{popup.reason}"</div>
                  </div>
                )}
                <p className="text-sm text-gray-500">
                  Please update your facility details and certifications, then resubmit for review.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setPopup(null)} className="flex-1 btn-secondary py-2.5">
                    Dismiss
                  </button>
                  <Link to="/recycler/facility" onClick={() => setPopup(null)} className="flex-1 btn-primary py-2.5 text-center">
                    Update & Resubmit
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recycler Dashboard</h1>
        <p className="text-gray-500 mt-1">{facility?.name || 'Your Facility'}</p>
      </div>

      {facility && !facility.isVerified && (
        <div className={`rounded-2xl p-4 flex items-center gap-3 border-2
          ${facility.isRejected ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
          <span className="text-2xl">{facility.isRejected ? '❌' : '⏳'}</span>
          <div className="flex-1">
            <div className={`font-bold text-sm ${facility.isRejected ? 'text-red-800' : 'text-amber-800'}`}>
              {facility.isRejected ? 'Facility Application Rejected' : 'Pending Admin Verification'}
            </div>
            <div className={`text-xs mt-0.5 ${facility.isRejected ? 'text-red-600' : 'text-amber-600'}`}>
              {facility.isRejected
                ? `Reason: ${facility.rejectionReason || 'See notification for details.'}`
                : "Admin is reviewing your certifications. You'll be notified once verified."}
            </div>
          </div>
          {facility.isRejected && (
            <Link to="/recycler/facility" className="text-xs font-semibold text-red-700 underline flex-shrink-0">
              Update →
            </Link>
          )}
        </div>
      )}

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
            <div className="text-3xl font-bold text-primary-700">{facility?.totalWasteProcessed?.toFixed(1) || 0} kg</div>
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