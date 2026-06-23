import { useSyncExternalStore } from "react";

export type NotificationKind = "review" | "shift" | "staff" | "trainer" | "revenue" | "system";

export type WorkspaceNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** Đường dẫn nội bộ để điều hướng khi click. */
  href: string;
  /** ISO timestamp. */
  createdAt: string;
  read: boolean;
};

const INITIAL: WorkspaceNotification[] = [
  {
    id: "n-1",
    kind: "review",
    title: "Đánh giá 5★ mới",
    body: "Nguyễn Thị Lan đã để lại một đánh giá tuyệt vời cho chi nhánh của bạn.",
    href: "/branchmanager/reviews",
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(), // 15m ago
    read: false,
  },
  {
    id: "n-2",
    kind: "review",
    title: "Phản hồi tiêu cực cần xử lý",
    body: "Lê Minh Hương gửi góp ý về lớp đạp xe Cycling. Vui lòng phản hồi trong 24h.",
    href: "/branchmanager/reviews",
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(), // 4h ago
    read: false,
  },
  {
    id: "n-3",
    kind: "shift",
    title: "Yêu cầu điểm danh ca trực",
    body: "Ca trực sáng nay của bạn cần được xác nhận điểm danh.",
    href: "/branchmanager/attendance",
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(), // 12h ago
    read: false,
  },
  {
    id: "n-4",
    kind: "trainer",
    title: "Đơn ứng tuyển Trainer mới",
    body: "Huấn luyện viên Trần Dũng đã nộp hồ sơ ứng tuyển PT tại chi nhánh.",
    href: "/branchmanager/trainer-applications",
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(), // 1d ago
    read: true,
  },
  {
    id: "n-5",
    kind: "revenue",
    title: "Doanh thu tuần này tăng trưởng",
    body: "Doanh thu tuần này của chi nhánh đã tăng 8.5% so với tuần trước.",
    href: "/branchmanager/revenue",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), // 2d ago
    read: true,
  },
];

let state: WorkspaceNotification[] = INITIAL;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return state;
}

export function useWorkspaceNotifications() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const unreadCount = items.filter((n) => !n.read).length;

  return {
    items,
    unreadCount,
    markRead(id: string) {
      state = state.map((n) => (n.id === id ? { ...n, read: true } : n));
      emit();
    },
    markAllRead() {
      state = state.map((n) => ({ ...n, read: true }));
      emit();
    },
    remove(id: string) {
      state = state.filter((n) => n.id !== id);
      emit();
    },
  };
}
