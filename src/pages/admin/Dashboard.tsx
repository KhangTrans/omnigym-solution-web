import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  ArrowRight, 
  Dumbbell, 
  Library,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../../utils/cn';

// Simple reusable components within the page
const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden", className)}>
    {children}
  </div>
);

const CardContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("p-6", className)}>
    {children}
  </div>
);

const CardHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("px-6 py-4 border-b border-slate-100", className)}>
    {children}
  </div>
);

const Dashboard = () => {
  // Mock data for the dashboard
  const stats = {
    totalRevenue: 125430,
    last30DaysRevenue: 12450,
    activeMembers: 842,
    totalAccounts: 1250,
    gymPacks: 24,
    libraryExercises: 156,
    growth: 12.5
  };

  const recentTransactions = [
    { id: 1, customer: "Nguyễn Văn A", source: "GYM-Premium", amount: 500, date: "2024-03-25" },
    { id: 2, customer: "Trần Thị B", source: "Yoga-Pack", amount: 300, date: "2024-03-24" },
    { id: 3, customer: "Lê Văn C", source: "Personal Training", amount: 1200, date: "2024-03-24" },
    { id: 4, customer: "Phạm Minh D", source: "GYM-Basic", amount: 200, date: "2024-03-23" },
    { id: 5, customer: "Hoàng Anh E", source: "Crossfit", amount: 600, date: "2024-03-22" },
  ];

  const fmt = (n: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
  };

  const cards = [
    { label: "Doanh thu tổng", value: fmt(stats.totalRevenue), icon: DollarSign, hint: `${fmt(stats.last30DaysRevenue)} trong 30 ngày qua` },
    { label: "Thành viên tích cực", value: String(stats.activeMembers), icon: Users, hint: `${stats.totalAccounts} tổng số tài khoản` },
    { label: "Gói tập luyện", value: String(stats.gymPacks), icon: Dumbbell, hint: "24 gói đang hoạt động" },
    { label: "Thư viện bài tập", value: String(stats.libraryExercises), icon: Library, hint: "Bài tập đã phê duyệt" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">Tổng quan hệ thống</h1>
          <p className="text-sm text-slate-500">Báo cáo tóm tắt về doanh thu, thành viên và các gói tập.</p>
        </div>
        <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-100">
          <TrendingUp className="h-3 w-3" />
          +{stats.growth}% so với 30 ngày trước
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label}>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{c.label}</span>
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4 text-2xl font-bold tabular-nums text-slate-900">{c.value}</div>
                <div className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  {c.hint}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Doanh thu 30 ngày qua</h2>
            <Link to="/admin/revenue" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors">
              Xem chi tiết <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="h-64 flex items-end justify-between gap-2 pt-10">
            {/* Simple CSS-based bar chart */}
            {[40, 65, 45, 90, 55, 75, 50, 85, 60, 95, 70, 80].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div 
                  className="w-full bg-emerald-100 group-hover:bg-emerald-500 rounded-t transition-all duration-300 relative" 
                  style={{ height: `${h}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {fmt(h * 1000)}
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">T{i+1}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Giao dịch gần đây</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentTransactions.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm group cursor-pointer border-b border-transparent hover:border-slate-100 pb-1 transition-all">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{r.customer}</div>
                    <div className="text-xs text-slate-500">
                      {r.source} · {new Date(r.date).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>
                <div className="tabular-nums font-bold text-slate-900">{fmt(r.amount)}</div>
              </div>
            ))}
            <Link 
              to="/admin/transactions" 
              className="block w-full text-center mt-4 py-2 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            >
              Xem tất cả giao dịch
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
