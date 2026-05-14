import React, { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, Circle } from 'lucide-react';
import { api, formatDateTime } from '../services/api';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

const NotificationCenter = ({ role }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const basePath = `/${role}/notifications`;
  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.readAt).length,
    [notifications]
  );

  const loadNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(basePath);
      setNotifications(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(timer);
  }, [basePath]);

  const markOneRead = async (id) => {
    try {
      const { data } = await api.patch(`${basePath}/${id}/read`);
      setNotifications((items) => items.map((item) => (item._id === id ? data.data : item)));
    } catch (err) {
      setError(err.message);
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch(`${basePath}/read-all`);
      setNotifications((items) => items.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="notification-trigger" type="button" aria-label="Notifications">
          <Bell size={20} />
          {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="notification-content">
        <div className="notification-popover">
          <div className="notification-head">
            <strong>Notifications</strong>
            <button type="button" onClick={markAllRead} disabled={!unreadCount}>
              <CheckCheck size={15} /> Read all
            </button>
          </div>

          {error && <p className="notification-error">{error}</p>}
          {loading && notifications.length === 0 && <p className="notification-empty">Loading notifications...</p>}
          {!loading && notifications.length === 0 && <p className="notification-empty">No notifications yet.</p>}

          <div className="notification-list">
            {notifications.map((item) => (
              <button
                key={item._id}
                type="button"
                className={item.readAt ? 'notification-item' : 'notification-item unread'}
                onClick={() => !item.readAt && markOneRead(item._id)}
              >
                <Circle size={9} />
                <span>
                  <strong>{item.title}</strong>
                  <small>{formatDateTime(item.createdAt)}</small>
                  <p>{item.message}</p>
                </span>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;
