import { useState } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  MessageSquare,
  FileText,
  ThumbsUp,
  Flag,
  CheckCircle2,
  XCircle,
  Eye,
  User,
  Clock,
  ExternalLink
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

const Moderation = () => {
  const [activeTab, setActiveTab] = useState('pending');

  const contentItems = [
    { id: 1, author: "Hoàng Minh", type: "Đánh giá", content: "Phòng tập ở đây rất sạch sẽ, máy móc hiện đại nhưng giá hơi cao so với mặt bằng chung.", target: "OmniGym Central", date: "10 phút trước", status: "Chờ duyệt", reports: 0 },
    { id: 2, author: "Lê Thị Thu", type: "Bài viết", content: "Làm thế nào để giảm cân hiệu quả trong 30 ngày? Đây là lịch tập của mình...", target: "Cộng đồng", date: "2 giờ trước", status: "Chờ duyệt", reports: 0 },
    { id: 3, author: "Ẩn danh", type: "Đánh giá", content: "Dịch vụ kém, nhân viên không nhiệt tình. Tôi sẽ không quay lại.", target: "Elite Fitness Lab", date: "5 giờ trước", status: "Đã báo cáo", reports: 3 },
    { id: 4, author: "Minh Quân", type: "Bài viết", content: "Top 5 thực phẩm nên ăn trước khi tập gym để có năng lượng tốt nhất.", target: "Cộng đồng", date: "Hôm qua", status: "Đã duyệt", reports: 0 },
    { id: 5, author: "Nguyễn An", type: "Bình luận", content: "Cảm ơn bài chia sẻ rất hữu ích!", target: "Bài viết: Cardio 101", date: "Hôm qua", status: "Đã duyệt", reports: 0 },
  ];

  const filtered = contentItems.filter(item => {
    if (activeTab === 'pending') return item.status === 'Chờ duyệt' || item.status === 'Đã báo cáo';
    if (activeTab === 'approved') return item.status === 'Đã duyệt';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Kiểm duyệt nội dung</h1>
          <p className="text-sm text-slate-500">Quản lý bài viết, đánh giá và bình luận từ cộng đồng người dùng.</p>
        </div>
        <div className="flex bg-white border border-slate-200 p-1 rounded-lg shadow-sm">
           <button 
            onClick={() => setActiveTab('pending')}
            className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all", activeTab === 'pending' ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900")}
           >
            Cần xử lý ({contentItems.filter(i => i.status !== 'Đã duyệt').length})
           </button>
           <button 
            onClick={() => setActiveTab('approved')}
            className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all", activeTab === 'approved' ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900")}
           >
            Đã duyệt
           </button>
        </div>
      </div>

      <div className="grid gap-6">
        {filtered.length > 0 ? (
          filtered.map((item) => (
            <Card key={item.id} className={cn(item.status === 'Đã báo cáo' ? "border-rose-200" : "")}>
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{item.author}</span>
                        <Badge variant={
                          item.type === 'Đánh giá' ? 'warning' : 'outline'
                        }>{item.type}</Badge>
                        {item.status === 'Đã báo cáo' && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full uppercase italic animate-pulse">
                            <Flag className="h-3 w-3" /> {item.reports} Báo cáo
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 uppercase font-bold tracking-tight">
                        <Clock className="h-3 w-3" /> {item.date} · Đăng tại: <span className="text-emerald-500">{item.target}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400" title="Xem chi tiết">
                      <Eye className="h-4 w-4" />
                    </button>
                    {item.status !== 'Đã duyệt' && (
                      <>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-md transition-all shadow-sm">
                          <CheckCircle2 className="h-3.5 w-3.5" /> DUYỆT
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-[11px] font-bold rounded-md transition-all">
                          <XCircle className="h-3.5 w-3.5" /> GỠ BỎ
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <p className="text-sm text-slate-600 leading-relaxed italic">
                    "{item.content}"
                  </p>
                </div>
                
                <div className="mt-4 flex items-center gap-4 text-xs font-bold text-slate-400">
                   <div className="flex items-center gap-1.5">
                     <ThumbsUp className="h-3.5 w-3.5" /> 12 Thích
                   </div>
                   <div className="flex items-center gap-1.5">
                     <MessageSquare className="h-3.5 w-3.5" /> 3 Phản hồi
                   </div>
                   <div className="ml-auto flex items-center gap-1 text-emerald-500 cursor-pointer hover:underline">
                      Xem bài gốc <ExternalLink className="h-3 w-3" />
                   </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
             <ShieldAlert className="h-12 w-12 mb-3 opacity-20" />
             <p className="font-bold">Không có nội dung nào cần xử lý lúc này.</p>
             <p className="text-xs">Tất cả bài viết và đánh giá đã được kiểm tra.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Moderation;