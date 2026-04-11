import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatDate } from '../../utils/constants';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [toggling, setToggling] = useState(null);

  const load = () => {
    setLoading(true);
    const params = roleFilter ? `?role=${roleFilter}` : '';
    api.get(`/admin/users${params}`).then(r => setUsers(r.data.users)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [roleFilter]);

  const toggle = async (id) => {
    setToggling(id);
    try {
      const { data } = await api.put(`/admin/users/${id}/toggle`);
      setUsers(us => us.map(u => u._id === id ? { ...u, isActive: data.user.isActive } : u));
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users ({users.length})</h1>
        <select className="input max-w-xs" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="individual">Individual</option>
          <option value="company">Company</option>
          <option value="recycler">Recycler</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="py-3 font-medium text-gray-500">Name</th>
                <th className="py-3 font-medium text-gray-500">Email</th>
                <th className="py-3 font-medium text-gray-500">Role</th>
                <th className="py-3 font-medium text-gray-500">Joined</th>
                <th className="py-3 font-medium text-gray-500">Status</th>
                <th className="py-3 font-medium text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 font-medium">{u.name} {u.companyName && <span className="text-xs text-gray-400">({u.companyName})</span>}</td>
                  <td className="py-3 text-gray-600">{u.email}</td>
                  <td className="py-3">
                    <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded capitalize">{u.role}</span>
                  </td>
                  <td className="py-3 text-gray-400">{formatDate(u.createdAt)}</td>
                  <td className="py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3">
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => toggle(u._id)}
                        disabled={toggling === u._id}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${u.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                        {toggling === u._id ? '...' : u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
