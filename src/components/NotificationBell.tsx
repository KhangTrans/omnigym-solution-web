import React, { useState, useRef, useEffect } from "react";
import { Bell, Calendar, Clock, Check, RefreshCw, AlertTriangle, Trash2 } from "lucide-react";
import { useNotifications, NotificationItem } from "../contexts/NotificationContext";

export const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications, loading } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      refreshNotifications();
    }
  };

  const handleMarkRead = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    markAsRead(id);
  };

  const handleNotificationClick = (item: NotificationItem) => {
    markAsRead(item.id);
    setIsOpen(false);
    // Redirect to customer bookings page
    window.location.href = "/my-bookings";
  };

  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      const diffMs = new Date().getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return "Vừa xong";
      if (diffMins < 60) return `${diffMins} phút trước`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} giờ trước`;
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return timeStr;
    }
  };

  const getIcon = (type?: string) => {
    switch (type) {
      case "booking_created":
        return <Calendar className="h-4 w-4 text-emerald-600" />;
      case "booking_rescheduled":
        return <RefreshCw className="h-4 w-4 text-amber-500 animate-spin-slow" />;
      case "booking_cancelled":
        return <Trash2 className="h-4 w-4 text-rose-500" />;
      default:
        return <Bell className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Bell Icon Trigger */}
      <button
        onClick={handleToggle}
        className="relative p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 rounded-full hover:bg-slate-100/80 transition-all duration-200 focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className={`h-5.5 w-5.5 transition-all duration-300 ${unreadCount > 0 ? "animate-wiggle text-emerald-600" : ""}`} />
        
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 origin-top-right rounded-2xl border border-slate-100 bg-white shadow-xl ring-1 ring-black/5 focus:outline-none z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-50 bg-slate-50/50 px-4 py-3.5">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-800 text-sm">Thông báo</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  {unreadCount} mới
                </span>
              )}
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-all"
              >
                <Check className="h-3.5 w-3.5" />
                Đọc tất cả
              </button>
            )}
          </div>

          {/* List Area */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {loading && notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <RefreshCw className="h-6 w-6 animate-spin text-emerald-500 mb-2" />
                <span className="text-xs">Đang tải thông báo...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Bell className="h-8 w-8 text-slate-200 mb-2" />
                <span className="text-xs font-medium">Bạn chưa có thông báo nào</span>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`flex items-start gap-3 p-4 hover:bg-slate-50/60 cursor-pointer transition-all duration-150 ${!item.is_read ? "bg-emerald-50/15" : ""}`}
                >
                  {/* Icon Column */}
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${!item.is_read ? "bg-emerald-50" : "bg-slate-50"}`}>
                    {getIcon(item.type)}
                  </div>

                  {/* Text Details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex justify-between items-start gap-1">
                      <p className={`text-xs truncate ${!item.is_read ? "font-bold text-slate-800" : "font-semibold text-slate-600"}`}>
                        {item.title}
                      </p>
                      
                      {!item.is_read && (
                        <button
                          onClick={(e) => handleMarkRead(e, item.id)}
                          className="h-4 w-4 flex items-center justify-center rounded-full text-slate-400 hover:text-emerald-600 hover:bg-slate-100 transition-all"
                          title="Đánh dấu đã đọc"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <p className={`text-xs leading-normal ${!item.is_read ? "text-slate-700" : "text-slate-500"}`}>
                      {item.message}
                    </p>
                    <div className="flex items-center gap-1 pt-1 text-[10px] text-slate-400 font-medium">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>{formatTime(item.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer view-all link */}
          <div className="border-t border-slate-50 bg-slate-50/30 px-4 py-2.5 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                window.location.href = "/my-bookings";
              }}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-all"
            >
              Xem lịch tập của tôi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
