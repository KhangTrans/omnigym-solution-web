import React, { useState, useEffect, useRef } from "react";
import { Loader2, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { attendanceApi } from "@/api/attendance";
import type { WorkShift } from "@/api/workShifts";
import { toast } from "sonner";
import { cn } from "@/utils/cn";
import { formatTime } from "./AttendanceLogs";

interface CheckInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeShift: WorkShift | null;
  onSuccess: () => void;
}

export function CheckInModal({ open, onOpenChange, activeShift, onSuccess }: CheckInModalProps) {
  const [pinCode, setPinCode] = useState("");
  const [submittingCheckIn, setSubmittingCheckIn] = useState(false);
  const [checkInMethod, setCheckInMethod] = useState<'pin' | 'face'>('pin');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturingFace, setCapturingFace] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Reset states on modal open
  useEffect(() => {
    if (open) {
      setPinCode("");
      setCheckInMethod("pin");
    }
  }, [open]);

  // Handle camera access and lifecycle
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 480, height: 480, facingMode: "user" }
        });
        activeStream = stream;
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Camera access error:", error);
        toast.error("Không thể mở camera. Vui lòng cấp quyền truy cập camera trong trình duyệt.");
        setCheckInMethod('pin');
      }
    };

    if (open && checkInMethod === 'face') {
      startCamera();
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
      setCameraStream(null);
    };
  }, [open, checkInMethod]);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;
    if (pinCode.length !== 6) {
      toast.error("Mã PIN phải bao gồm 6 ký tự");
      return;
    }

    try {
      setSubmittingCheckIn(true);
      await attendanceApi.checkIn({
        shift_id: activeShift.id,
        check_in_code: pinCode.toUpperCase().trim()
      });
      toast.success("Check-in bằng mã PIN thành công!");
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Mã PIN không chính xác hoặc ca làm việc đã được check-in");
    } finally {
      setSubmittingCheckIn(false);
    }
  };

  const handleFaceCheckIn = async () => {
    if (!activeShift || !videoRef.current || !canvasRef.current) return;

    setCapturingFace(true);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        const size = Math.min(video.videoWidth, video.videoHeight);
        canvas.width = 480;
        canvas.height = 480;

        const sx = (video.videoWidth - size) / 2;
        const sy = (video.videoHeight - size) / 2;

        ctx.drawImage(video, sx, sy, size, size, 0, 0, 480, 480);
        const imageBase64 = canvas.toDataURL("image/jpeg", 0.9);

        await attendanceApi.checkInFace({
          shift_id: activeShift.id,
          image_base64: imageBase64,
          check_in_code: pinCode.trim() || undefined
        });

        toast.success("Điểm danh bằng khuôn mặt thành công!");
        onOpenChange(false);
        onSuccess();
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || "Nhận diện khuôn mặt không khớp hoặc chưa đăng ký.";
      toast.error(errMsg);
    } finally {
      setCapturingFace(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[20px] p-6 overflow-hidden">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-xl font-bold">Xác thực điểm danh</DialogTitle>
          <DialogDescription>
            {activeShift && (
              <span>Ca trực: {formatTime(activeShift.start_time)} - {formatTime(activeShift.end_time)} hôm nay</span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Chọn phương thức điểm danh */}
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 mt-3 mb-2">
          <Button
            type="button"
            variant={checkInMethod === 'pin' ? 'default' : 'ghost'}
            onClick={() => setCheckInMethod('pin')}
            className={cn(
              "flex-1 h-9 rounded-lg text-xs font-bold transition-all",
              checkInMethod === 'pin' 
                ? "bg-white text-slate-800 shadow-sm border" 
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            )}
            disabled={submittingCheckIn || capturingFace}
          >
            Nhập mã PIN
          </Button>
          <Button
            type="button"
            variant={checkInMethod === 'face' ? 'default' : 'ghost'}
            onClick={() => setCheckInMethod('face')}
            className={cn(
              "flex-1 h-9 rounded-lg text-xs font-bold transition-all",
              checkInMethod === 'face' 
                ? "bg-white text-slate-800 shadow-sm border" 
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            )}
            disabled={submittingCheckIn || capturingFace}
          >
            Nhận diện khuôn mặt
          </Button>
        </div>

        {/* PIN Input Form State */}
        {checkInMethod === 'pin' && (
          <form onSubmit={handlePinSubmit} className="space-y-5 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-0.5">Nhập mã PIN xác nhận (6 chữ cái)</label>
              <Input
                maxLength={6}
                placeholder="MÃ PIN"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.toUpperCase())}
                className="h-12 text-center text-lg font-bold tracking-widest uppercase focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
                autoFocus
                required
              />
              <p className="text-xs text-muted-foreground">Mã PIN này được cấp bởi Quản lý phòng tập tại quầy trực tiếp.</p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 h-11 rounded-xl"
                disabled={submittingCheckIn}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground h-11 rounded-xl font-bold"
                disabled={submittingCheckIn || pinCode.length !== 6}
              >
                {submittingCheckIn ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Xác nhận
              </Button>
            </div>
          </form>
        )}

        {/* Face Check-In Form State */}
        {checkInMethod === 'face' && (
          <div className="flex flex-col items-center justify-center py-4 space-y-4">
            <div className="relative h-56 w-56 rounded-full overflow-hidden border-4 border-emerald-500 shadow-md bg-black flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute object-cover w-full h-full scale-x-[-1]"
              />
              {capturingFace && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                  <Loader2 className="h-4 w-4 animate-spin" /> Đang nhận dạng...
                </div>
              )}
            </div>

            <canvas ref={canvasRef} style={{ display: "none" }} />

            <div className="flex w-full gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 h-11 rounded-xl"
                disabled={capturingFace}
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handleFaceCheckIn}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-11 rounded-xl font-bold gap-1.5"
                disabled={capturingFace || !cameraStream}
              >
                {capturingFace ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smile className="h-4 w-4" />}
                Quét &amp; Điểm danh
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
