import { AlertTriangle, Loader2 } from "lucide-react";
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

interface BookingItem {
  id: number;
  user_id: number;
  trainer_id: number;
  date: string;
  time: string;
  status: "confirmed" | "cancelled" | "pending_payment";
  created_at: string;
  updated_at: string;
  trainer?: {
    id: number;
    user_id: number;
    specialization?: string;
    avatar_url?: string;
    user?: {
      id: number;
      full_name: string;
      email: string;
    };
  };
}

interface CancelBookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingItem | null;
  onConfirm: () => Promise<void>;
  loading: boolean;
  formatDateDisplay: (dateStr: string) => string;
}

export function CancelBookingDialog({
  isOpen,
  onClose,
  booking,
  onConfirm,
  loading,
  formatDateDisplay,
}: CancelBookingDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-md rounded-2xl border-0 p-6 shadow-lg bg-white">
        <AlertDialogHeader className="space-y-3">
          <AlertDialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
            Xác nhận hủy lịch tập?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-500 text-sm leading-relaxed">
            Bạn có chắc chắn muốn hủy lịch tập vào ngày{" "}
            <strong className="text-slate-700 font-bold">
              {booking ? formatDateDisplay(booking.date) : ""}
            </strong>{" "}
            lúc{" "}
            <strong className="text-slate-700 font-bold">
              {booking ? booking.time : ""}
            </strong>{" "}
            với HLV{" "}
            <strong className="text-slate-700 font-bold">
              {booking?.trainer?.user?.full_name}
            </strong>
            ?
            <span className="block mt-3 p-3 bg-rose-50 rounded-xl border border-rose-100 text-rose-700 text-xs font-medium">
              Buổi tập của bạn sẽ được hoàn trả lại vào gói tập PT hiện hoạt. Bạn sẽ không bị mất buổi tập này.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 pt-5 border-t border-slate-50 mt-4">
          <AlertDialogCancel className="h-10 sm:flex-1 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold order-2 sm:order-1">
            Đóng
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={loading}
            className="h-10 sm:flex-1 rounded-xl bg-rose-600 text-white hover:bg-rose-700 font-semibold flex items-center justify-center gap-1.5 order-1 sm:order-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang hủy...
              </>
            ) : (
              "Hủy ca tập"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
