import React, { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { 
  Building, 
  RefreshCw, 
  QrCode, 
  Maximize2, 
  Minimize2, 
  MonitorCheck, 
  AlertCircle,
  Clock,
  Sparkles,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { branchesApi, type CreateBranchRequest } from "@/api/branches";
import { attendanceApi } from "@/api/attendance";
import { toast } from "sonner";
import { cn } from "@/utils/cn";

interface ApiBranch {
  id: number;
  branch_name: string;
  address: string;
}

export default function BranchQrDisplay() {
  const [branches, setBranches] = useState<ApiBranch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [qrToken, setQrToken] = useState<string>("");
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingQr, setLoadingQr] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [countdown, setCountdown] = useState(15);
  
  const timerRef = useRef<any>(null);
  const countdownRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoadingBranches(true);
        const res = await branchesApi.getAll();
        const branchList = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
        setBranches(branchList);
        
        // Auto select first branch or read from localStorage
        const savedBranch = localStorage.getItem("selected_qr_branch_id");
        if (savedBranch && branchList.some((b: ApiBranch) => String(b.id) === savedBranch)) {
          setSelectedBranchId(savedBranch);
        } else if (branchList.length > 0) {
          setSelectedBranchId(String(branchList[0].id));
        }
      } catch (err: any) {
        console.error("Fetch branches error:", err);
        toast.error("Không thể tải danh sách chi nhánh");
      } finally {
        setLoadingBranches(false);
      }
    };
    fetchBranches();
  }, []);

  // Fetch QR Token
  const fetchQrToken = async (branchId: string) => {
    if (!branchId) return;
    try {
      setLoadingQr(true);
      const res = await attendanceApi.getBranchQr(branchId);
      const dataObj = res.data?.data || res.data;
      const token = dataObj?.dynamic_qr_token;
      if (token) {
        setQrToken(token);
        setCountdown(15); // Reset countdown to 15
      } else {
        console.error("No dynamic_qr_token found in response:", res.data);
        toast.error("Không tìm thấy mã QR trong phản hồi của máy chủ");
      }
    } catch (err: any) {
      console.error("Fetch QR token error:", err);
      toast.error(err.response?.data?.message || "Không thể khởi tạo mã QR động");
    } finally {
      setLoadingQr(false);
    }
  };

  // Setup refresh interval when branch changes
  useEffect(() => {
    if (!selectedBranchId) return;
    
    localStorage.setItem("selected_qr_branch_id", selectedBranchId);
    
    // Fetch immediately
    fetchQrToken(selectedBranchId);

    // Setup 15 seconds loop for fetching new token
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      fetchQrToken(selectedBranchId);
    }, 15000);

    // Setup 1s countdown clock tick
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) return 15;
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [selectedBranchId]);

  // Fullscreen support
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        toast.error(`Không thể chuyển sang chế độ toàn màn hình: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const getSelectedBranchName = () => {
    const br = branches.find(b => String(b.id) === selectedBranchId);
    return br ? br.branch_name : "Chọn chi nhánh";
  };

  const getSelectedBranchAddress = () => {
    const br = branches.find(b => String(b.id) === selectedBranchId);
    return br ? br.address : "";
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "flex flex-col items-center justify-center min-h-[70vh] p-4 transition-colors duration-500",
        isFullscreen ? "bg-slate-950 text-white min-h-screen py-12" : "bg-transparent text-foreground"
      )}
    >
      <div className="w-full max-w-2xl flex flex-col gap-6 animate-in fade-in-0 duration-500">
        
        {/* Branch Selection Toolbar (hide/style differently in fullscreen Kiosk mode) */}
        <div className={cn(
          "flex items-center justify-between gap-4 p-4 bg-card rounded-2xl border shadow-md",
          isFullscreen && "bg-slate-900 border-slate-800 max-w-md mx-auto w-full"
        )}>
          <div className="flex items-center gap-2 flex-1">
            <Building className="h-5 w-5 text-emerald-600 shrink-0" />
            <Select 
              value={selectedBranchId} 
              onValueChange={setSelectedBranchId}
              disabled={loadingBranches}
            >
              <SelectTrigger className={cn("border-border bg-background h-10 w-full", isFullscreen && "bg-slate-950 border-slate-700 text-white")}>
                <SelectValue placeholder="Chọn chi nhánh hiển thị QR" />
              </SelectTrigger>
              <SelectContent className={isFullscreen ? "bg-slate-900 border-slate-700 text-white" : ""}>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.branch_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => fetchQrToken(selectedBranchId)}
              disabled={!selectedBranchId || loadingQr}
              className={cn("h-10 w-10", isFullscreen && "border-slate-700 hover:bg-slate-800 text-white")}
              title="Cập nhật ngay lập tức"
            >
              <RefreshCw className={cn("h-4.5 w-4.5", loadingQr && "animate-spin")} />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={toggleFullscreen}
              className={cn("h-10 w-10", isFullscreen && "border-slate-700 hover:bg-slate-800 text-white")}
              title={isFullscreen ? "Thoát Kiosk" : "Kiosk Toàn màn hình"}
            >
              {isFullscreen ? <Minimize2 className="h-4.5 w-4.5" /> : <Maximize2 className="h-4.5 w-4.5" />}
            </Button>
          </div>
        </div>

        {/* QR Display Card */}
        {selectedBranchId ? (
          <Card className={cn(
            "border border-border/60 shadow-xl rounded-[28px] overflow-hidden transition-all duration-500 relative",
            isFullscreen ? "bg-slate-900/40 border-slate-800/80 shadow-emerald-950/20" : "bg-card/50 backdrop-blur-sm"
          )}>
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
            
            <CardHeader className="text-center pt-8 pb-4 relative z-10 border-b border-border/10">
              <div className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-500 mb-2">
                <Sparkles className="h-3.5 w-3.5" /> Kiosk Điểm Danh
              </div>
              <CardTitle className={cn("text-2xl font-black tracking-tight", isFullscreen && "text-white")}>
                {getSelectedBranchName()}
              </CardTitle>
              <CardDescription className={cn("text-xs mt-1", isFullscreen ? "text-slate-400" : "text-slate-500")}>
                {getSelectedBranchAddress() || "Vui lòng quét mã bên dưới để Check-in vào ca trực"}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="flex flex-col items-center p-8 gap-6 relative z-10">
              
              {/* QR Container Frame */}
              <div className="relative p-6 bg-white rounded-[24px] shadow-2xl border-4 border-slate-100 flex items-center justify-center group overflow-hidden transition-transform duration-300 hover:scale-102">
                
                {/* Visual Scanner line effect */}
                <div className="absolute left-6 right-6 h-0.5 bg-emerald-500 top-6 animate-[bounce_4s_infinite] shadow-[0_0_8px_rgba(16,185,129,0.7)] opacity-70" />
                
                {loadingQr && !qrToken ? (
                  <div className="h-[250px] w-[250px] flex items-center justify-center bg-slate-50 rounded-xl">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                  </div>
                ) : qrToken ? (
                  <QRCodeSVG 
                    value={qrToken}
                    size={250}
                    level="H"
                    includeMargin={false}
                  />
                ) : (
                  <div className="h-[250px] w-[250px] flex flex-col items-center justify-center bg-rose-50 text-rose-500 rounded-xl p-4 text-center">
                    <AlertCircle className="h-8 w-8 mb-2" />
                    <span className="text-xs font-semibold">Chưa có mã QR. Nhấp Cập nhật.</span>
                  </div>
                )}
              </div>

              {/* Progress counter */}
              <div className="w-full max-w-sm space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-emerald-500" /> 
                    Tự động cập nhật mã mới
                  </span>
                  <span className={cn("tabular-nums", isFullscreen ? "text-emerald-400" : "text-emerald-700")}>
                    {countdown} giây
                  </span>
                </div>
                
                {/* Simulated progress loading bar */}
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${(countdown / 15) * 100}%` }}
                  />
                </div>
              </div>

              {/* Footer instruction text */}
              <div className="flex items-center gap-2 mt-2 px-6 py-2.5 rounded-full bg-muted/60 text-xs text-muted-foreground font-semibold">
                <MonitorCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Mã QR thay đổi liên tục để đảm bảo an toàn</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="p-8 text-center text-slate-500 bg-muted/20 border border-dashed rounded-[20px]">
            <QrCode className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <p className="font-semibold">Vui lòng cấu hình chi nhánh để hiển thị mã QR</p>
            <p className="text-xs text-muted-foreground mt-1">Sử dụng thanh chọn chi nhánh phía trên.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
