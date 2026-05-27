import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "vi";

type Dict = Record<string, string>;

const en: Dict = {
  "nav.home": "Home",
  "nav.pricing": "Pricing",
  "nav.contact": "Contact",
  "nav.gyms": "Gyms",
  "nav.signin": "Sign in",
  "nav.join": "Join Now",
  "trainer.bookSession": "Book a session",
  "trainer.viewGyms": "View gyms",
  "trainer.buyMembership": "Buy PT Membership",
  "trainer.bookPT": "Book PT",
  "trainer.experience": "Experience",
  "trainer.hourlyRate": "Hourly rate",
  "trainer.rating": "Rating",
  "trainer.certs": "Certifications",
  "trainer.reviews": "Client reviews",
  "trainer.trainsAt": "Trains at",
  "membership.title": "PT Membership",
  "membership.subtitle": "20 sessions per month with your coach",
  "membership.choose": "Choose a plan",
  "membership.confirm": "Confirm membership",
  "membership.success": "Membership activated!",
  "membership.popular": "Most popular",
  "membership.month": "month",
  "membership.months": "months",
  "membership.sessions": "sessions",
  "membership.perks.priority": "Priority booking",
  "membership.perks.assessment": "Free fitness assessment",
  "membership.perks.plan": "Custom training plan",
  "membership.perks.nutrition": "Nutrition guide",
  "membership.perks.checkin": "Monthly progress check-ins",
  "book.title": "Book a PT session",
  "book.subtitle": "Pre-selected times based on your coach's availability",
  "book.pickDate": "Pick a date",
  "book.pickSlot": "Pick a time",
  "book.confirm": "Confirm booking",
  "book.success": "Session booked!",
  "book.remaining": "Sessions remaining",
  "book.noMembership": "You need an active PT membership first.",
  "book.getMembership": "Get membership",
  "book.suggested": "Suggested for you",
  "book.week": "Week",
  "book.prevWeek": "Previous week",
  "book.nextWeek": "Next week",
  "book.duration": "Each session is 1h 30m",
  "book.selected": "Selected sessions",
  "book.empty": "No sessions selected yet — tap any time slot to add one.",
  "book.bookAll": "Book selected",
  "book.clear": "Clear",
  "book.booked": "Booked",
  "book.bookedCount": "{n} session(s) booked!",
};

const vi: Dict = {
  "nav.home": "Trang chủ",
  "nav.pricing": "Bảng giá",
  "nav.contact": "Liên hệ",
  "nav.gyms": "Phòng tập",
  "nav.signin": "Đăng nhập",
  "nav.join": "Đăng ký",
  "trainer.bookSession": "Đặt lịch tập",
  "trainer.viewGyms": "Xem phòng tập",
  "trainer.buyMembership": "Mua gói PT",
  "trainer.bookPT": "Đặt lịch PT",
  "trainer.experience": "Kinh nghiệm",
  "trainer.hourlyRate": "Giá theo giờ",
  "trainer.rating": "Đánh giá",
  "trainer.certs": "Chứng chỉ",
  "trainer.reviews": "Đánh giá học viên",
  "trainer.trainsAt": "Tập tại",
  "membership.title": "Gói tập với PT",
  "membership.subtitle": "20 buổi mỗi tháng cùng huấn luyện viên",
  "membership.choose": "Chọn gói",
  "membership.confirm": "Xác nhận đăng ký",
  "membership.success": "Đã kích hoạt gói tập!",
  "membership.popular": "Phổ biến nhất",
  "membership.month": "tháng",
  "membership.months": "tháng",
  "membership.sessions": "buổi",
  "membership.perks.priority": "Ưu tiên đặt lịch",
  "membership.perks.assessment": "Đánh giá thể lực miễn phí",
  "membership.perks.plan": "Giáo án cá nhân hoá",
  "membership.perks.nutrition": "Cẩm nang dinh dưỡng",
  "membership.perks.checkin": "Kiểm tra tiến độ hàng tháng",
  "book.title": "Đặt lịch buổi PT",
  "book.subtitle": "Khung giờ gợi ý dựa trên lịch của HLV",
  "book.pickDate": "Chọn ngày",
  "book.pickSlot": "Chọn giờ",
  "book.confirm": "Xác nhận đặt lịch",
  "book.success": "Đã đặt lịch thành công!",
  "book.remaining": "Buổi còn lại",
  "book.noMembership": "Bạn cần đăng ký gói PT trước.",
  "book.getMembership": "Đăng ký gói",
  "book.suggested": "Gợi ý cho bạn",
  "book.week": "Tuần",
  "book.prevWeek": "Tuần trước",
  "book.nextWeek": "Tuần sau",
  "book.duration": "Mỗi buổi kéo dài 1 giờ 30 phút",
  "book.selected": "Buổi đã chọn",
  "book.empty": "Chưa chọn buổi nào — hãy bấm vào khung giờ để thêm.",
  "book.bookAll": "Đặt các buổi đã chọn",
  "book.clear": "Xoá",
  "book.booked": "Đã đặt",
  "book.bookedCount": "Đã đặt {n} buổi!",
};

const dicts: Record<Lang, Dict> = { en, vi };

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: string) => string };
const LangContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lang") as Lang | null;
      if (saved === "en" || saved === "vi") setLangState(saved);
    } catch {}
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("lang", l);
    } catch {}
  };

  const t = (k: string) => dicts[lang][k] ?? dicts.en[k] ?? k;

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) return { lang: "en" as Lang, setLang: () => {}, t: (k: string) => dicts.en[k] ?? k };
  return ctx;
}