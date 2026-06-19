import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import io, { Socket } from "socket.io-client";
import axios from "axios";
import { toast } from "sonner";
import { requestNotificationPermissionAndGetToken } from "../firebase";

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type?: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationContextProps {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
  const socketServerUrl = "http://localhost:3000";

  const refreshNotifications = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setLoading(true);
      const response = await axios.get(`${apiBaseUrl}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const list = response.data?.data || [];
      setNotifications(list);
      setUnreadCount(list.filter((n: NotificationItem) => !n.is_read).length);
    } catch (err) {
      console.error("Failed to fetch notification history:", err);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  const markAsRead = async (id: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.put(`${apiBaseUrl}/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.put(`${apiBaseUrl}/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  // Manage socket connection & Firebase token registration
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // 1. Fetch initial notification list
    refreshNotifications();

    // 2. Request Firebase Push permission and save token
    requestNotificationPermissionAndGetToken();

    // 3. Initialize Socket.io
    const newSocket = io(socketServerUrl, {
      auth: { token },
      transports: ["websocket"]
    });

    newSocket.on("connect", () => {
      console.log("[Socket] Connected to server");
    });

    newSocket.on("notification", (newNotif: NotificationItem) => {
      console.log("[Socket] Real-time notification received:", newNotif);
      
      // Update local state
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Display Toast Notification using sonner
      toast(newNotif.title, {
        description: newNotif.message,
        duration: 5000,
        action: {
          label: "Xem",
          onClick: () => {
            // Mark read and navigate
            markAsRead(newNotif.id);
            window.location.href = "/my-bookings";
          }
        }
      });
    });

    newSocket.on("connect_error", (err) => {
      console.warn("[Socket] Connection error:", err.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [refreshNotifications]);

  // Periodic polling check in case localStorage is modified outside this hook
  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem("token");
      if (!token && socket) {
        socket.disconnect();
        setSocket(null);
        setNotifications([]);
        setUnreadCount(0);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [socket]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        refreshNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
