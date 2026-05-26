import { useState } from 'react';
import { 
  RefreshCcw, 
  Search, 
  Filter, 
  AlertCircle,
  Undo2,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../utils/cn';

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden", className)}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'default' | 'success' | 'warning' | 'error' | 'outline' }) => {
  const styles = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    error: "bg-rose-100 text-rose-700",
    outline: "border border-slate-200 text-slate-600"
  };
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap inline-flex items-center gap-1", styles[variant])}>
      {children}
    </span>
  );
};

const Refunds = () => {
  const [query, setQuery] = useState("");

  const refunds = [
    { id: "RF-8812", customer: "Trần Thế Vinh", amount: 500000, reason: "Phòng tập đóng cửa đột xuất", date: "2024-03-25", status: "Chờ xem xét" },
    { id: "RF-8813", customer: "Nguyễn Lê Bảo", amount: 1200000, reason: "Mua nhầm gói tập", date: "2024-03-24", status: "Đã hoàn phí" },
    { id: "RF-8814", customer: "Lâm Mỹ Tâm", amount: 350000, reason: "Lỗi thanh toán trùng lặp", date: "2024-03-24", status: "Chờ xem xét" },
    { id: "RF-8815", customer: "Vũ Hải Đăng", amount: 2000000, reason: "Dịch vụ không như mong đợi", date: "2024-03-23", status: "Từ chối" },
    { id: "RF-8816", customer: "Đỗ Gia Hân", amount: 800000, reason: "Sức khỏe không cho phép", date: "2024-03-22", status: "Đã hoàn phí" },
  ];

  const fmt = (n: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Yêu cầu hoàn tiền</h1>
          <p className="text-sm text-slate-500">Quản lý và phê duyệt các yêu cầu hoàn phí từ khách hàng.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-100 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> 2 yêu cầu cần xử lý gấp
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="md:col-span-1 p-5 flex flex-col items-center justify-center text-center bg-emerald-50/50 border-emerald-100 italic">
          <Undo2 className="h-10 w-10 text-emerald-500 mb-3" />
          <h3 className="font-bold text-slate-900 text-sm">Chính sách hoàn tiền</h3>
          <p className="text-[11px] text-slate-500 mt-2">Đảm bảo tuân thủ các điều khoản dịch vụ của OmniGym trước khi phê duyệt.</p>
          <button className="mt-4 text-[10px] font-bold text-emerald-600 hover:underline">Xem quy định</button>
        </Card>

        <div className="md:col-span-3 grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Card className="p-5">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Đang chờ</div>
            <div className="text-2xl font-bold text-slate-900">12</div>
            <div className="text-[11px] text-amber-600 font-bold mt-1">+3 từ hôm qua</div>
          </Card>
          <Card className="p-5">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Đã hoàn (Tuần)</div>
            <div className="text-2xl font-bold text-slate-900">{fmt(5400000)}</div>
            <div className="text-[11px] text-emerald-600 font-bold mt-1">24 giao dịch</div>
          </Card>
          <Card className="p-5">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Tỷ lệ hoàn tiền</div>
            <div className="text-2xl font-bold text-slate-900">1.2%</div>
            <div className="text-[11px] text-slate-500 mt-1">Trong ngưỡng cho phép</div>
          </Card>
        </div>
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm theo mã RF, tên khách hàng..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-white rounded-lg border border-slate-200 pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
            />
          </div>
          <button className="flex items-center justify-center p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
            <Filter className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/30">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Mã yêu cầu</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Khách hàng</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Lý do hoàn tiền</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Số tiền</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {refunds.map((rf) => (
                <tr key={rf.id} className="hover:bg-slate-50/80 transition-colors group text-sm">
                  <td className="px-6 py-4 font-bold text-slate-900">{rf.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <div className="h-7 w-7 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <User className="h-3.5 w-3.5" />
                       </div>
                       <span className="font-medium text-slate-700">{rf.customer}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 italic max-w-xs truncate">
                    "{rf.reason}"
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-rose-600">-{fmt(rf.amount)}</td>
                  <td className="px-6 py-4">
                    <Badge variant={
                      rf.status === 'Đã hoàn phí' ? 'success' : 
                      rf.status === 'Chờ xem xét' ? 'warning' : 'error'
                    }>
                      {rf.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md hover:bg-emerald-100 transition-colors" title="Phê duyệt">
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 bg-rose-50 text-rose-600 rounded-md hover:bg-rose-100 transition-colors" title="Từ chối">
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Refunds;