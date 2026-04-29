import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function AdminFacilities() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [expanded, setExpanded] = useState(null);

  // Reject modal state
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    api.get('/facilities').then(r => setFacilities(r.data.facilities)).finally(() => setLoading(false));
  }, []);

  const approveFacility = async (id) => {
    setActing(id + '_approve');
    try {
      await api.put(`/admin/facilities/${id}/approve`);
      setFacilities(fs => fs.map(f => f._id === id ? { ...f, isVerified: true, isRejected: false, rejectionReason: '' } : f));
    } finally {
      setActing(null);
    }
  };

  const rejectFacility = async () => {
    if (!rejectTarget) return;
    setActing(rejectTarget._id + '_reject');
    try {
      await api.put(`/admin/facilities/${rejectTarget._id}/reject`, { reason: rejectReason });
      setFacilities(fs => fs.map(f => f._id === rejectTarget._id
        ? { ...f, isVerified: false, isRejected: true, rejectionReason: rejectReason }
        : f));
      setRejectTarget(null);
      setRejectReason('');
    } finally {
      setActing(null);
    }
  };

  const revokeApproval = async (id) => {
    setActing(id + '_revoke');
    try {
      await api.put(`/admin/facilities/${id}/verify`);
      setFacilities(fs => fs.map(f => f._id === id ? { ...f, isVerified: false } : f));
    } finally {
      setActing(null);
    }
  };

  const openDocument = (documentUrl, fileName) => {
    if (!documentUrl) return;
    const win = window.open();
    win.document.write(`
      <html><body style="margin:0;background:#111;">
        ${(fileName || '').toLowerCase().endsWith('.pdf') || documentUrl.includes('application/pdf')
          ? `<embed src="${documentUrl}" width="100%" height="100%" style="position:fixed;inset:0;" type="application/pdf"/>`
          : `<img src="${documentUrl}" style="max-width:100%;margin:auto;display:block;" alt="${fileName || 'Certificate'}"/>`
        }
      </body></html>`);
    win.document.close();
  };

  const statusBadge = (f) => {
    if (f.isVerified) return <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">✓ Verified</span>;
    if (f.isRejected) return <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">✕ Rejected</span>;
    return <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">⏳ Pending Review</span>;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Facilities ({facilities.length})</h1>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : (
        <div className="space-y-3">
          {facilities.map(f => (
            <div key={f._id} className={`card space-y-3 border-2 transition-colors
              ${f.isVerified ? 'border-green-100' : f.isRejected ? 'border-red-100' : 'border-amber-100'}`}>

              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-gray-900">{f.name}</span>
                    {statusBadge(f)}
                  </div>
                  <div className="text-sm text-gray-500">{f.address?.street}, {f.address?.city}, {f.address?.state}</div>
                  <div className="text-sm text-gray-400 mt-0.5">{f.email} · {f.phone}</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {f.acceptedWasteTypes?.slice(0, 4).map(t => (
                      <span key={t} className="bg-gray-100 text-xs px-2 py-0.5 rounded">{t.replace(/_/g, ' ')}</span>
                    ))}
                  </div>
                  {f.isRejected && f.rejectionReason && (
                    <div className="mt-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-1.5 border border-red-100">
                      Reason: {f.rejectionReason}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {f.certifications?.length > 0 ? (
                    <button
                      onClick={() => setExpanded(expanded === f._id ? null : f._id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium transition-colors">
                      📜 {f.certifications.length} Cert{f.certifications.length > 1 ? 's' : ''} {expanded === f._id ? '▲' : '▼'}
                    </button>
                  ) : (
                    <span className="text-xs text-red-400 font-medium">⚠️ No certificates</span>
                  )}

                  {!f.isVerified && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveFacility(f._id)}
                        disabled={!!acting}
                        className="text-sm px-4 py-2 rounded-lg font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50">
                        {acting === f._id + '_approve' ? '...' : '✅ Approve'}
                      </button>
                      <button
                        onClick={() => { setRejectTarget(f); setRejectReason(''); }}
                        disabled={!!acting}
                        className="text-sm px-4 py-2 rounded-lg font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50">
                        ✕ Reject
                      </button>
                    </div>
                  )}
                  {f.isVerified && (
                    <button
                      onClick={() => revokeApproval(f._id)}
                      disabled={!!acting}
                      className="text-sm px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50">
                      {acting === f._id + '_revoke' ? '...' : '↩ Revoke'}
                    </button>
                  )}
                </div>
              </div>

              {/* Certifications panel */}
              {expanded === f._id && (
                <div className="border-t pt-3 space-y-2">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Certifications</div>
                  {f.certifications.map((cert, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900">{cert.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Issued by: <strong>{cert.issuedBy}</strong>
                          {cert.validUntil && <> · Valid until: <strong>{new Date(cert.validUntil).toLocaleDateString('en-IN')}</strong></>}
                        </div>
                        {cert.fileName && <div className="text-xs text-gray-400 mt-0.5">📎 {cert.fileName}</div>}
                      </div>
                      {cert.documentUrl ? (
                        <button
                          onClick={() => openDocument(cert.documentUrl, cert.fileName)}
                          className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 font-medium transition-colors">
                          👁️ View
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 flex-shrink-0">No file</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="text-3xl">❌</div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Reject Facility</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Rejecting <strong>{rejectTarget.name}</strong>. The recycler will be notified with your reason.
                </p>
              </div>
            </div>
            <div>
              <label className="label">Reason for Rejection <span className="text-red-500">*</span></label>
              <textarea
                className="input"
                rows={3}
                placeholder="e.g. CPCB certificate is expired. Please upload a valid certificate and reapply."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setRejectTarget(null); setRejectReason(''); }}
                className="flex-1 btn-secondary">
                Cancel
              </button>
              <button
                onClick={rejectFacility}
                disabled={!rejectReason.trim() || !!acting}
                className="flex-1 py-2 px-4 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 transition-colors">
                {acting === rejectTarget._id + '_reject' ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
