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
import { type ApiUser } from "@/api/users";

interface UserConfirmDialogProps {
  user: ApiUser | null;
  onClose: () => void;
  onConfirm: (user: ApiUser) => void;
}

export function UserConfirmDialog({
  user,
  onClose,
  onConfirm,
}: UserConfirmDialogProps) {
  const isTargetActive = user?.status?.toLowerCase() === "active";
  const confirmMessage = isTargetActive
    ? "Bạn có chắc muốn khóa tài khoản này không?"
    : "Bạn có chắc muốn mở khóa tài khoản này không?";

  return (
    <AlertDialog
      open={Boolean(user)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận thao tác</AlertDialogTitle>
          <AlertDialogDescription>{confirmMessage}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (user) {
                onConfirm(user);
              }
            }}
          >
            Xác nhận
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
