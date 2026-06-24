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
  booking_id?: number | null;
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

export const getCurrentUserRole = (): string => {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    const roleValue = typeof u?.role === "object" ? u?.role?.role_name || u?.role?.name : u?.role;
    let userRole = String(roleValue || "").toLowerCase();
    if (!userRole && Number(u?.role_id) === 4) userRole = "staff";
    if (!userRole && Number(u?.role_id) === 3) userRole = "branchmanager";
    return userRole;
  } catch {
    return "";
  }
};

export const getNotificationHref = (item: NotificationItem, userRole?: string): string => {
  const role = userRole || getCurrentUserRole();
  const bookingQuery = item.booking_id ? `?highlight=${item.booking_id}` : "";
  
  if (role === "branchmanager" || role === "staff") {
    switch (item.type) {
      case "refund_requested":
        return `/branchmanager/revenue${bookingQuery}`;
      case "booking_cancelled":
      case "booking_rescheduled":
      case "booking_created":
        return `/branchmanager/attendance${bookingQuery}`;
      case "trainer_application":
        return "/branchmanager/trainer-applications";
      default:
        return "/branchmanager";
    }
  }
  
  if (role === "trainer") {
    switch (item.type) {
      case "booking_created":
      case "booking_cancelled":
      case "booking_rescheduled":
      case "trainer_completion_request":
        return `/trainer/bookings${bookingQuery}`;
      default:
        return "/trainer";
    }
  }
  
  // Default for Customer / others
  switch (item.type) {
    case "booking_created":
    case "booking_cancelled":
    case "booking_rescheduled":
    case "booking_completion_request":
      return `/my-bookings${bookingQuery}`;
    default:
      return `/my-bookings${bookingQuery}`;
  }
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
  const socketServerUrl = "http://localhost:3000";

  const refreshNotifications = useCallback(async () => {
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
  }, [apiBaseUrl, token]);

  const markAsRead = async (id: number) => {
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

  // Sync token state from localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const currentToken = localStorage.getItem("token");
      if (currentToken !== token) {
        setToken(currentToken);
      }
    };

    window.addEventListener("user-login", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);

    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener("user-login", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [token]);

  // Manage socket connection & Firebase token registration
  useEffect(() => {
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

      // Determine user role
      let userRole = "";
      try {
        const u = JSON.parse(localStorage.getItem("user") || "null");
        const roleValue = typeof u?.role === "object" ? u?.role?.role_name || u?.role?.name : u?.role;
        userRole = String(roleValue || "").toLowerCase();
        if (!userRole && Number(u?.role_id) === 4) userRole = "staff";
        if (!userRole && Number(u?.role_id) === 3) userRole = "branchmanager";
      } catch {}

      // Display Toast Notification using sonner
      toast(newNotif.title, {
        description: newNotif.message,
        duration: 5000,
        action: {
          label: "Xem",
          onClick: () => {
            // Mark read and navigate
            markAsRead(newNotif.id);
            window.location.href = getNotificationHref(newNotif, userRole);
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
  }, [token, refreshNotifications]);

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
