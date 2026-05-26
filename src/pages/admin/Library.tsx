import { useState } from 'react';
import { 
  Library as LibraryIcon, 
  Search, 
  Plus, 
  Filter, 
  Play, 
  ChevronRight, 
  Dumbbell,
  Target,
  Layers,
  MoreVertical,
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

const Library = () => {
  const [query, setQuery] = useState("");

  const exercises = [
    { id: 1, title: "Push Up (Hít đất)", bodyPart: "Ngực, Tay sau", equipment: "Không", video: true, level: "Cơ bản" },
    { id: 2, title: "Bench Press", bodyPart: "Ngực", equipment: "Tạ đòn", video: true, level: "Trung bình" },
    { id: 3, title: "Squat", bodyPart: "Đùi, Mông", equipment: "Tạ đòn/Tạ đơn", video: true, level: "Mọi cấp độ" },
    { id: 4, title: "Deadlift", bodyPart: "Lưng dưới, Đùi sau", equipment: "Tạ đòn", video: true, level: "Nâng cao" },
    { id: 5, title: "Plank", bodyPart: "Cơ bụng (Core)", equipment: "Không", video: false, level: "Cơ bản" },
    { id: 6, title: "Pull Up (Hít xà)", bodyPart: "Lưng xô, Tay trước", equipment: "Xà đơn", video: true, level: "Trung bình" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Thư viện bài tập</h1>
          <p className="text-sm text-slate-500">Kho lưu trữ video hướng dẫn và kỹ thuật các động tác tập luyện.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-all shadow-md active:scale-95">
          <Plus className="h-4 w-4" /> Thêm bài tập mới
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm theo tên bài tập, nhóm cơ..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
           <select className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-sm font-medium text-slate-600">
             <option>Tất cả nhóm cơ</option>
             <option>Ngực</option>
             <option>Lưng</option>
             <option>Đùi</option>
             <option>Bụng</option>
           </select>
           <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 shadow-sm transition-colors">
             <Filter className="h-4 w-4" />
           </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {exercises.map((ex) => (
          <Card key={ex.id} className="group hover:border-emerald-200 transition-all">
            <div className="aspect-video bg-slate-100 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                  <Badge variant="outline" className="w-fit bg-white/20 text-white border-white/30 backdrop-blur-md mb-2">
                    {ex.level}
                  </Badge>
                  <h3 className="text-white font-bold leading-tight group-hover:text-emerald-300 transition-colors uppercase tracking-tight">
                    {ex.title}
                  </h3>
               </div>
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100">
                  <div className="h-12 w-12 rounded-full bg-white/90 text-emerald-600 flex items-center justify-center shadow-lg">
                    <Play className="h-6 w-6 fill-current" />
                  </div>
               </div>
            </div>
            <div className="p-4 space-y-3">
               <div className="flex items-start justify-between">
                  <div className="space-y-1">
                     <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <Target className="h-3.5 w-3.5" /> {ex.bodyPart}
                     </div>
                     <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                        <Layers className="h-3.5 w-3.5" /> {ex.equipment}
                     </div>
                  </div>
                  <button className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400">
                    <MoreVertical className="h-4 w-4" />
                  </button>
               </div>
               <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex -space-x-1.5">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400">
                        U
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sử dụng trong 12 bài tập</span>
               </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-emerald-500/20">
         <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
               <LibraryIcon className="h-6 w-6" />
            </div>
            <div>
               <h2 className="font-bold text-lg">Bạn muốn tạo chuỗi bài tập tự động?</h2>
               <p className="text-sm text-emerald-100 opacity-90">Sử dụng AI để gợi ý lộ trình tập dựa trên thư viện có sẵn.</p>
            </div>
         </div>
         <button className="px-6 py-2.5 bg-white text-emerald-600 font-bold rounded-xl hover:bg-emerald-50 transition-all flex items-center gap-2 active:scale-95 shadow-lg">
           Thử ngay <ArrowUpRight className="h-4 w-4" />
         </button>
      </div>
    </div>
  );
};

export default Library;