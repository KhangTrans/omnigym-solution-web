import { useState } from 'react';
import { 
  Dumbbell, 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  PlayCircle, 
  Clock, 
  Users, 
  ChevronRight,
  TrendingUp,
  Tag
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

const Exercises = () => {
  const [query, setQuery] = useState("");

  const exercisePacks = [
    { id: 1, name: "30 Ngày Giảm Mỡ Toàn Thân", category: "Giảm cân", duration: "4 tuần", level: "Cơ bản", subscribers: 1240, price: 500000, status: "Công khai" },
    { id: 2, name: "Tăng Cơ Ngực & Tay Sau nâng cao", category: "Tăng cơ", duration: "8 tuần", level: "Nâng cao", subscribers: 850, price: 800000, status: "Công khai" },
    { id: 3, name: "Yoga Phục Hồi Tại Nhà", category: "Yoga", duration: "2 tuần", level: "Mọi cấp độ", subscribers: 2100, price: 350000, status: "Công khai" },
    { id: 4, name: "Crossfit - Sức Mạnh Bộc Phát", category: "Crossfit", duration: "6 tuần", level: "Chuyên nghiệp", subscribers: 420, price: 1200000, status: "Nháp" },
    { id: 5, name: "HIIT Đốt Mỡ Cấp Tốc", category: "Cardio", duration: "10 ngày", level: "Trung bình", subscribers: 3500, price: 200000, status: "Công khai" },
  ];

  const fmt = (n: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý Gói bài tập</h1>
          <p className="text-sm text-slate-500">Thiết kế và quản lý các lộ trình tập luyện chuyên nghiệp cho người dùng.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-all shadow-md active:scale-95">
          <Plus className="h-4 w-4" /> Tạo gói tập mới
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-widest">Gói đang bán</span>
              <PlayCircle className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">18</div>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-widest">Đang soạn thảo</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">6</div>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-widest">Tổng đăng ký</span>
              <Users className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">8.1K</div>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-widest">Top doanh thu</span>
              <TrendingUp className="h-4 w-4 text-rose-500" />
            </div>
            <div className="text-sm font-bold text-slate-900 truncate">HIIT Đốt Mỡ Cấp Tốc</div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm tên gói bài tập, danh mục..." 
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
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Tên gói tập</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Danh mục / Cấp độ</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Thời lượng</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Đăng ký</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Giá bán</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {exercisePacks.map((pack) => (
                <tr key={pack.id} className="hover:bg-slate-50/80 transition-colors group text-sm">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                        <Dumbbell className="h-6 w-6" />
                      </div>
                      <div className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{pack.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
                        <Tag className="h-3 w-3" /> {pack.category}
                      </div>
                      <div className="text-[10px] text-slate-400 italic">{pack.level}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{pack.duration}</td>
                  <td className="px-6 py-4 text-right tabular-nums font-semibold">{pack.subscribers.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-bold text-emerald-600">{fmt(pack.price)}</td>
                  <td className="px-6 py-4">
                    <Badge variant={pack.status === 'Công khai' ? 'success' : 'warning'}>
                      {pack.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
                      <MoreVertical className="h-4 w-4" />
                    </button>
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

export default Exercises;