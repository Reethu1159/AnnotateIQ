import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import api from '../api/axios';

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;

    const loadNotifications = async () => {
      try {
        const { data } = await api.get('/notifications');
        if (active) {
          setUnreadCount(data.filter((notification) => !notification.read).length);
        }
      } catch {
        if (active) setUnreadCount(0);
      }
    };

    loadNotifications();
    return () => {
      active = false;
    };
  }, []);

  return (
    <button type="button" className="icon-button" aria-label="Notifications" title="Notifications">
      <Bell size={18} />
      {unreadCount > 0 && <span className="notification-dot">{unreadCount}</span>}
    </button>
  );
};

export default NotificationBell;
