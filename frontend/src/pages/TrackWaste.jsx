import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import TrackingTimeline from '../components/TrackingTimeline';
import { formatCurrency, formatDate } from '../utils/constants';

export default function TrackWaste() {
  const { trackingId: paramId } = useParams();
  const [trackingId, setTrackingId] = useState(paramId || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (paramId) handleTrack(paramId);
  }, [paramId]);

  const handleTrack = async (id) => {
    const tid = id || trackingId.trim();
    if (!tid) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await api.get(`/waste/track/${tid}`);
      setResult(data.tracking);
    } catch (err) {
      setError(err.response?.data?.message || 'Tracking ID not found. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold">♻</div>
          <span className="font-bold text-gray-900">EcoRecycle</span>
        </Link>
        <span className="text-gray-300">›</span>
        <span className="text-gray-600 text-sm">Track E-Waste</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🔖</div>
          <h1 className="text-3xl font-bold text-gray-900">Track Your E-Waste</h1>
          <p className="text-gray-500 mt-2">Enter your Tracking ID to see the real-time status of your recycled electronics.</p>
        </div>

        {/* Search */}
        <div className="card mb-6">
          <div className="flex gap-3">
            <input
              className="input flex-1 font-mono"
              placeholder="e.g. ECO-LQ3KF2-AB7C"
              value={trackingId}
              onChange={e => setTrackingId(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleTrack()}
            />
            <button className="btn-primary px-6 flex-shrink-0" onClick={() => handleTrack()} disabled={loading}>
              {loading ? '...' : 'Track'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Summary card */}
            <div className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-xs text-gray-400 mb-1">TRACKING ID</div>
                  <div className="font-mono font-bold text-primary-700 text-lg">{result.trackingId}</div>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full
                  ${result.status === 'recycled' ? 'bg-green-100 text-green-700' :
                    result.status === 'processing' ? 'bg-orange-100 text-orange-700' :
                    result.status === 'collected' ? 'bg-indigo-100 text-indigo-700' :
                    'bg-yellow-100 text-yellow-700'}`}>
                  {result.status?.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
                <div>
                  <div className="text-gray-400 text-xs">Submitted By</div>
                  <div className="font-medium mt-0.5">{result.user?.name}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">Facility</div>
                  <div className="font-medium mt-0.5">{result.facility?.name}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">Service Type</div>
                  <div className="font-medium mt-0.5 capitalize">{result.serviceType?.replace('_', ' ')}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">Actual Weight</div>
                  <div className="font-medium mt-0.5">{result.totalActualWeight ? `${result.totalActualWeight} kg` : 'Pending'}</div>
                </div>
                {result.finalCompensation > 0 && (
                  <div>
                    <div className="text-gray-400 text-xs">Final Compensation</div>
                    <div className="font-bold text-primary-600 mt-0.5">{formatCurrency(result.finalCompensation)}</div>
                  </div>
                )}
                {result.recyclerNotes && (
                  <div className="col-span-2">
                    <div className="text-gray-400 text-xs">Recycler Notes</div>
                    <div className="mt-0.5 text-gray-600">{result.recyclerNotes}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-6">Waste Lifecycle</h2>
              <TrackingTimeline status={result.status} timestamps={result} />
            </div>

            {result.status === 'recycled' && (
              <div className="card bg-green-50 border-green-100 text-center">
                <div className="text-4xl mb-3">🌱</div>
                <h3 className="font-bold text-green-900 text-lg">E-Waste Successfully Recycled!</h3>
                <p className="text-green-700 text-sm mt-2">
                  Thank you for your contribution to a cleaner planet. Your electronics have been responsibly processed.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="text-center mt-8 text-sm text-gray-400">
          Want to submit more e-waste?{' '}
          <Link to="/register" className="text-primary-600 hover:underline">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
