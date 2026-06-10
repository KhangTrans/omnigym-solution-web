import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, Smile } from "lucide-react";
import { authApi } from "@/api/auth";
import { toast } from "sonner";

interface FaceRegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function FaceRegisterModal({ open, onOpenChange, onSuccess }: FaceRegisterModalProps) {
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturingFace, setCapturingFace] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
        console.error("Lỗi khởi động camera:", error);
        toast.error("Không thể truy cập camera. Vui lòng cấp quyền truy cập camera trong trình duyệt.");
        onOpenChange(false);
      }
    };

    if (open) {
      startCamera();
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
      setCameraStream(null);
    };
  }, [open, onOpenChange]);

  const handleRegisterFace = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setCapturingFace(true);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      
      if (ctx) {
        // Đảm bảo lấy khung hình vuông chính giữa camera
        const size = Math.min(video.videoWidth, video.videoHeight);
        canvas.width = 480;
        canvas.height = 480;
        
        const sx = (video.videoWidth - size) / 2;
        const sy = (video.videoHeight - size) / 2;
        
        ctx.drawImage(video, sx, sy, size, size, 0, 0, 480, 480);
        
        // Trích xuất ảnh Base64
        const imageBase64 = canvas.toDataURL("image/jpeg", 0.9);
        
        // Gọi API Đăng ký khuôn mặt lên Node.js Backend
        await authApi.registerFaceEmbedding({ image_base64: imageBase64 });
        
        toast.success("Đăng ký nhận diện khuôn mặt thành công!");
        onOpenChange(false);
        onSuccess();
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || "Đăng ký khuôn mặt thất bại. Vui lòng chụp rõ mặt dưới ánh sáng tốt hơn.";
      toast.error(errMsg);
    } finally {
      setCapturingFace(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[20px] p-6 overflow-hidden">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Camera className="h-5 w-5 text-emerald-600" />
            Quét khuôn mặt đăng ký
          </DialogTitle>
          <DialogDescription>
            Hãy giữ khuôn mặt ở chính giữa khung hình camera và đảm bảo đủ ánh sáng.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-4 space-y-4">
          {/* Camera Stream viewport */}
          <div className="relative h-64 w-64 rounded-full overflow-hidden border-4 border-emerald-500 shadow-lg bg-black flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute object-cover w-full h-full scale-x-[-1]"
            />
            {capturingFace && (
              <div className="absolute inset-0 bg-black/45 flex items-center justify-center text-white text-sm font-semibold gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> Trích xuất AI...
              </div>
            )}
          </div>

          {/* Hidden canvas for taking snapshot */}
          <canvas ref={canvasRef} style={{ display: "none" }} />

          <div className="flex w-full gap-2 pt-2">
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
              onClick={handleRegisterFace}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-11 rounded-xl font-bold gap-1.5 shadow-md shadow-emerald-100"
              disabled={capturingFace || !cameraStream}
            >
              {capturingFace ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smile className="h-4 w-4" />}
              Chụp &amp; Đăng ký
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
