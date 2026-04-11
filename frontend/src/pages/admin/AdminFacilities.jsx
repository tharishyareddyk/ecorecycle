import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatDate } from '../../utils/constants';

export default function AdminFacilities() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    api.get('/facilities').then(r => setFacilities(r.data.facilities)).finally(() => setLoading(false));
  }, []);

  const toggleVerify = async (id) => {
    setToggling(id);
    try {
      const { data } = await api.put(`/admin/facilities/${id}/verify`);
      setFacilities(fs => fs.map(f => f._id === id ? { ...f, isVerified: data.facility.isVerified } : f));
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Facilities ({facilities.length})</h1>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : (
        <div className="space-y-3">
          {facilities.map(f => (
            <div key={f._id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">{f.name}</span>
                    {f.isVerified && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">✓ Verified</span>}
                  </div>
                  <div className="text-sm text-gray-500">{f.address?.street}, {f.address?.city}, {f.address?.state}</div>
                  <div className="text-sm text-gray-400 mt-0.5">{f.email} · {f.phone}</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {f.acceptedWasteTypes?.slice(0, 4).map(t => (
                      <span key={t} className="bg-gray-100 text-xs px-2 py-0.5 rounded">{t.replace(/_/g, ' ')}</span>
                    ))}
                  </div>
                  <div className="text-xs text-gray-400 mt-2">Total processed: {f.totalWasteProcessed || 0} kg</div>
                </div>
                <button
                  onClick={() => toggleVerify(f._id)}
                  disabled={toggling === f._id}
                  className={`text-sm px-4 py-2 rounded-lg font-medium flex-shrink-0 ml-4 transition-colors
                    ${f.isVerified ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                  {toggling === f._id ? '...' : f.isVerified ? 'Revoke' : '✅ Verify'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
