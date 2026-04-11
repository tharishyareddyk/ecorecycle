import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || { street: '', city: '', state: '', pincode: '' },
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [msg, setMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');

  const handleProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await api.put('/users/profile', form);
      await refreshUser();
      setMsg('✅ Profile updated successfully');
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.message || 'Failed to update'));
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) { setPwMsg('❌ Passwords do not match'); return; }
    setSavingPw(true); setPwMsg('');
    try {
      await api.put('/users/password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwMsg('✅ Password updated successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setPwMsg('❌ ' + (err.response?.data?.message || 'Failed'));
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>

      {/* User badge */}
      <div className="card flex items-center gap-4">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-2xl">
          {user?.name?.charAt(0)?.toUpperCase()}
        </div>
        <div>
          <div className="font-bold text-gray-900 text-lg">{user?.name}</div>
          <div className="text-gray-500 text-sm">{user?.email}</div>
          <div className="mt-1">
            <span className="bg-primary-100 text-primary-700 text-xs font-medium px-2.5 py-0.5 rounded-full capitalize">{user?.role}</span>
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Personal Information</h2>
        {msg && <div className={`text-sm px-3 py-2 rounded-lg mb-4 ${msg.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg}</div>}
        <form onSubmit={handleProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
            </div>
          </div>
          <div>
            <label className="label">Email (cannot change)</label>
            <input className="input bg-gray-50" value={user?.email} disabled />
          </div>
          <div className="space-y-3">
            <label className="label">Address</label>
            <input className="input" placeholder="Street" value={form.address?.street || ''} onChange={e => setForm(f => ({ ...f, address: { ...f.address, street: e.target.value } }))} />
            <div className="grid grid-cols-2 gap-3">
              <input className="input" placeholder="City" value={form.address?.city || ''} onChange={e => setForm(f => ({ ...f, address: { ...f.address, city: e.target.value } }))} />
              <input className="input" placeholder="State" value={form.address?.state || ''} onChange={e => setForm(f => ({ ...f, address: { ...f.address, state: e.target.value } }))} />
            </div>
            <input className="input" placeholder="PIN Code" value={form.address?.pincode || ''} onChange={e => setForm(f => ({ ...f, address: { ...f.address, pincode: e.target.value } }))} />
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </form>
      </div>

      {/* Password form */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Change Password</h2>
        {pwMsg && <div className={`text-sm px-3 py-2 rounded-lg mb-4 ${pwMsg.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{pwMsg}</div>}
        <form onSubmit={handlePassword} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input type="password" className="input" value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} required />
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" className="input" value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} required minLength={6} />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type="password" className="input" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required />
          </div>
          <button type="submit" className="btn-primary" disabled={savingPw}>{savingPw ? 'Updating...' : 'Update Password'}</button>
        </form>
      </div>
    </div>
  );
}
