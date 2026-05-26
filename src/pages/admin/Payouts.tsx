import { useState } from 'react';
import { 
  Banknote, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  Clock, 
  XCircle,
  ExternalLink,
  Building2,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight
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

const Payouts = () => {
  const [query, setQuery] = useState("");

  const payouts = [
    { id: "PO-9921", partner: "OmniGym Central", amount: 45000000, date: "2024-03-25", status: "Đã thanh toán", method: "Vietcombank" },
    { id: "PO-9922", partner: "Elite Fitness Lab", amount: 12800000, date: "2024-03-24", status: "Chờ xử lý", method: "Techcombank" },
    { id: "PO-9923", partner: "Yoga Harmony Studio", amount: 8500000, date: "2024-03-24", status: "Đã thanh toán", method: "TPBank" },
    { id: "PO-9924", partner: "Crossfit Đống Đa", amount: 15200000, date: "2024-03-23", status: "Từ chối", method: "VPBank" },
    { id: "PO-9925", partner: "The Power House", amount: 22000000, date: "2024-03-22", status: "Đã thanh toán", method: "Agribank" },
  ];

  const fmt = (n: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Thanh toán đối tác</h1>
          <p className="text-sm text-slate-500">Đối soát và giải ngân doanh thu cho các chủ phòng tập đối tác.</p>
        </div>
        <div className="flex items-center gap-2">
           <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-lg transition-all shadow-sm">
            <Download className="h-4 w-4" /> Xuất báo cáo
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-all shadow-md active:scale-95">
            <Banknote className="h-4 w-4" /> Tạo lệnh thanh toán mới
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-emerald-600 border-emerald-500 text-white">
          <div className="p-5">
            <div className="flex items-center justify-between opacity-80 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-widest">Tổng giải ngân tháng</span>
              <Banknote className="h-4 w-4" />
            </div>
            <div className="text-2xl font-bold">{fmt(103500000)}</div>
            <div className="mt-2 text-[11px] font-medium flex items-center gap-1 opacity-90">
              <ArrowUpRight className="h-3 w-3" /> +8% so với tháng trước
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-widest">Chờ xử lý</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{fmt(12800000)}</div>
            <div className="mt-2 text-[11px] font-bold text-amber-600">3 yêu cầu mới</div>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-widest">Đã từ chối (Tháng)</span>
              <XCircle className="h-4 w-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{fmt(15200000)}</div>
            <div className="mt-2 text-[11px] font-bold text-slate-400 uppercase">1 trường hợp vi phạm</div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm theo mã lệnh, tên đối tác..." 
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
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Mã lệnh / Ngày</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Đối tác</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Ngân hàng</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Số tiền</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payouts.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50/80 transition-colors group text-sm">
                  <td className="px-6 py-4 font-bold text-emerald-600">
                    <div>{po.id}</div>
                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">{po.date}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      {po.partner}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{po.method}</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900">{fmt(po.amount)}</td>
                  <td className="px-6 py-4">
                    <Badge variant={
                      po.status === 'Đã thanh toán' ? 'success' : 
                      po.status === 'Chờ xử lý' ? 'warning' : 'error'
                    }>
                      {po.status === 'Đã thanh toán' ? <CheckCircle2 className="h-3 w-3" /> : po.status === 'Chờ xử lý' ? <Clock className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {po.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-400 hover:text-emerald-600">
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
          <div className="text-xs text-slate-500">Hiển thị 5 trên 48 bản ghi</div>
          <div className="flex items-center gap-2">
            <button className="p-2 border border-slate-200 rounded-lg hover:bg-white bg-white/50 shadow-sm transition-all" disabled><ChevronLeft className="h-4 w-4 text-slate-400" /></button>
            <button className="p-2 border border-slate-200 rounded-lg hover:bg-white bg-white/50 shadow-sm transition-all"><ChevronRight className="h-4 w-4 text-slate-600" /></button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Payouts;