import { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Receipt, 
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  Hash
} from 'lucide-react';
import { cn } from '../../utils/cn';

// Simple reusable components
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
    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap", styles[variant])}>
      {children}
    </span>
  );
};

const Transactions = () => {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const transactions = [
    { id: "TX129847", customer: "Nguyễn Văn A", source: "Gói Gym Premium", amount: 500000, date: "2024-03-25T14:30:00", status: "Thành công", method: "Thẻ Visa" },
    { id: "TX129848", customer: "Trần Thị B", source: "Yoga Pack 12 buổi", amount: 1200000, date: "2024-03-25T12:20:00", status: "Chờ thanh toán", method: "Chuyển khoản" },
    { id: "TX129849", customer: "Lê Văn C", source: "Thuê PT - 10h", amount: 3500000, date: "2024-03-24T09:15:00", status: "Thành công", method: "Momo" },
    { id: "TX129850", customer: "Phạm Minh D", source: "Gói Gym Basic", amount: 250000, date: "2024-03-24T18:45:00", status: "Thất bại", method: "Thẻ Napas" },
    { id: "TX129851", customer: "Hoàng Anh E", source: "Gói Crossfit", amount: 800000, date: "2024-03-23T11:00:00", status: "Thành công", method: "VNPay" },
    { id: "TX129852", customer: "Ngô Văn F", source: "Thực phẩm bổ sung", amount: 450000, date: "2024-03-23T15:30:00", status: "Thành công", method: "Tiền mặt" },
    { id: "TX129853", customer: "Đặng Thị G", source: "Gói Yoga Tháng", amount: 950000, date: "2024-03-22T10:20:00", status: "Thành công", method: "Thẻ Visa" },
    { id: "TX129854", customer: "Bùi Văn H", source: "Phí thành viên", amount: 100000, date: "2024-03-22T08:00:00", status: "Thành công", method: "Momo" },
  ];

  const filtered = transactions.filter(tx => {
    const matchesQuery = tx.customer.toLowerCase().includes(query.toLowerCase()) || tx.id.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = status === "all" || tx.status === status;
    return matchesQuery && matchesStatus;
  });

  const fmt = (n: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Lịch sử giao dịch</h1>
          <p className="text-sm text-slate-500">
            Tổng cộng {transactions.length} giao dịch đã được ghi nhận trong hệ thống.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-lg transition-all shadow-sm active:scale-95">
          <Download className="h-4 w-4" /> Xuất dữ liệu (CSV)
        </button>
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm theo mã giao dịch, tên khách hàng..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-white rounded-lg border border-slate-200 pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-600 outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="Thành công">Thành công</option>
              <option value="Chờ thanh toán">Chờ thanh toán</option>
              <option value="Thất bại">Thất bại</option>
            </select>
            <button className="flex items-center justify-center p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/30">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Mã GD / Ngày</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Khách hàng</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Nội dung</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Phương thức</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Số tiền</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                        <Hash className="h-3 w-3" />
                        {tx.id}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(tx.date).toLocaleString('vi-VN')}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 fon-semibold text-slate-900 text-sm">
                    {tx.customer}
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-sm whitespace-nowrap">
                    {tx.source}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-[11px] font-bold uppercase tracking-tight">
                    {tx.method}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900 tabular-nums text-sm">
                    {fmt(tx.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={
                      tx.status === 'Thành công' ? 'success' : 
                      tx.status === 'Chờ thanh toán' ? 'warning' : 'error'
                    }>
                      {tx.status === 'Thành công' ? <CheckCircle2 className="inline h-3 w-3 mr-1" /> : tx.status === 'Chờ thanh toán' ? <Clock className="inline h-3 w-3 mr-1" /> : <XCircle className="inline h-3 w-3 mr-1" />}
                      {tx.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 transition-colors shadow-sm bg-white" disabled>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-xs font-bold px-3">Trang 1 / 1</div>
            <button className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 transition-colors shadow-sm bg-white" disabled>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Giao dịch OmniGym</p>
        </div>
      </Card>
    </div>
  );
};

export default Transactions;