import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    role: 'individual',
    companyName: '', companyRegNumber: '', gstNumber: '',
    address: { street: '', city: '', state: '', pincode: '' }
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const setAddr = (field, value) => setForm(f => ({ ...f, address: { ...f.address, [field]: value } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const user = await register(form);
      if (user.role === 'recycler') navigate('/recycler');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">♻</div>
            <span className="font-bold text-2xl text-gray-900">EcoRecycle</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
        </div>

        <div className="card">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account type */}
            <div>
              <label className="label">Account Type</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'individual', label: '👤 Individual' },
                  { value: 'company', label: '🏢 Company' },
                  { value: 'recycler', label: '🏭 Recycler' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set('role', opt.value)}
                    className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors
                      ${form.role === opt.value ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name</label>
                <input className="input" placeholder="John Doe" value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" placeholder="+91 98765 43210" value={form.phone} onChange={e => set('phone', e.target.value)} required />
              </div>
            </div>

            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>

            <div>
              <label className="label">Password</label>
              <input type="password" className="input" placeholder="Min. 6 characters" value={form.password} onChange={e => set('password', e.target.value)} required />
            </div>

            {/* Company fields */}
            {(form.role === 'company' || form.role === 'recycler') && (
              <div className="border-t pt-4 space-y-3">
                <div className="text-sm font-semibold text-gray-700">
                  {form.role === 'company' ? '🏢 Company Details' : '🏭 Recycler / Facility Details'}
                </div>
                <div>
                  <label className="label">{form.role === 'company' ? 'Company Name' : 'Facility / Organization Name'}</label>
                  <input className="input" value={form.companyName} onChange={e => set('companyName', e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Registration No.</label>
                    <input className="input" value={form.companyRegNumber} onChange={e => set('companyRegNumber', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">GST Number</label>
                    <input className="input" value={form.gstNumber} onChange={e => set('gstNumber', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* Address */}
            <div className="border-t pt-4 space-y-3">
              <div className="text-sm font-semibold text-gray-700">📍 Address</div>
              <input className="input" placeholder="Street / Area" value={form.address.street} onChange={e => setAddr('street', e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <input className="input" placeholder="City" value={form.address.city} onChange={e => setAddr('city', e.target.value)} required />
                <input className="input" placeholder="State" value={form.address.state} onChange={e => setAddr('state', e.target.value)} required />
              </div>
              <input className="input" placeholder="PIN Code" value={form.address.pincode} onChange={e => setAddr('pincode', e.target.value)} />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
