import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Heart,
  MapPin,
  Phone,
  Star,
  Tag,
  ImageOff,
  CreditCard,
  Info,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trainersApi, type PublicTrainerDetail, type TrainerScheduleShift } from "@/api/trainers";
import { favoriteTrainerAPI } from "@/api/favoriteTrainers";
import { slugify, trainerSlug, extractIdFromSlug } from "@/utils/slugify";
import { notify } from "@/utils/notify";
import { cn } from "@/utils/cn";
import { TrainerSchedule } from "./components/TrainerSchedule";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const generateDefaultSlots = (): { start_time: string; end_time: string }[] => {
  const slots: { start_time: string; end_time: string }[] = [];
  let minutes = 5 * 60; // 05:00
  const endLimit = 21 * 60; // 21:00
  while (minutes + 90 <= endLimit) {
    const sh = Math.floor(minutes / 60);
    const sm = minutes % 60;
    const eh = Math.floor((minutes + 90) / 60);
    const em = (minutes + 90) % 60;
    slots.push({
      start_time: `${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}`,
      end_time: `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`,
    });
    minutes += 90;
  }
  return slots;
};








const hasLoggedInUser = (): boolean => {
  const userData = localStorage.getItem("user");
  const token = localStorage.getItem("token");
  if (!userData || !token) return false;
  if (userData === "undefined" || userData === "null") return false;
  return true;
};

const formatPrice = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "Liên hệ";
  }
  return `${Number(value).toLocaleString("vi-VN")}đ`;
};

const formatDate = (raw: string | null | undefined): string => {
  if (!raw) return "—";
  try {
    return new Date(raw).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

const buildAvatarFallback = (name: string | null | undefined): string => {
  const safeName = (name || "Trainer").slice(0, 32);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    safeName,
  )}&background=4F8A74&color=fff&size=400`;
};

const formatLocalDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function TrainerDetail() {
  const { slug } = useParams<{ slug: string }>();
  const id = slug ? String(extractIdFromSlug(slug)) : undefined;
  const navigate = useNavigate();
  const [trainer, setTrainer] = useState<PublicTrainerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Lịch làm việc state
  const [schedule, setSchedule] = useState<TrainerScheduleShift[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const x = new Date();
    const diff = (x.getDay() + 6) % 7; // Monday = 0
    x.setDate(x.getDate() - diff);
    x.setHours(0, 0, 0, 0);
    return x;
  });
  const [selectedDay, setSelectedDay] = useState<string>(() =>
    formatLocalDate(new Date())
  );

  // Favorite state — chỉ load khi user đã đăng nhập.
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteToggling, setFavoriteToggling] = useState(false);
  const isAuthenticated = hasLoggedInUser();

  const [closures, setClosures] = useState<any[]>([]);
  const [daysOff, setDaysOff] = useState<any[]>([]);

  // States quản lý AlertDialog xác nhận đặt lịch
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<{ date: string; slot: string } | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<Array<{ date: string; time: string }>>([]);

  // States quản lý Tự động xếp lịch tập nhanh
  const [autoScheduleOpen, setAutoScheduleOpen] = useState(false);
  const [autoScheduleLoading, setAutoScheduleLoading] = useState(false);
  const [autoSessionsCount, setAutoSessionsCount] = useState<number>(4);
  const [autoStartDate, setAutoStartDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatLocalDate(tomorrow);
  });
  const [autoSelectedDays, setAutoSelectedDays] = useState<number[]>([1, 3, 5]); // Thứ 2, 4, 6
  const [autoPreferredTime, setAutoPreferredTime] = useState<string>("08:00");

  // States quản lý Tự động lặp lại lịch tuần này (Auto-repeat weekly pattern)
  const [repeatPatternOpen, setRepeatPatternOpen] = useState(false);
  const [repeatTargetCount, setRepeatTargetCount] = useState<number>(10);
  const [repeatStartDate, setRepeatStartDate] = useState<string>("");
  const [repeatLoading, setRepeatLoading] = useState(false);

  const openRepeatPatternDialog = () => {
    if (selectedSlots.length === 0) return;
    
    // Tìm ngày lớn nhất trong các slot đã chọn để cộng thêm 1 ngày
    const dates = selectedSlots.map(s => new Date(s.date).getTime());
    const maxTime = Math.max(...dates);
    const start = new Date(maxTime);
    start.setDate(start.getDate() + 1);
    
    setRepeatStartDate(formatLocalDate(start));
    setRepeatTargetCount(10);
    setRepeatPatternOpen(true);
  };

  const handleRepeatPattern = async () => {
    if (!id || selectedSlots.length === 0) return;
    setRepeatLoading(true);
    try {
      // 1. Phân tích pattern của các slot đã chọn hiện tại
      const patternMap = new Map<string, { dayOfWeek: number; time: string }>();
      for (const slot of selectedSlots) {
        const d = new Date(slot.date);
        const dayOfWeek = d.getDay(); // 0 = CN, 1 = T2...
        const key = `${dayOfWeek}-${slot.time}`;
        patternMap.set(key, { dayOfWeek, time: slot.time });
      }
      const pattern = Array.from(patternMap.values());

      if (pattern.length === 0) {
        notify.info("Không phát hiện lịch hẹn nào được chọn để lặp lại.");
        setRepeatPatternOpen(false);
        return;
      }

      // 2. Gọi API lấy schedule của trainer trong 60 ngày tới từ Ngày Bắt Đầu
      const start = new Date(repeatStartDate);
      const end = new Date(start);
      end.setDate(start.getDate() + 59); // Quét 60 ngày tiếp theo (khoảng 8 tuần)

      const startStr = formatLocalDate(start);
      const endStr = formatLocalDate(end);

      const scheduleRes = await trainersApi.getSchedule(id, startStr, endStr);
      const trainerSchedule = scheduleRes.data.data || [];

      // Group schedule theo ngày
      const groupedSchedule: Record<string, typeof trainerSchedule[0]> = {};
      for (const entry of trainerSchedule) {
        const dateKey = entry.date.split("T")[0];
        groupedSchedule[dateKey] = entry;
      }

      // 3. Khởi tạo danh sách slots mới, bắt đầu bằng các slot cũ đã chọn
      const mergedSelected = [...selectedSlots];

      // Theo dõi giới hạn số buổi tập mỗi tuần (tối đa 4)
      const weekCounts: Record<string, number> = {};
      const getStartOfWeekTimeStr = (dateStr: string): string => {
        const target = new Date(dateStr);
        const day = target.getDay();
        const offset = day === 0 ? -6 : 1 - day;
        const monday = new Date(target);
        monday.setDate(target.getDate() + offset);
        monday.setHours(0, 0, 0, 0);
        return formatLocalDate(monday);
      };

      for (const slot of mergedSelected) {
        const monKey = getStartOfWeekTimeStr(slot.date);
        weekCounts[monKey] = (weekCounts[monKey] || 0) + 1;
      }

      // Quét ngày từng ngày
      let currentDate = new Date(start);
      let addedCount = 0;

      for (let i = 0; i < 60; i++) {
        if (mergedSelected.length >= repeatTargetCount) {
          break;
        }

        const dateStr = formatLocalDate(currentDate);
        const weekday = currentDate.getDay(); // 0 = CN, 1 = T2...

        // Lấy tất cả các slot trong pattern khớp với thứ hiện tại
        const patternSlotsForDay = pattern.filter((p) => p.dayOfWeek === weekday);

        for (const pat of patternSlotsForDay) {
          if (mergedSelected.length >= repeatTargetCount) {
            break;
          }

          const timeStr = pat.time;

          // Kiểm tra xem HLV có bận (daysOff) ngày này không
          const isTrainerOff = daysOff.some(
            (d: any) => d.trainerId === id && d.date === dateStr
          );
          if (isTrainerOff) continue;

          // Kiểm tra giới hạn 4 ca/tuần và khách hàng chưa chọn ca nào ngày này
          const monKey = getStartOfWeekTimeStr(dateStr);
          const currentWeekCount = weekCounts[monKey] || 0;

          const hasSlotToday = mergedSelected.some((s) => s.date === dateStr);

          if (currentWeekCount < 4 && !hasSlotToday) {
            const entry = groupedSchedule[dateStr];
            let isAvailable = false;

            if (entry && entry.slots) {
              // HLV có lịch làm việc -> tìm slot khớp giờ
              const matchingSlot = entry.slots.find(
                (s) => s.start_time === timeStr
              );

              if (matchingSlot && matchingSlot.status === "available") {
                // Kiểm tra closures
                const isClosed = closures.some(
                  (c: any) =>
                    c.trainerId === id &&
                    c.date === dateStr &&
                    c.time === timeStr
                );

                // Kiểm tra slot trong quá khứ
                const isPast = new Date(`${dateStr}T${timeStr}:00`) < new Date();

                if (!isClosed && !isPast) {
                  isAvailable = true;
                }
              }
            } else {
              // HLV chưa xếp lịch trực ngày này -> dùng lịch linh hoạt
              const standardSlots = generateDefaultSlots();
              const isPast = new Date(`${dateStr}T${timeStr}:00`) < new Date();
              const isSlotValid = standardSlots.some(
                (s) => s.start_time === timeStr
              );

              if (isSlotValid && !isPast) {
                isAvailable = true;
              }
            }

            if (isAvailable) {
              mergedSelected.push({ date: dateStr, time: timeStr });
              weekCounts[monKey] = currentWeekCount + 1;
              addedCount++;
            }
          }
        }

        // Tăng ngày tiếp theo
        currentDate.setDate(currentDate.getDate() + 1);
      }

      if (addedCount === 0) {
        notify.info("Không tìm thấy ca tập trống phù hợp trong các tuần tiếp theo để lặp lại.");
      } else {
        setSelectedSlots(mergedSelected);
        if (mergedSelected.length < repeatTargetCount) {
          notify.success(
            `Đã lặp lại và chọn thêm ${addedCount} ca tập phù hợp (yêu cầu ${repeatTargetCount} ca nhưng các ca còn lại đã bận hoặc vượt giới hạn tuần).`
          );
        } else {
          notify.success(`Đã tự động lặp lịch thành công và chọn đủ ${repeatTargetCount} ca tập!`);
        }
        setRepeatPatternOpen(false);
      }
    } catch (err: any) {
      console.error("Repeat schedule error:", err);
      notify.error("Không thể lặp lại lịch tập. Vui lòng thử lại.");
    } finally {
      setRepeatLoading(false);
    }
  };

  const handleAutoSchedule = async () => {
    if (!id) return;
    setAutoScheduleLoading(true);
    try {
      // 1. Tính ngày kết thúc (StartDate + 28 ngày) để lấy lịch biểu HLV trong 4 tuần tới
      const start = new Date(autoStartDate);
      const end = new Date(start);
      end.setDate(start.getDate() + 27); // 28 ngày bao gồm start date

      const startStr = formatLocalDate(start);
      const endStr = formatLocalDate(end);

      // 2. Fetch schedule của trainer
      const scheduleRes = await trainersApi.getSchedule(id, startStr, endStr);
      const trainerSchedule = scheduleRes.data.data || [];

      // Group trainer schedule by date key
      const groupedSchedule: Record<string, typeof trainerSchedule[0]> = {};
      for (const entry of trainerSchedule) {
        const dateKey = entry.date.split("T")[0];
        groupedSchedule[dateKey] = entry;
      }

      // 3. Khởi tạo danh sách slots mới chọn được
      const newSelected: Array<{ date: string; time: string }> = [];
      
      // Để theo dõi giới hạn số buổi tập mỗi tuần:
      const weekCounts: Record<string, number> = {};

      const getStartOfWeekTimeStr = (dateStr: string): string => {
        const target = new Date(dateStr);
        const day = target.getDay();
        const offset = day === 0 ? -6 : 1 - day;
        const monday = new Date(target);
        monday.setDate(target.getDate() + offset);
        monday.setHours(0, 0, 0, 0);
        return formatLocalDate(monday);
      };

      const initialSelected = [...selectedSlots];
      for (const slot of initialSelected) {
        const monKey = getStartOfWeekTimeStr(slot.date);
        weekCounts[monKey] = (weekCounts[monKey] || 0) + 1;
      }

      // Duyệt qua từng ngày trong 28 ngày tới
      let currentDate = new Date(start);
      for (let i = 0; i < 28; i++) {
        if (newSelected.length >= autoSessionsCount) {
          break;
        }

        const dateStr = formatLocalDate(currentDate);
        const weekday = currentDate.getDay(); // 0 is Sunday, 1 is Monday...

        // Kiểm tra xem thứ này có được người dùng chọn không
        if (autoSelectedDays.includes(weekday)) {
          // Kiểm tra xem HLV có nghỉ phép (daysOff) ngày này không
          const isTrainerOff = daysOff.some(
            (d) => d.trainerId === id && d.date === dateStr
          );

          if (!isTrainerOff) {
            const monKey = getStartOfWeekTimeStr(dateStr);
            const currentWeekCount = weekCounts[monKey] || 0;

            // Kiểm tra giới hạn 4 ca/tuần và khách hàng chưa chọn ca nào ngày này
            const hasSlotToday = initialSelected.some((s) => s.date === dateStr) || newSelected.some((s) => s.date === dateStr);

            if (currentWeekCount < 4 && !hasSlotToday) {
              const entry = groupedSchedule[dateStr];
              let isAvailable = false;

              if (entry && entry.slots) {
                // HLV có lịch trực → tìm slot khớp giờ
                const matchingSlot = entry.slots.find(
                  (s) => s.start_time === autoPreferredTime
                );

                if (matchingSlot && matchingSlot.status === "available") {
                  // Kiểm tra xem có bị đóng/bận bởi closures không
                  const isClosed = closures.some(
                    (c) =>
                      c.trainerId === id &&
                      c.date === dateStr &&
                      c.time === autoPreferredTime
                  );

                  // Kiểm tra xem slot có ở quá khứ không
                  const isPast = new Date(`${dateStr}T${autoPreferredTime}:00`) < new Date();

                  if (!isClosed && !isPast) {
                    isAvailable = true;
                  }
                }
              } else {
                // HLV chưa xếp ca làm việc ngày này → "lịch linh hoạt"
                const standardSlots = generateDefaultSlots();
                const isPast = new Date(`${dateStr}T${autoPreferredTime}:00`) < new Date();
                const isSlotValid = standardSlots.some(
                  (s) => s.start_time === autoPreferredTime
                );

                if (isSlotValid && !isPast) {
                  isAvailable = true;
                }
              }

              if (isAvailable) {
                newSelected.push({ date: dateStr, time: autoPreferredTime });
                weekCounts[monKey] = currentWeekCount + 1;
              }
            }
          }
        }

        // Tăng thêm 1 ngày
        currentDate.setDate(currentDate.getDate() + 1);
      }

      if (newSelected.length === 0) {
        notify.info("Không tìm thấy ca tập trống nào phù hợp với cấu hình của bạn trong 4 tuần tới.");
      } else {
        // Gộp vào selectedSlots, tránh trùng lặp
        setSelectedSlots((prev) => {
          const merged = [...prev];
          let addedCount = 0;
          for (const ns of newSelected) {
            const exists = merged.some(
              (s) => s.date === ns.date && s.time === ns.time
            );
            if (!exists) {
              const dayHasSlot = merged.some((s) => s.date === ns.date);
              const getStartOfWeekTimeMs = (dateStr: string): number => {
                const target = new Date(dateStr);
                const day = target.getDay();
                const offset = day === 0 ? -6 : 1 - day;
                const monday = new Date(target);
                monday.setDate(target.getDate() + offset);
                monday.setHours(0, 0, 0, 0);
                return monday.getTime();
              };
              const targetWeekTime = getStartOfWeekTimeMs(ns.date);
              const slotsInSameWeek = merged.filter(
                (s) => getStartOfWeekTimeMs(s.date) === targetWeekTime
              );

              if (!dayHasSlot && slotsInSameWeek.length < 4) {
                merged.push(ns);
                addedCount++;
              }
            }
          }
          if (addedCount > 0) {
            if (addedCount < autoSessionsCount) {
              notify.success(
                `Đã tự động chọn thêm ${addedCount} ca tập phù hợp (yêu cầu ${autoSessionsCount} ca nhưng các ca còn lại đã bận hoặc vượt giới hạn tuần).`
              );
            } else {
              notify.success(`Đã tự động chọn thành công ${addedCount} ca tập phù hợp!`);
            }
          } else {
            notify.info(
              "Các ca tập phù hợp được tìm thấy đều trùng với những ca bạn đã chọn hoặc vượt giới hạn ca tập."
            );
          }
          return merged;
        });

        setAutoScheduleOpen(false);
      }
    } catch (err: any) {
      console.error("Auto schedule error:", err);
      notify.error("Không thể tự động xếp ca làm việc. Vui lòng thử lại.");
    } finally {
      setAutoScheduleLoading(false);
    }
  };

  useEffect(() => {
    try {
      const rawClosures = localStorage.getItem("gym_trainer_closures_v1");
      const rawDaysOff = localStorage.getItem("gym_trainer_days_off_v1");

      setClosures(rawClosures ? JSON.parse(rawClosures) : []);
      setDaysOff(rawDaysOff ? JSON.parse(rawDaysOff) : []);
    } catch (e) {
      console.error(e);
    }
  }, [id]);

  const handleToggleSlot = (date: string, time: string) => {
    if (!isAuthenticated) {
      notify.info("Vui lòng đăng nhập để đặt lịch tập.");
      sessionStorage.setItem("postLoginRedirect", `/trainers/${slug}`);
      navigate("/login");
      return;
    }
    setSelectedSlots((prev) => {
      const exists = prev.some((s) => s.date === date && s.time === time);
      if (exists) {
        return prev.filter((s) => !(s.date === date && s.time === time));
      } else {
        // 1. Ràng buộc: Mỗi ngày tối đa 1 ca
        const hasSlotForDay = prev.some((s) => s.date === date);
        if (hasSlotForDay) {
          const formattedDate = date.split('-').reverse().join('/');
          notify.warning(`Mỗi ngày bạn chỉ được đăng ký tối đa 1 ca tập. Ngày ${formattedDate} đã có ca được chọn.`);
          return prev;
        }

        // 2. Ràng buộc: Mỗi tuần tối đa 4 ca
        const getStartOfWeekTime = (dateStr: string): number => {
          const target = new Date(dateStr);
          const day = target.getDay();
          const offset = day === 0 ? -6 : 1 - day;
          const monday = new Date(target);
          monday.setDate(target.getDate() + offset);
          monday.setHours(0, 0, 0, 0);
          return monday.getTime();
        };

        const targetWeek = getStartOfWeekTime(date);
        const slotsInSameWeek = prev.filter((s) => getStartOfWeekTime(s.date) === targetWeek);
        if (slotsInSameWeek.length >= 4) {
          const monday = new Date(targetWeek);
          const sunday = new Date(monday);
          sunday.setDate(monday.getDate() + 6);
          const formattedMonday = monday.toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit' });
          const formattedSunday = sunday.toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit' });
          notify.warning(`Bạn chỉ được chọn tối đa 4 buổi tập trong cùng một tuần (từ ngày ${formattedMonday} đến ngày ${formattedSunday}).`);
          return prev;
        }

        return [...prev, { date, time }];
      }
    });
  };

  const handleBookSlot = (date: string, slot: string) => {
    if (!isAuthenticated) {
      notify.info("Vui lòng đăng nhập để đặt lịch tập.");
      sessionStorage.setItem("postLoginRedirect", `/trainers/${slug}`);
      navigate("/login");
      return;
    }
    // Backward compatibility for single click
    setSelectedSlots([{ date, time: slot }]);
    setConfirmOpen(true);
  };

  const executeBooking = async () => {
    if (selectedSlots.length === 0) return;
    setBookingLoading(true);
    try {
      // Gọi API đặt lịch hàng loạt phía Backend
      await trainersApi.bookSlot({
        trainer_id: Number(id),
        slots: selectedSlots
      });

      // Tải lại lịch (schedule giờ đã bao gồm trạng thái booked/available)
      const start_date = formatLocalDate(weekStart);
      const future = new Date(weekStart);
      future.setDate(weekStart.getDate() + 6);
      const end_date = formatLocalDate(future);

      const scheduleRes = await trainersApi.getSchedule(id!, start_date, end_date);
      setSchedule(scheduleRes.data.data);

      const count = selectedSlots.length;
      notify.success(`Đặt thành công ${count} lịch tập với HLV!`);
      setConfirmOpen(false);
      setSelectedSlots([]);
      setBookingError(null);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || "";
      if (errorMsg.includes("Vui lòng mua gói tập hoặc mua lẻ") || errorMsg.includes("Bạn không có buổi tập nào còn lại")) {
        setBookingError("Bạn hiện chưa đăng ký đủ số buổi tập PT còn hiệu lực với huấn luyện viên này. Vui lòng mua gói tập mới hoặc chọn phương thức mua lẻ từng buổi.");
      } else {
        setBookingError(errorMsg || "Không thể đặt lịch. Vui lòng thử lại.");
      }
    } finally {
      setBookingLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setErrorMessage(null);
        setNotFound(false);
        const response = await trainersApi.getById(id);
        if (cancelled) return;
        setTrainer(response.data.data);
      } catch (error: unknown) {
        if (cancelled) return;
        const err = error as {
          response?: { status?: number; data?: { message?: string } };
        };
        const status = err?.response?.status;
        if (status === 404) {
          setNotFound(true);
        } else {
          setErrorMessage(
            err?.response?.data?.message ||
              "Không thể tải thông tin huấn luyện viên. Vui lòng thử lại sau.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Load lịch làm việc và lịch bận của trainer trong tuần được chọn
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function loadSchedule() {
      try {
        setScheduleLoading(true);
        const start_date = formatLocalDate(weekStart);

        const future = new Date(weekStart);
        future.setDate(weekStart.getDate() + 6); // Lấy 7 ngày tiếp theo
        const end_date = formatLocalDate(future);

        const scheduleRes = await trainersApi.getSchedule(id!, start_date, end_date);

        if (cancelled) return;
        setSchedule(scheduleRes.data.data);
      } catch (error) {
        console.error("Không thể tải lịch trực của trainer", error);
      } finally {
        if (!cancelled) setScheduleLoading(false);
      }
    }
    loadSchedule();
    return () => {
      cancelled = true;
    };
  }, [id, weekStart]);

  // Load trạng thái favorite khi đã có trainer + user đã login.
  useEffect(() => {
    if (!id || !isAuthenticated) {
      return;
    }
    let cancelled = false;
    async function loadStatus() {
      try {
        const response = await favoriteTrainerAPI.getStatus(id!);
        if (cancelled) return;
        setIsFavorited(!!response.data.data?.is_favorited);
      } catch {
        // Không phá luồng đọc detail nếu API status lỗi (vd token vừa hết hạn).
        if (!cancelled) setIsFavorited(false);
      }
    }
    loadStatus();
    return () => {
      cancelled = true;
    };
  }, [id, isAuthenticated]);

  async function handleToggleFavorite() {
    if (!trainer) return;

    // Guest → redirect login, không gọi API.
    if (!isAuthenticated) {
      notify.info("Vui lòng đăng nhập để lưu huấn luyện viên yêu thích.");
      sessionStorage.setItem(
        "postLoginRedirect",
        `/trainers/${trainerSlug(trainer.full_name, trainer.id)}`,
      );
      navigate("/login");
      return;
    }

    if (favoriteToggling) return;

    // Optimistic update — đảo trạng thái UI ngay, rollback nếu API fail.
    const nextValue = !isFavorited;
    setIsFavorited(nextValue);
    setFavoriteToggling(true);

    try {
      if (nextValue) {
        await favoriteTrainerAPI.add(trainer.id);
        notify.success("Đã thêm vào danh sách yêu thích.");
      } else {
        await favoriteTrainerAPI.remove(trainer.id);
        notify.success("Đã bỏ khỏi danh sách yêu thích.");
      }
    } catch (error: unknown) {
      // Rollback
      setIsFavorited(!nextValue);
      const err = error as {
        response?: { data?: { message?: string } };
      };
      notify.error(
        err?.response?.data?.message ||
          "Không thể cập nhật trạng thái yêu thích. Vui lòng thử lại.",
      );
    } finally {
      setFavoriteToggling(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 animate-pulse">
          <div className="h-6 w-32 bg-slate-100 rounded mb-8" />
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-4">
              <div className="aspect-[4/5] bg-slate-100 rounded-2xl" />
              <div className="h-5 bg-slate-100 rounded w-2/3" />
              <div className="h-4 bg-slate-100 rounded w-1/2" />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <div className="h-8 bg-slate-100 rounded w-3/4" />
              <div className="h-4 bg-slate-100 rounded w-full" />
              <div className="h-4 bg-slate-100 rounded w-5/6" />
              <div className="h-4 bg-slate-100 rounded w-2/3" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="h-16 bg-slate-100 rounded-xl" />
                <div className="h-16 bg-slate-100 rounded-xl" />
                <div className="h-16 bg-slate-100 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // 404 state
  if (notFound || !trainer) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <main className="flex-1 grid place-items-center px-4 py-24 text-center">
          <div className="max-w-md">
            <div className="mx-auto h-16 w-16 grid place-items-center rounded-full bg-slate-100">
              <ImageOff className="h-7 w-7 text-slate-400" />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-slate-900">
              Không tìm thấy huấn luyện viên
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Huấn luyện viên này có thể đã ngừng hoạt động hoặc đường dẫn không
              hợp lệ.
            </p>
            <Button asChild className="mt-6">
              <Link to="/gyms">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Về danh sách phòng tập
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Generic error state
  if (errorMessage) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <main className="flex-1 grid place-items-center px-4 py-24 text-center">
          <div className="max-w-md">
            <h1 className="text-2xl font-bold text-rose-600">Đã có lỗi xảy ra</h1>
            <p className="mt-2 text-sm text-slate-500">{errorMessage}</p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Thử lại
              </Button>
              <Button asChild>
                <Link to="/gyms">Về danh sách phòng tập</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const avatar =
    trainer.user?.avatar_url ||
    trainer.avatar_url ||
    buildAvatarFallback(trainer.full_name);

  const ratingDisplay =
    trainer.rating > 0 ? trainer.rating.toFixed(1) : "Chưa có";

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        {/* Back link */}
        {trainer.branch && trainer.branch.branch_name ? (
          <Link
            to={`/gyms/${slugify(trainer.branch.branch_name)}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Trở về {trainer.branch.branch_name}
          </Link>
        ) : (
          <Link
            to="/gyms"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Trở về danh sách phòng tập
          </Link>
        )}

        {/* Hero */}
        <section className="mt-6 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="aspect-[4/5] overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
              <img
                src={avatar}
                alt={trainer.full_name || "Huấn luyện viên"}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = buildAvatarFallback(
                    trainer.full_name,
                  );
                }}
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="flex flex-wrap items-center gap-2">
              {trainer.specialization ? (
                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-500/20 rounded-full px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
                  {trainer.specialization}
                </Badge>
              ) : null}
              {trainer.level ? (
                <Badge className="bg-slate-100 text-slate-700 rounded-full px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide capitalize">
                  {trainer.level} Trainer
                </Badge>
              ) : null}
            </div>

            <div className="mt-3 flex items-start gap-3">
              <h1 className="flex-1 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                {trainer.full_name || "Huấn luyện viên"}
              </h1>
              <button
                type="button"
                onClick={handleToggleFavorite}
                disabled={favoriteToggling}
                aria-label={
                  isFavorited
                    ? "Bỏ khỏi danh sách yêu thích"
                    : "Lưu vào danh sách yêu thích"
                }
                aria-pressed={isFavorited}
                title={
                  isFavorited
                    ? "Bỏ khỏi danh sách yêu thích"
                    : "Lưu vào danh sách yêu thích"
                }
                className={cn(
                  "shrink-0 inline-flex h-11 w-11 items-center justify-center rounded-full border transition-all",
                  "hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed",
                  isFavorited
                    ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                    : "border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:text-rose-500",
                )}
              >
                <Heart
                  className={cn(
                    "h-5 w-5 transition-transform",
                    isFavorited && "fill-rose-500 text-rose-500",
                  )}
                />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-slate-700">
                  {ratingDisplay}
                </span>
                {trainer.review_count > 0 ? (
                  <span>· {trainer.review_count} đánh giá</span>
                ) : null}
              </span>
              {trainer.years_experience > 0 ? (
                <span className="inline-flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-emerald-600" />
                  {trainer.years_experience} năm kinh nghiệm
                </span>
              ) : null}
              {trainer.branch && trainer.branch.branch_name ? (
                <Link
                  to={`/gyms/${slugify(trainer.branch.branch_name)}`}
                  className="inline-flex items-center gap-1.5 hover:text-slate-900"
                >
                  <Building2 className="h-4 w-4" />
                  {trainer.branch.branch_name}
                </Link>
              ) : null}
            </div>

            {/* Bio */}
            <div className="mt-6">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Giới thiệu
              </h2>
              <p className="mt-2 text-base leading-relaxed text-slate-700 whitespace-pre-line">
                {trainer.bio?.trim()
                  ? trainer.bio
                  : "Huấn luyện viên chưa cập nhật phần giới thiệu."}
              </p>
            </div>

            {/* Quick stats */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Stat label="Kinh nghiệm" value={`${trainer.years_experience || 0} năm`} />
              <Stat label="Giá theo giờ" value={formatPrice(trainer.hourly_rate)} />
              <Stat label="Đánh giá" value={ratingDisplay} />
            </div>

            {/* Contact (optional) */}
            {(trainer.phone_number || trainer.address) && (
              <div className="mt-6 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                {trainer.phone_number ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-emerald-600" />
                    {trainer.phone_number}
                  </span>
                ) : null}
                {trainer.address ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    {trainer.address}
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </section>

        {/* Certifications */}
        <section className="mt-16">
          <SectionHeader
            title="Chứng chỉ"
            subtitle="Các chứng chỉ chuyên môn đã được xác minh."
          />
          {trainer.certificates.length === 0 ? (
            <EmptyState text="Huấn luyện viên chưa có chứng chỉ được công khai." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trainer.certificates.map((cert) => (
                <Card
                  key={cert.id}
                  className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden"
                >
                  {cert.image_url ? (
                    <div className="aspect-[4/3] overflow-hidden bg-slate-50">
                      <img
                        src={cert.image_url}
                        alt={cert.cert_name || "Chứng chỉ"}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : null}
                  <CardContent className="p-5">
                    <div className="flex items-start gap-2">
                      <Award className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600" />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900 line-clamp-2">
                          {cert.cert_name || "Chứng chỉ chuyên môn"}
                        </h3>
                        {cert.issued_by ? (
                          <p className="text-xs text-slate-500 mt-0.5">
                            Cấp bởi {cert.issued_by}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-3 space-y-1 text-xs text-slate-500">
                      {cert.certificate_number ? (
                        <Row
                          icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                          label="Mã"
                          value={cert.certificate_number}
                        />
                      ) : null}
                      {cert.issued_at ? (
                        <Row
                          icon={<Calendar className="h-3.5 w-3.5 text-slate-400" />}
                          label="Ngày cấp"
                          value={formatDate(cert.issued_at)}
                        />
                      ) : null}
                      {cert.expires_at ? (
                        <Row
                          icon={<Calendar className="h-3.5 w-3.5 text-slate-400" />}
                          label="Hết hạn"
                          value={formatDate(cert.expires_at)}
                        />
                      ) : null}
                    </div>
                    {cert.image_url ? (
                      <a
                        href={cert.image_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                      >
                        Xem ảnh chứng chỉ
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Packages */}
        <section id="trainer-packages-section" className="mt-16">
          <SectionHeader
            title="Gói tập với huấn luyện viên"
            subtitle={
              trainer.level
                ? `Các gói áp dụng cho cấp độ ${trainer.level}.`
                : "Các gói tập đang được cung cấp."
            }
          />
          {trainer.packages.length === 0 ? (
            <EmptyState
              text={
                trainer.level
                  ? "Hiện chưa có gói tập tương ứng cấp độ này."
                  : "Hiện chưa có gói tập được cấu hình."
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trainer.packages.map((pkg) => (
                <Card
                  key={pkg.id}
                  className="rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-5 flex flex-col h-full">
                    <h3 className="font-bold text-slate-900">{pkg.package_name}</h3>
                    <p className="text-xs text-slate-500 mt-1 capitalize">
                      {pkg.mode} · {pkg.session_count} buổi
                    </p>
                    {pkg.description ? (
                      <p className="mt-3 text-sm text-slate-600 line-clamp-3">
                        {pkg.description}
                      </p>
                    ) : null}
                    <div className="mt-auto pt-5 space-y-1">
                      <div className="flex items-baseline gap-2">
                        <Tag className="h-4 w-4 text-emerald-600" />
                        <span className="text-xl font-extrabold text-slate-900">
                          {formatPrice(pkg.package_price)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {formatPrice(pkg.price_per_session)} / buổi
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        if (!isAuthenticated) {
                          notify.info("Vui lòng đăng nhập để đặt gói tập.");
                          sessionStorage.setItem("postLoginRedirect", `/trainers/${slug}`);
                          navigate("/login");
                          return;
                        }
                        navigate(`/checkout-trainer-package/${trainer.id}/${pkg.id}`);
                      }}
                      className="mt-4 w-full bg-primary hover:bg-primary/95 text-primary-foreground rounded-xl"
                    >
                      Đặt gói tập
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Lịch làm việc */}
        <section className="mt-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Lịch tuần làm việc
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Xem khung giờ làm việc của huấn luyện viên và đặt lịch tập (mỗi buổi 1h30 phút).
              </p>
            </div>
          </div>
          <TrainerSchedule
            trainerId={id!}
            schedule={schedule}
            scheduleLoading={scheduleLoading}
            weekStart={weekStart}
            setWeekStart={setWeekStart}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            daysOff={daysOff}
            closures={closures}
            handleBookSlot={handleBookSlot}
            selectedSlots={selectedSlots}
            onToggleSlot={handleToggleSlot}
            bookedTimes={schedule.reduce<Record<string, string[]>>((acc, entry) => {
              const dateKey = entry.date.split("T")[0];
              if (!acc[dateKey]) acc[dateKey] = [];
              entry.slots.filter(s => s.status === "booked").forEach(s => acc[dateKey].push(s.start_time));
              return acc;
            }, {})}
          />

          {selectedSlots.length > 0 && (
            <Card className="mt-6 border border-emerald-100 bg-emerald-50/20 p-5 rounded-2xl shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 text-base">
                    Bạn đã chọn {selectedSlots.length} buổi tập
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Danh sách các buổi tập đăng ký:
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedSlots.map((slot, index) => (
                      <Badge
                        key={`${slot.date}-${slot.time}-${index}`}
                        variant="secondary"
                        className="bg-white border border-slate-200 text-slate-700 font-semibold py-1 px-2.5 rounded-xl flex items-center gap-1.5 shadow-sm text-xs"
                      >
                        <span>{formatDate(slot.date)} - {slot.time}</span>
                        <button
                          onClick={() => handleToggleSlot(slot.date, slot.time)}
                          className="text-slate-400 hover:text-rose-500 transition-colors focus:outline-none font-bold text-xs"
                          title="Hủy chọn"
                        >
                          ✕
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full md:w-auto">
                  <Button
                    onClick={openRepeatPatternDialog}
                    variant="outline"
                    className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold px-5 py-2.5 rounded-xl flex items-center gap-1.5"
                  >
                    <Sparkles className="h-4 w-4" />
                    Lặp lại lịch tuần này
                  </Button>
                  <Button
                    onClick={() => {
                      setConfirmOpen(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md shrink-0 w-full md:w-auto"
                  >
                    Xác nhận đặt lịch ({selectedSlots.length} buổi)
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </section>

        {/* Reviews */}
        <section className="mt-16">
          <SectionHeader
            title="Đánh giá học viên"
            subtitle={
              trainer.review_count > 0
                ? `Tổng ${trainer.review_count} đánh giá · trung bình ${ratingDisplay}/5`
                : "Hiện chưa có học viên nào đánh giá."
            }
          />
          {trainer.reviews.length === 0 ? (
            <EmptyState
              text="Chưa có đánh giá. Hãy là người đầu tiên trải nghiệm và để lại nhận xét."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {trainer.reviews.map((rev) => (
                <Card
                  key={rev.id}
                  className="rounded-2xl border border-slate-100 bg-white shadow-sm"
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{rev.author}</p>
                        <p className="text-xs text-slate-400">
                          {formatDate(rev.created_at)}
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-1 text-sm font-bold text-amber-500">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        {rev.rating.toFixed(1)}
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                      {rev.comment || "Học viên không để lại nhận xét."}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Dialog đặt lịch & chọn hình thức thanh toán */}
      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) {
            setBookingError(null);
          }
        }}
      >
        <AlertDialogContent className="max-w-md rounded-2xl border-0 p-6 shadow-lg bg-white">
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              Đặt lịch tập với HLV {trainer?.full_name}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 text-sm">
              {selectedSlots.length === 1 ? (
                <span>
                  Khung giờ: <strong className="text-slate-700">{selectedSlots[0].time}</strong> ngày <strong className="text-slate-700">{formatDate(selectedSlots[0].date)}</strong>
                </span>
              ) : (
                <span className="block">
                  Số lượng buổi chọn: <strong className="text-slate-700">{selectedSlots.length} buổi</strong>
                  <span className="block mt-2 max-h-28 overflow-y-auto bg-slate-50 p-2 rounded-lg text-xs space-y-1">
                    {selectedSlots.map((s, idx) => (
                      <span key={idx} className="block text-slate-600 font-medium">
                        • {formatDate(s.date)} vào lúc {s.time}
                      </span>
                    ))}
                  </span>
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {bookingError && (
            <div className="mt-3 p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-medium leading-relaxed flex gap-2 items-start animate-in fade-in slide-in-from-top-1">
              <Info className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
              <span>{bookingError}</span>
            </div>
          )}

          <div className="mt-5 space-y-3">
            {/* Option A: Dùng gói tập */}
            <button
              type="button"
              onClick={executeBooking}
              disabled={bookingLoading}
              className="w-full flex items-start gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 hover:border-slate-200 transition-all text-left group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="mt-0.5 rounded-lg bg-emerald-100 p-2 text-emerald-700 group-hover:scale-105 transition-transform shrink-0">
                {bookingLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Tag className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-sm">
                  {bookingLoading ? "Đang đặt lịch…" : `Đặt bằng gói tập PT (${selectedSlots.length} buổi)`}
                </p>
                <p className="text-slate-400 text-xs mt-0.5 leading-normal">
                  {bookingLoading
                    ? "Vui lòng chờ trong giây lát…"
                    : `Sử dụng ${selectedSlots.length} buổi từ gói tập đã mua của bạn.`}
                </p>
              </div>
            </button>

            {/* Option B: Mua lẻ */}
            {selectedSlots.length === 1 ? (
              <button
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                  if (selectedSlots.length > 0) {
                    navigate(
                      `/checkout-slot/${trainer?.id}/${selectedSlots[0].date}/${selectedSlots[0].time}`,
                    );
                  }
                }}
                disabled={bookingLoading}
                className="w-full flex items-start gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 hover:border-slate-200 transition-all text-left group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="mt-0.5 rounded-lg bg-blue-100 p-2 text-blue-700 group-hover:scale-105 transition-transform">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline gap-2">
                    <p className="font-semibold text-slate-800 text-sm">Mua lẻ slot này</p>
                    <span className="text-xs font-bold text-primary">
                      {formatPrice(trainer?.hourly_rate)}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5 leading-normal">
                    Thanh toán trực tiếp cho buổi tập này qua cổng PayOS.
                  </p>
                </div>
              </button>
            ) : (
              <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl text-xs text-blue-700 font-medium leading-relaxed flex gap-2 items-start">
                <Info className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
                <span>Để đặt lịch bằng hình thức mua lẻ (PayOS), vui lòng chọn và đặt riêng từng buổi một. Đặt lịch hàng loạt chỉ hỗ trợ trừ số buổi từ Gói tập PT đã mua.</span>
              </div>
            )}
          </div>

          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 pt-5 mt-4 border-t border-slate-50">
            <AlertDialogCancel
              onClick={() => {
                setConfirmOpen(false);
                setBookingError(null);
              }}
              className="h-10 sm:flex-1 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 order-2 sm:order-1"
            >
              Đóng
            </AlertDialogCancel>

            {bookingError && (
              <Button
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                  setPendingSlot(null);
                  setBookingError(null);
                  const packagesSection = document.getElementById(
                    "trainer-packages-section",
                  );
                  if (packagesSection) {
                    packagesSection.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="h-10 sm:flex-1 rounded-xl bg-primary text-white font-medium hover:bg-primary/95 order-1 sm:order-2"
              >
                Xem các gói PT
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hộp thoại Tự động xếp lịch */}
      <Dialog open={autoScheduleOpen} onOpenChange={setAutoScheduleOpen}>
        <DialogContent className="max-w-md rounded-2xl border-0 p-6 shadow-lg bg-white">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600 animate-pulse" />
              Tự động xếp lịch tập nhanh
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              Nhập các tùy chọn của bạn, hệ thống sẽ tự động quét và lựa chọn các ca tập trống phù hợp nhất của huấn luyện viên trong 4 tuần tới.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4 text-sm">
            {/* Số buổi */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Số buổi tập muốn xếp:</label>
              <input
                type="number"
                min={1}
                max={10}
                value={autoSessionsCount}
                onChange={(e) => setAutoSessionsCount(Math.max(1, Number(e.target.value)))}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-slate-800 font-medium"
              />
            </div>

            {/* Ngày bắt đầu */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Ngày bắt đầu tìm kiếm:</label>
              <input
                type="date"
                value={autoStartDate}
                onChange={(e) => setAutoStartDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-slate-800 font-medium"
              />
            </div>

            {/* Khung giờ */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Khung giờ tập ưa thích:</label>
              <select
                value={autoPreferredTime}
                onChange={(e) => setAutoPreferredTime(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-slate-800 font-medium"
              >
                <option value="05:00">05:00 – 06:30 (Sáng)</option>
                <option value="06:30">06:30 – 08:00 (Sáng)</option>
                <option value="08:00">08:00 – 09:30 (Sáng)</option>
                <option value="09:30">09:30 – 11:00 (Sáng)</option>
                <option value="11:00">11:00 – 12:30 (Sáng)</option>
                <option value="13:00">13:00 – 14:30 (Chiều)</option>
                <option value="14:30">14:30 – 16:00 (Chiều)</option>
                <option value="16:00">16:00 – 17:30 (Chiều)</option>
                <option value="17:30">17:30 – 19:00 (Tối)</option>
                <option value="19:00">19:00 – 20:30 (Tối)</option>
              </select>
            </div>

            {/* Chọn thứ */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Chọn các thứ trong tuần:</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "T2", value: 1 },
                  { label: "T3", value: 2 },
                  { label: "T4", value: 3 },
                  { label: "T5", value: 4 },
                  { label: "T6", value: 5 },
                  { label: "T7", value: 6 },
                  { label: "CN", value: 0 },
                ].map((day) => {
                  const isSelected = autoSelectedDays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => {
                        setAutoSelectedDays((prev) =>
                          prev.includes(day.value)
                            ? prev.filter((d) => d !== day.value)
                            : [...prev, day.value]
                        );
                      }}
                      className={cn(
                        "h-10 w-10 rounded-full font-bold text-xs flex items-center justify-center transition-all border",
                        isSelected
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-sm scale-105"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-5 mt-4 border-t border-slate-50">
            <button
              type="button"
              onClick={() => setAutoScheduleOpen(false)}
              className="h-10 sm:flex-1 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 order-2 sm:order-1"
            >
              Hủy
            </button>
            <Button
              type="button"
              disabled={autoScheduleLoading || autoSelectedDays.length === 0}
              onClick={handleAutoSchedule}
              className="h-10 sm:flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md flex items-center justify-center gap-1.5 order-1 sm:order-2"
            >
              {autoScheduleLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tìm lịch...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Xếp lịch tự động
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hộp thoại Lặp lại lịch tập tuần */}
      <Dialog open={repeatPatternOpen} onOpenChange={setRepeatPatternOpen}>
        <DialogContent className="max-w-md rounded-2xl border-0 p-6 shadow-lg bg-white">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600 animate-pulse" />
              Lặp lại lịch tuần này
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              Hệ thống sẽ dựa trên các thứ và khung giờ bạn đã chọn trong tuần đầu tiên để tự động tìm lịch trống trong những tuần tiếp theo.
            </DialogDescription>
          </DialogHeader>

          {/* Lịch mẫu được phát hiện */}
          {(() => {
            const weekdayNames = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
            const patternMap = new Map<string, { dayOfWeek: number; time: string }>();
            for (const slot of selectedSlots) {
              const d = new Date(slot.date);
              const dayOfWeek = d.getDay();
              const key = `${dayOfWeek}-${slot.time}`;
              patternMap.set(key, { dayOfWeek, time: slot.time });
            }
            const detectedPattern = Array.from(patternMap.values()).sort((a, b) => {
              const dayA = a.dayOfWeek === 0 ? 7 : a.dayOfWeek;
              const dayB = b.dayOfWeek === 0 ? 7 : b.dayOfWeek;
              if (dayA !== dayB) return dayA - dayB;
              return a.time.localeCompare(b.time);
            });

            if (detectedPattern.length === 0) return null;

            return (
              <div className="mt-3 p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1.5">Lịch lặp lại phát hiện:</p>
                <div className="flex flex-wrap gap-1.5">
                  {detectedPattern.map((p, idx) => (
                    <Badge key={idx} className="bg-white border border-emerald-200 text-emerald-800 hover:bg-white text-xs font-semibold py-0.5 rounded-lg">
                      {weekdayNames[p.dayOfWeek]} lúc {p.time}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })()}

          <div className="mt-4 space-y-4 text-sm">
            {/* Tổng số buổi */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Chọn tổng số buổi tập muốn đặt:</label>
              
              {/* Hiển thị các nút gợi ý từ gói tập của HLV */}
              {trainer?.packages && trainer.packages.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-2">
                  {trainer.packages.map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setRepeatTargetCount(pkg.session_count)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm",
                        repeatTargetCount === pkg.session_count
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {pkg.session_count} buổi
                    </button>
                  ))}
                </div>
              )}

              <input
                type="number"
                min={selectedSlots.length + 1}
                max={50}
                value={repeatTargetCount}
                onChange={(e) => setRepeatTargetCount(Math.max(selectedSlots.length + 1, Number(e.target.value)))}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-slate-800 font-medium"
              />
            </div>

            {/* Ngày bắt đầu lặp lại */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Ngày bắt đầu tự xếp lịch tiếp theo:</label>
              <input
                type="date"
                value={repeatStartDate}
                onChange={(e) => setRepeatStartDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-slate-800 font-medium"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-5 mt-4 border-t border-slate-50">
            <button
              type="button"
              onClick={() => setRepeatPatternOpen(false)}
              className="h-10 sm:flex-1 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 order-2 sm:order-1"
            >
              Hủy
            </button>
            <Button
              type="button"
              disabled={repeatLoading}
              onClick={handleRepeatPattern}
              className="h-10 sm:flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md flex items-center justify-center gap-1.5 order-1 sm:order-2"
            >
              {repeatLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang quét lịch...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Tự động lặp
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
      <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
        {label}
      </p>
      <p className="mt-1 text-base font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-slate-400">{label}:</span>
      <span className="text-slate-700 font-medium">{value}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-10 text-slate-400 italic bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
      {text}
    </div>
  );
}
