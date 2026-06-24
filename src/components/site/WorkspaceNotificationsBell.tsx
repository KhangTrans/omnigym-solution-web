import { useNavigate } from "react-router-dom";
import { Bell, Check, Star, CalendarCheck2, Users, UserSquare2, DollarSign, Info, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/contexts/NotificationContext";
import { useState } from "react";

type NotificationKind = "review" | "shift" | "staff" | "trainer" | "revenue" | "system";

const ICONS: Record<NotificationKind, typeof Bell> = {
  review: Star,
  shift: CalendarCheck2,
  staff: Users,
  trainer: UserSquare2,
  revenue: DollarSign,
  system: Info,
};

function timeAgo(iso: string) {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "vừa xong";
    if (m < 60) return `${m} phút trước`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} giờ trước`;
    const d = Math.floor(h / 24);
    return `${d} ngày trước`;
  } catch {
    return "vừa xong";
  }
}

const mapTypeToKind = (type?: string): NotificationKind => {
  switch (type) {
    case "refund_requested":
      return "revenue";
    case "booking_cancelled":
    case "booking_rescheduled":
    case "booking_created":
      return "shift";
    case "trainer_application":
    case "trainer_approved":
      return "trainer";
    default:
      return "system";
  }
};

const mapTypeToHref = (type?: string): string => {
  switch (type) {
    case "refund_requested":
      return "/branchmanager/revenue";
    case "booking_cancelled":
    case "booking_rescheduled":
    case "booking_created":
      return "/branchmanager/attendance";
    case "trainer_application":
      return "/branchmanager/trainer-applications";
    default:
      return "/branchmanager";
  }
};

export function WorkspaceNotificationsBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [deletedIds, setDeletedIds] = useState<number[]>([]);
  const navigate = useNavigate();

  const handleOpenNotification = (id: number, type?: string) => {
    markAsRead(id);
    navigate(mapTypeToHref(type));
  };

  const handleRemoveNotification = (id: number) => {
    setDeletedIds((prev) => [...prev, id]);
  };

  const items = notifications.filter((n) => !deletedIds.includes(n.id));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Thông báo${unreadCount ? ` (${unreadCount} chưa đọc)` : ""}`}
          className="relative rounded-full h-9 w-9 text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-emerald-600 px-1 text-[10px] font-semibold leading-none text-white shadow ring-2 ring-background">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0 border border-slate-100 shadow-xl rounded-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/50 rounded-t-xl">
          <div>
            <div className="text-sm font-semibold text-slate-800">Thông báo</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : "Đã đọc hết thông báo"}
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
              onClick={markAllAsRead}
            >
              <Check className="h-3.5 w-3.5" />
              Đọc tất cả
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[380px]">
          {items.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-slate-400 flex flex-col items-center gap-1.5">
              <Bell className="h-8 w-8 text-slate-200" />
              <span>Chưa có thông báo nào.</span>
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {items.map((n) => {
                const kind = mapTypeToKind(n.type);
                const Icon = ICONS[kind] ?? Bell;
                return (
                  <li key={n.id} className="group relative">
                    <button
                      type="button"
                      onClick={() => handleOpenNotification(n.id, n.type)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50/80",
                        !n.is_read && "bg-emerald-50/15"
                      )}
                    >
                      <div
                        className={cn(
                          "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors",
                          !n.is_read
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-400"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className={cn("truncate text-sm text-slate-800", !n.is_read ? "font-bold" : "font-medium")}>
                            {n.title}
                          </div>
                          {!n.is_read && (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 leading-normal">
                          {n.message}
                        </p>
                        <div className="mt-1.5 text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                          {timeAgo(n.created_at)}
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      aria-label="Xóa thông báo"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveNotification(n.id);
                      }}
                      className="absolute right-3 top-3.5 hidden rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 group-hover:block transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
