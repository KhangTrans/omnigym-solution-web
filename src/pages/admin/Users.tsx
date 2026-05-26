import { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  UserPlus,
  Shield,
  Clock,
  ExternalLink,
  CheckCircle2,
  XCircle
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

const UsersManagement = () => {
  const [query, setQuery] = useState("");
  
  // Mock data for users
  const [users] = useState([
    { id: 1, name: "Nguyễn Văn A", email: "vana@gmail.com", role: "Quản trị viên", status: "Hoạt động", joined: "2024-01-15", spend: "5.000.000đ" },
    { id: 2, name: "Trần Thị B", email: "thib@gmail.com", role: "Chủ phòng tập", status: "Hoạt động", joined: "2024-02-10", spend: "12.500.000đ" },
    { id: 3, name: "Lê Văn C", role: "Học viên", email: "vanc@gmail.com", status: "Tạm dừng", joined: "2024-03-01", spend: "1.200.000đ" },
    { id: 4, name: "Phạm Minh D", role: "Nhân viên", email: "minhd@gmail.com", status: "Hoạt động", joined: "2024-03-05", spend: "0đ" },
    { id: 5, name: "Hoàng Anh E", role: "Học viên", email: "anhe@gmail.com", status: "Bị khóa", joined: "2024-03-12", spend: "2.400.000đ" },
  ]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name.toLowerCase().includes(query.toLowerCase()) || 
      u.email.toLowerCase().includes(query.toLowerCase())
    );
  }, [users, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý người dùng</h1>
          <p className="text-sm text-slate-500">
            {users.length} tài khoản · {users.filter(u => u.status === "Hoạt động").length} đang hoạt động
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-all shadow-md active:scale-95">
          <UserPlus className="h-4 w-4" /> Thêm người dùng
        </button>
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm theo tên, email..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-white rounded-lg border border-slate-200 pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            <Filter className="h-4 w-4" /> Bộ lọc
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/30">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Người dùng</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Vai trò</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 hidden md:table-cell">Ngày tham gia</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Tổng chi tiêu</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold border border-emerald-100">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{user.name}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-slate-600 text-sm">
                      <Shield className="h-3.5 w-3.5" />
                      {user.role}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={
                      user.status === 'Hoạt động' ? 'success' : 
                      user.status === 'Tạm dừng' ? 'warning' : 'error'
                    }>
                      {user.status === 'Hoạt động' ? <CheckCircle2 className="inline h-3 w-3 mr-1" /> : <XCircle className="inline h-3 w-3 mr-1" />}
                      {user.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(user.joined).toLocaleDateString('vi-VN')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900 tabular-nums">
                    {user.spend}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-all">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-sm">
                    Không tìm thấy người dùng nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
          <p className="text-xs text-slate-500">Hiển thị {filteredUsers.length} trên tổng số {users.length} người dùng</p>
          <div className="flex items-center gap-2">
            <button disabled className="px-3 py-1 rounded border border-slate-200 text-xs font-semibold disabled:opacity-50">Trước</button>
            <button className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-semibold">1</button>
            <button className="px-3 py-1 rounded border border-slate-200 text-xs font-semibold">Sau</button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UsersManagement;