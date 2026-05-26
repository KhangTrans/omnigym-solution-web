import { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Activity
} from 'lucide-react';
import { cn } from '../../utils/cn';

// Simple reusable components
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
  <div className={cn("px-6 py-4 border-b border-slate-100 flex items-center justify-between", className)}>
    {children}
  </div>
);

const Revenue = () => {
  const [timeRange, setTimeRange] = useState('30');

  const stats = {
    total: 1254300000,
    growth: 12.5,
    avgTicket: 450000,
    transactions: 2450
  };

  const revenueBySource = [
    { label: 'Gói thành viên', value: 752000000, color: 'bg-emerald-500' },
    { label: 'Buổi tập PT', value: 324000000, color: 'bg-teal-500' },
    { label: 'Lớp học nhóm', value: 128000000, color: 'bg-amber-500' },
    { label: 'Cửa hàng/Dịch vụ', value: 50300000, color: 'bg-rose-500' },
  ];

  const fmt = (n: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Báo cáo doanh thu</h1>
          <p className="text-sm text-slate-500">Phân tích sâu về dòng tiền và nguồn thu nhập của hệ thống.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white border border-slate-200 rounded-lg p-1 flex items-center shadow-sm">
            <button 
              onClick={() => setTimeRange('7')}
              className={cn("px-3 py-1 text-xs font-bold rounded-md transition-all", timeRange === '7' ? "bg-emerald-600 text-white" : "text-slate-500 hover:text-slate-900")}
            >7 ngày</button>
            <button 
              onClick={() => setTimeRange('30')}
              className={cn("px-3 py-1 text-xs font-bold rounded-md transition-all", timeRange === '30' ? "bg-emerald-600 text-white" : "text-slate-500 hover:text-slate-900")}
            >30 ngày</button>
            <button 
              onClick={() => setTimeRange('90')}
              className={cn("px-3 py-1 text-xs font-bold rounded-md transition-all", timeRange === '90' ? "bg-emerald-600 text-white" : "text-slate-500 hover:text-slate-900")}
            >3 tháng</button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <DollarSign className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                <ArrowUpRight className="h-3 w-3" /> 12%
              </div>
            </div>
            <div className="text-sm font-medium text-slate-500">Tổng doanh thu</div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{fmt(stats.total)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Activity className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                <ArrowUpRight className="h-3 w-3" /> 5%
              </div>
            </div>
            <div className="text-sm font-medium text-slate-500">Giao dịch thành công</div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{stats.transactions.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <BarChartIcon className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-1 text-rose-600 text-xs font-bold bg-rose-50 px-2 py-0.5 rounded-full">
                <ArrowDownRight className="h-3 w-3" /> 2%
              </div>
            </div>
            <div className="text-sm font-medium text-slate-500">Doanh thu trung bình</div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{fmt(stats.avgTicket)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
            <div className="text-sm font-medium text-slate-500">Tăng trưởng năm</div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">+{stats.growth}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="text-base font-bold text-slate-900">Doanh thu theo thời gian</h2>
            <button className="p-1.5 hover:bg-slate-100 rounded-md transition-colors">
              <Filter className="h-4 w-4 text-slate-400" />
            </button>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full flex items-end justify-between gap-3 pt-6">
              {[35, 55, 45, 75, 60, 95, 80, 70, 85, 90, 65, 50].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-3 group relative">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {fmt(val * 1000000)}
                  </div>
                  <div 
                    className="w-full bg-slate-100 group-hover:bg-emerald-500 rounded-t-md transition-all duration-300 relative overflow-hidden" 
                    style={{ height: `${val}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent"></div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 capitalize">Th {i + 1}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-base font-bold text-slate-900">Cơ cấu nguồn thu</h2>
            <PieChartIcon className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="relative h-48 w-48 mx-auto mt-4">
              {/* Fake Pie Chart with SVG */}
              <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg]">
                <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#f0fdf4" strokeWidth="3.8" />
                <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#10b981" strokeWidth="3.8" strokeDasharray="60 100" />
                <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#14b8a6" strokeWidth="3.8" strokeDasharray="25 100" strokeDashoffset="-60" />
                <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#f59e0b" strokeWidth="3.8" strokeDasharray="10 100" strokeDashoffset="-85" />
                <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#f43f5e" strokeWidth="3.8" strokeDasharray="5 100" strokeDashoffset="-95" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-slate-500">Tổng cộng</span>
                <span className="text-lg font-bold text-emerald-600">1.25B</span>
              </div>
            </div>
            
            <div className="space-y-3">
              {revenueBySource.map((source) => (
                <div key={source.label} className="flex items-center justify-between group cursor-help">
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2.5 w-2.5 rounded-full", source.color)}></div>
                    <span className="text-sm font-medium text-slate-600">{source.label}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 tabular-nums">{Math.round((source.value / stats.total) * 100)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Revenue;