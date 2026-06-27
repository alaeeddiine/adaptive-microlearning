import { useState, useEffect, useCallback } from "react";
import useAuth from "./useAuth";

export default function useNotifications() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(() => {
    if (!currentUser) return;
    fetch(`http://localhost:5000/api/notifications/${currentUser.uid}`)
      .then((res) => res.json())
      .then((data) => {
        const notifs = Array.isArray(data) ? data : [];
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n) => !n.read).length);
      })
      .catch(console.error);
  }, [currentUser]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAllAsRead = async () => {
    if (!currentUser) return;
    await fetch("http://localhost:5000/api/notifications/read", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firebase_uid: currentUser.uid, ids: "all" }),
    });
    fetchNotifications();
  };

  return { notifications, unreadCount, markAllAsRead, refresh: fetchNotifications };
}