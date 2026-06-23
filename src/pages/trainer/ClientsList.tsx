import { useEffect, useMemo, useState } from "react";
import { Mail, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { BOOKINGS_EVT, getBookings, type PTBooking } from "@/lib/pt-membership";
import { useOutletContext } from "react-router-dom";

type ClientRow = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  total: number;
  completed: number;
  upcoming: number;
  lastSession?: Date;
  nextSession?: Date;
};

function useBookingsTick() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    window.addEventListener(BOOKINGS_EVT, bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener(BOOKINGS_EVT, bump);
      window.removeEventListener("storage", bump);
    };
  }, []);
  return tick;
}

function bookingDateTime(b: PTBooking) {
  return new Date(`${b.date}T${b.time}:00`);
}

export default function ClientsList() {
  const { trainer } = useOutletContext<any>();
  const trainerId = trainer.id;
  const tick = useBookingsTick();
  const bookings = useMemo(() => getBookings(trainerId), [trainerId, tick]);
  const now = Date.now();

  const clients = useMemo<ClientRow[]>(() => {
    const map = new Map<string, ClientRow>();
    for (const b of bookings) {
      const id = b.customerId ?? b.customerEmail ?? b.customerName ?? "guest";
      const when = bookingDateTime(b);
      const existing = map.get(id) ?? {
        id,
        name: b.customerName ?? "Khách vãng lai",
        email: b.customerEmail,
        phone: b.customerPhone,
        avatar: b.customerAvatar,
        total: 0,
        completed: 0,
        upcoming: 0,
      };
      existing.total += 1;
      if (b.status === "completed") existing.completed += 1;
      if (when.getTime() >= now && b.status !== "cancelled") {
        existing.upcoming += 1;
        if (!existing.nextSession || when < existing.nextSession) {
          existing.nextSession = when;
        }
      } else {
        if (!existing.lastSession || when > existing.lastSession) {
          existing.lastSession = when;
        }
      }
      map.set(id, existing);
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [bookings, now]);

  if (clients.length === 0) {
    return (
      <Card className="border-slate-100 shadow-card bg-white/70 backdrop-blur-sm">
        <CardContent className="p-8 text-center text-sm text-slate-400">
          Chưa có học viên nào đặt lịch tập với bạn.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/10 shadow-card bg-white/70 backdrop-blur-sm overflow-hidden">
      <CardContent className="p-0">
        <ul className="divide-y divide-slate-100 bg-white">
          {clients.map((c) => (
            <li
              key={c.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                {c.avatar ? (
                  <img
                    src={c.avatar}
                    alt={c.name}
                    className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-slate-100 shadow-sm"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 text-sm font-bold shadow-inner">
                    {c.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-slate-800">
                    {c.name}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] font-medium text-slate-400">
                    {c.email && (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {c.email}
                      </span>
                    )}
                    {c.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {c.phone}
                      </span>
                    )}
                  </div>
                  {/* Mobile session details (visible on mobile only) */}
                  {(c.nextSession || c.lastSession) && (
                    <div className="mt-2 text-[10px] text-slate-400 font-medium sm:hidden space-y-0.5">
                      {c.nextSession && (
                        <div>
                          Sắp tới:{" "}
                          <span className="font-bold text-[#4F8A74]">
                            {c.nextSession.toLocaleDateString("vi-VN", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      )}
                      {c.lastSession && (
                        <div>
                          Buổi trước:{" "}
                          <span className="text-slate-500">
                            {c.lastSession.toLocaleDateString("vi-VN", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <div className="text-center min-w-[40px]">
                    <div className="text-base font-bold text-slate-800">
                      {c.total}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                      Tổng buổi
                    </div>
                  </div>
                  <div className="text-center min-w-[40px]">
                    <div className="text-base font-bold text-emerald-600">
                      {c.completed}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                      Đã tập
                    </div>
                  </div>
                  <div className="text-center min-w-[40px]">
                    <div className="text-base font-bold text-emerald-500">
                      {c.upcoming}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                      Chờ tập
                    </div>
                  </div>
                </div>

                {/* Desktop session details */}
                <div className="hidden text-right text-[10px] text-slate-400 font-medium sm:block min-w-[120px]">
                  {c.nextSession && (
                    <div>
                      Sắp tới:{" "}
                      <span className="font-bold text-slate-700">
                        {c.nextSession.toLocaleDateString("vi-VN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  )}
                  {c.lastSession && (
                    <div className="mt-0.5">
                      Buổi trước:{" "}
                      <span className="text-slate-600">
                        {c.lastSession.toLocaleDateString("vi-VN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
