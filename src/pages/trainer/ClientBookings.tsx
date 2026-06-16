import { useEffect, useMemo, useState } from "react";
import { Mail, Phone, StickyNote, MoreHorizontal, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { BOOKINGS_EVT, getBookings, updateBooking, type PTBooking } from "@/lib/pt-membership";
import { useOutletContext } from "react-router-dom";

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

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="shadow-sm border-slate-100 hover:border-primary/20 transition-all bg-white/70 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </div>
        <div className="mt-1 text-2xl font-black text-slate-800">{value}</div>
        {hint && (
          <div className="mt-0.5 text-[10px] text-slate-500 italic">{hint}</div>
        )}
      </CardContent>
    </Card>
  );
}

function BookingStatusBadge({
  status,
  isPast,
}: {
  status: "confirmed" | "completed" | "cancelled";
  isPast: boolean;
}) {
  if (status === "completed") {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
        Hoàn thành
      </Badge>
    );
  }
  if (status === "cancelled") {
    return (
      <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border border-red-200 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
        Đã hủy
      </Badge>
    );
  }
  if (isPast) {
    return (
      <Badge
        variant="outline"
        className="text-slate-400 border-slate-200 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
      >
        Đã qua
      </Badge>
    );
  }
  return (
    <Badge className="bg-emerald-50 text-[#4F8A74] hover:bg-emerald-50 border border-emerald-500/10 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
      Chờ tập
    </Badge>
  );
}

export default function ClientBookings() {
  const { trainer } = useOutletContext<any>();
  const trainerId = trainer.id;
  const tick = useBookingsTick();
  const bookings = useMemo(() => getBookings(trainerId), [trainerId, tick]);

  const [filter, setFilter] = useState<"upcoming" | "past" | "all">("upcoming");
  const [query, setQuery] = useState("");
  const [editingNote, setEditingNote] = useState<PTBooking | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  const now = Date.now();

  const enriched = bookings.map((b) => ({
    ...b,
    when: bookingDateTime(b),
    isPast: bookingDateTime(b).getTime() < now,
  }));

  const filtered = enriched
    .filter((b) => {
      if (filter === "upcoming") return !b.isPast && b.status !== "cancelled";
      if (filter === "past")
        return b.isPast || b.status === "cancelled" || b.status === "completed";
      return true;
    })
    .filter((b) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        (b.customerName ?? "").toLowerCase().includes(q) ||
        (b.customerEmail ?? "").toLowerCase().includes(q) ||
        (b.customerPhone ?? "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => a.when.getTime() - b.when.getTime());

  const upcomingCount = enriched.filter(
    (b) => !b.isPast && b.status !== "cancelled",
  ).length;
  const completedCount = enriched.filter(
    (b) => b.status === "completed",
  ).length;
  const cancelledCount = enriched.filter(
    (b) => b.status === "cancelled",
  ).length;

  const markComplete = (b: PTBooking) => {
    updateBooking(b.id, { status: "completed" });
    toast.success("Đã ghi nhận buổi tập hoàn thành.");
  };

  const saveNote = () => {
    if (!editingNote) return;
    updateBooking(editingNote.id, { note: noteDraft.trim() });
    setEditingNote(null);
    setNoteDraft("");
    toast.success("Đã lưu nhận xét buổi tập.");
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Sắp diễn ra"
          value={String(upcomingCount)}
          hint="Buổi tập đã đặt trước"
        />
        <StatCard
          label="Đã hoàn thành"
          value={String(completedCount)}
          hint="Được đánh dấu hoàn tất"
        />
        <StatCard
          label="Đã hủy"
          value={String(cancelledCount)}
          hint="Học viên hoặc hệ thống hủy"
        />
      </div>

      <Card className="border-primary/10 shadow-card bg-white/70 backdrop-blur-sm">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 rounded-lg border bg-slate-100/50 p-1">
              {(["upcoming", "past", "all"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-md px-3 py-1 text-xs font-bold capitalize transition-colors ${
                    filter === f
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {f === "upcoming"
                    ? "Sắp tới"
                    : f === "past"
                      ? "Đã qua"
                      : "Tất cả"}
                </button>
              ))}
            </div>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tên học viên, email, SĐT..."
              className="w-full sm:max-w-xs"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-400">
              Không tìm thấy lịch hẹn tập nào.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-white">
              {filtered.map((b) => (
                <li
                  key={b.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {b.customerAvatar ? (
                      <img
                        src={b.customerAvatar}
                        alt={b.customerName ?? "Học viên"}
                        className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-slate-100 shadow-sm"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 text-sm font-bold shadow-inner">
                        {(b.customerName ?? "G").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="truncate text-sm font-bold text-slate-800">
                          {b.customerName ?? "Khách vãng lai"}
                        </span>
                        <BookingStatusBadge
                          status={b.status ?? "confirmed"}
                          isPast={b.isPast}
                        />
                      </div>
                      <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-1 text-[10px] font-medium text-slate-400">
                        {b.customerEmail && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {b.customerEmail}
                          </span>
                        )}
                        {b.customerPhone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {b.customerPhone}
                          </span>
                        )}
                      </div>
                      {/* Mobile Date and Time (shown inside client info area on mobile) */}
                      <div className="mt-2 flex items-center gap-2 sm:hidden">
                        <span className="text-xs font-bold text-slate-700">
                          {b.when.toLocaleDateString("vi-VN", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {b.time}
                        </span>
                      </div>
                      {b.note && (
                        <div className="mt-2 inline-flex items-start gap-1 rounded-md bg-slate-50 border border-slate-100 p-2 text-[11px] text-slate-500 w-full sm:w-auto">
                          <StickyNote className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
                          <span className="whitespace-pre-wrap">{b.note}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 shrink-0">
                    {/* Desktop Date and Time */}
                    <div className="hidden sm:block text-right min-w-[120px]">
                      <div className="text-sm font-bold text-slate-800">
                        {b.when.toLocaleDateString("vi-VN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </div>
                      <div className="text-xs font-mono font-bold text-emerald-600 mt-0.5 bg-emerald-50 px-2 py-0.5 rounded inline-block">
                        {b.time}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100">
                          <MoreHorizontal className="h-4 w-4 text-slate-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingNote(b);
                            setNoteDraft(b.note ?? "");
                          }}
                        >
                          <StickyNote className="mr-2 h-4 w-4" /> Ghi chú buổi học
                        </DropdownMenuItem>
                        {b.status !== "completed" && b.status !== "cancelled" && (
                          <DropdownMenuItem
                            onClick={() => markComplete(b)}
                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Hoàn thành
                            buổi học
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!editingNote}
        onOpenChange={(o) => {
          if (!o) {
            setEditingNote(null);
            setNoteDraft("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nhận xét / Ghi chú buổi học</DialogTitle>
          </DialogHeader>
          {editingNote && (
            <div className="grid gap-3">
              <div className="rounded-lg border bg-slate-50 p-3 text-sm">
                <div className="font-bold text-slate-800">
                  {editingNote.customerName ?? "Khách vãng lai"}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {new Date(editingNote.date).toLocaleDateString("vi-VN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}{" "}
                  · {editingNote.time}
                </div>
              </div>
              <Textarea
                rows={5}
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Điền các mục tiêu ca tập, chấn thương nếu có, bài tập trọng tâm, mức tạ, đánh giá của bạn..."
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingNote(null)}>
              Hủy
            </Button>
            <Button
              onClick={saveNote}
              className="bg-[#4F8A74] hover:bg-[#3f6e5d] text-white"
            >
              Lưu ghi chú
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
