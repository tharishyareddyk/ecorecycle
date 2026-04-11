import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { formatDateTime } from '../utils/constants';

const TYPE_ICONS = {
  request_confirmed: '✅',
  request_collected: '🚚',
  processing_started: '⚙️',
  recycled_complete: '♻️',
  compensation_paid: '💰',
  pickup_scheduled: '📅',
  new_request: '📦',
  system: 'ℹ️',
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/notifications').then(r => setNotifications(r.data.notifications)).finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await api.put('/users/notifications/read-all');
    setNotifications(ns => ns.map(n => ({ ...n, isRead: true })));
  };

  const markRead = async (id) => {
    await api.put(`/users/notifications/${id}/read`);
    setNotifications(ns => ns.map(n => n._id === id ? { ...n, isRead: true } : n));
  };

  const unread = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unread > 0 && <p className="text-sm text-gray-500 mt-0.5">{unread} unread</p>}
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="btn-secondary text-sm py-1.5">Mark all read</button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-3">🔕</div>
          <p className="text-gray-500">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n._id}
              onClick={() => !n.isRead && markRead(n._id)}
              className={`card cursor-pointer transition-all hover:shadow-md
                ${!n.isRead ? 'border-primary-200 bg-primary-50' : ''}`}
            >
              <div className="flex gap-3">
                <div className="text-2xl flex-shrink-0">{TYPE_ICONS[n.type] || 'ℹ️'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className={`font-medium text-sm ${!n.isRead ? 'text-primary-800' : 'text-gray-800'}`}>{n.title}</div>
                    <div className="text-xs text-gray-400 flex-shrink-0">{formatDateTime(n.createdAt)}</div>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{n.message}</div>
                  {n.trackingId && (
                    <Link to={`/track/${n.trackingId}`} className="text-xs text-primary-600 hover:underline mt-1 inline-block font-mono">
                      🔖 Track: {n.trackingId}
                    </Link>
                  )}
                </div>
                {!n.isRead && <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
