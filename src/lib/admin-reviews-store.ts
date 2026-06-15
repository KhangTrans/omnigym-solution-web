import { useCallback, useEffect, useState } from "react";

const EVT = "admin_reviews_changed";
const KEY = "admin_reviews_v1";

export type ReviewSentiment = "positive" | "negative";

export type CustomerReview = {
  id: string;
  customer: string;
  email: string;
  avatar?: string;
  branchId: string;
  branchName: string;
  rating: number; // 1-5
  sentiment: ReviewSentiment;
  title: string;
  body: string;
  createdAt: string;
  status: "published" | "hidden";
  reply?: {
    body: string;
    author: string;
    repliedAt: string;
  };
};

const seed: CustomerReview[] = [
  {
    id: "rv-1",
    customer: "Nguyễn Thị Lan",
    email: "lan.nguyen@gmail.com",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&q=80",
    branchId: "1",
    branchName: "OmniGym Premium Quận 1",
    rating: 5,
    sentiment: "positive",
    title: "Khu vực tạ free weight tốt nhất thành phố",
    body: "Rất nhiều khung gánh tạ, máy móc mới, nhân viên thân thiện và phòng xông hơi rất tuyệt vời sau khi tập luyện.",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    status: "published",
  },
  {
    id: "rv-2",
    customer: "Trần Minh Tiến",
    email: "tien.tran@gmail.com",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&q=80",
    branchId: "2",
    branchName: "OmniGym Premium Quận 7",
    rating: 4,
    sentiment: "positive",
    title: "Phòng tập Yoga cực kỳ thư giãn",
    body: "Sàn gỗ sạch sẽ, không gian yên tĩnh và dễ chịu. Tuy nhiên cần bổ sung thêm các lớp học vào khung giờ sáng sớm.",
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    status: "published",
  },
  {
    id: "rv-3",
    customer: "Lê Minh Hương",
    email: "huong.le@gmail.com",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&q=80",
    branchId: "3",
    branchName: "OmniGym Elite Ba Đình",
    rating: 2,
    sentiment: "negative",
    title: "Lớp đạp xe Cycling bị quá tải",
    body: "Tôi đã đặt chỗ trước trên app nhưng khi đến nơi xe vẫn bị giao cho người khác. Nhân viên lễ tân giải quyết chưa nhiệt tình.",
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    status: "published",
  },
  {
    id: "rv-4",
    customer: "Phạm Hoàng Long",
    email: "long.pham@gmail.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80",
    branchId: "1",
    branchName: "OmniGym Premium Quận 1",
    rating: 1,
    sentiment: "negative",
    title: "Tủ khóa phòng thay đồ xuống cấp",
    body: "Có nhiều khóa tủ bị hỏng trong phòng thay đồ nam. Tôi đã báo cáo với quản lý phòng tập hai lần nhưng chưa thấy sửa chữa.",
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    status: "hidden",
  },
  {
    id: "rv-5",
    customer: "Đặng Minh Anh",
    email: "minhanh.dang@gmail.com",
    avatar: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=120&q=80",
    branchId: "4",
    branchName: "OmniGym Premium Hoàn Kiếm",
    rating: 5,
    sentiment: "positive",
    title: "Cộng đồng tập luyện rất thân thiện",
    body: "Các huấn luyện viên hướng dẫn nhiệt tình và ghi nhớ tên từng hội viên. Địa điểm cực kỳ tốt cho người mới bắt đầu.",
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    status: "published",
  },
  {
    id: "rv-6",
    customer: "Hoàng Mỹ Linh",
    email: "linh.hoang@gmail.com",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&q=80",
    branchId: "2",
    branchName: "OmniGym Premium Quận 7",
    rating: 3,
    sentiment: "negative",
    title: "Điều hòa không khí hoạt động yếu vào giờ cao điểm",
    body: "Thiết bị tập luyện đầy đủ và hiện đại nhưng phòng tập bị nóng bí trong khoảng từ 18h - 20h tối.",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    status: "published",
  },
];

function read(): CustomerReview[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      localStorage.setItem(KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as CustomerReview[];
  } catch {
    return seed;
  }
}

function write(items: CustomerReview[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVT));
}

export function useCustomerReviews() {
  const [items, setItems] = useState<CustomerReview[]>(seed);
  useEffect(() => {
    setItems(read());
    const sync = () => setItems(read());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const update = useCallback((next: CustomerReview[]) => {
    write(next);
    setItems(next);
  }, []);

  return {
    reviews: items,
    setSentiment: (id: string, sentiment: ReviewSentiment) =>
      update(items.map((r) => (r.id === id ? { ...r, sentiment } : r))),
    setStatus: (id: string, status: CustomerReview["status"]) =>
      update(items.map((r) => (r.id === id ? { ...r, status } : r))),
    setReply: (id: string, reply: CustomerReview["reply"]) =>
      update(items.map((r) => (r.id === id ? { ...r, reply } : r))),
    remove: (id: string) => update(items.filter((r) => r.id !== id)),
    reset: () => update(seed),
  };
}
