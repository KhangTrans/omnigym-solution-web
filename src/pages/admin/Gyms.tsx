import { useState, useMemo } from 'react';
import { 
  Building2, 
  MapPin, 
  Search, 
  Plus, 
  Star, 
  Users, 
  Dumbbell, 
  MoreVertical,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Store
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
    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", styles[variant])}>
      {children}
    </span>
  );
};

const GymsManagement = () => {
  const [query, setQuery] = useState("");

  const gyms = [
    { id: 1, name: "OmniGym Central", location: "Quận 1, TP.HCM", owner: "Nguyễn Văn A", status: "Hoạt động", branches: 5, rating: 4.8, members: 1200, type: "Hệ thống" },
    { id: 2, name: "Elite Fitness Lab", location: "Quận 7, TP.HCM", owner: "Trần Thị B", status: "Hoạt động", branches: 1, rating: 4.5, members: 450, type: "Phòng đơn" },
    { id: 3, name: "Yoga Harmony Studio", location: "Quận Cầu Giấy, Hà Nội", owner: "Lê Văn C", status: "Hoạt động", branches: 3, rating: 4.9, members: 320, type: "Hệ thống" },
    { id: 4, name: "Crossfit Đống Đa", location: "Quận Đống Đa, Hà Nội", owner: "Phạm Minh D", status: "Hoạt động", branches: 1, rating: 4.2, members: 150, type: "Phòng đơn" },
    { id: 5, name: "The Power House", location: "Đà Nẵng", owner: "Hoàng Anh E", status: "Tạm dừng", branches: 1, rating: 4.0, members: 280, type: "Phòng đơn" },
  ];

  const filtered = gyms.filter(g => 
    g.name.toLowerCase().includes(query.toLowerCase()) || 
    g.location.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý phòng tập</h1>
          <p className="text-sm text-slate-500">
            {gyms.length} thương hiệu đối tác đang hoạt động trên nền tảng.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-all shadow-md active:scale-95">
          <Plus className="h-4 w-4" /> Đăng ký phòng mới
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-widest">Tổng hệ thống</span>
              <Building2 className="h-4 w-4" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{gyms.filter(g => g.type === "Hệ thống").length}</div>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-widest">Phòng tập đơn</span>
              <Store className="h-4 w-4" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{gyms.filter(g => g.type === "Phòng đơn").length}</div>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-widest">Tổng học viên</span>
              <Users className="h-4 w-4" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{gyms.reduce((acc, g) => acc + g.members, 0).toLocaleString()}</div>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-widest">Đánh giá trung bình</span>
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900">4.7 / 5.0</div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm theo tên phòng tập, địa chỉ..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-white rounded-lg border border-slate-200 pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/30">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Phòng tập</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Loại hình</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Chủ sở hữu</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Chi nhánh</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Học viên</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 w-32"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((gym) => (
                <tr key={gym.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                        <Dumbbell className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">{gym.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" /> {gym.location}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={gym.type === 'Hệ thống' ? 'default' : 'outline'}>
                      {gym.type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {gym.owner}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-slate-900">
                    {gym.branches}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-slate-900 tabular-nums">
                    {gym.members.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 ml-auto">
                      Chi tiết <ChevronRight className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      
      <div className="grid gap-6 md:grid-cols-2">
        {gyms.slice(0, 2).map(g => (
          <Card key={g.id}>
            <div className="flex h-32">
              <div className="w-1/3 bg-slate-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                  <Building2 className="h-10 w-10 opacity-20" />
                </div>
              </div>
              <div className="w-2/3 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm truncate">{g.name}</h3>
                    <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                      <Star className="h-3 w-3 fill-amber-500" /> {g.rating}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{g.location}</p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                    {g.members} học viên · {g.branches} chi nhánh
                  </div>
                  <button className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md hover:bg-emerald-100 transition-colors">
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GymsManagement;