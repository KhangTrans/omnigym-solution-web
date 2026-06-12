import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Calendar, 
  CheckCircle2, 
  History, 
  MapPin, 
  Loader2, 
  UserCheck, 
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { customerCheckInApi, CustomerCheckInRecord } from '../../api/customerCheckIn';
import { branchesApi } from '../../api/branches';
import { authApi } from '../../api/auth';
import { notify } from '../../utils/notify';
import { cn } from '../../utils/cn';
import { BranchReviewModal } from '../pubblic/branches/components/BranchReviewModal';

interface BranchRecord {
  id: number;
  branch_name: string;
  address: string;
  image_url?: string | null;
}

interface UserSubscription {
  id: number;
  status: string;
  start_date?: string;
  end_date?: string;
  membership?: {
    name: string;
  };
}

const CustomerCheckIn = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<BranchRecord[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<UserSubscription | null>(null);
  const [checkInLogs, setCheckInLogs] = useState<CustomerCheckInRecord[]>([]);
  
  const [selectedBranchId, setSelectedBranchId] = useState<number | ''>('');
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // States for review modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewBranchId, setReviewBranchId] = useState<number | null>(null);
  const [reviewBranchName, setReviewBranchName] = useState("");

  // Load danh sách chi nhánh, thông tin gói tập và lịch sử check-in
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await branchesApi.getAll({ status: 'active' });
        const data = Array.isArray(response.data) ? response.data : response.data?.data ?? [];
        setBranches(data);
      } catch (err) {
        console.error('Failed to load branches', err);
        notify.error('Không thể tải danh sách chi nhánh');
      } finally {
        setLoadingBranches(false);
      }
    };

    const fetchSubscriptionAndProfile = async () => {
      try {
        const response = await authApi.getMe();
        const user = response.data?.user || response.data;
        
        // Tìm subscription active từ customer info
        const subscriptions = user?.customer?.subscriptions || [];
        const activeSub = subscriptions.find((sub: any) => sub.status === 'active');
        
        if (activeSub) {
          setActiveSubscription(activeSub);
        } else {
          // Fallback: Kiểm tra trực tiếp trên user object nếu có mapping khác
          setActiveSubscription(user.customerSubscription || null);
        }
      } catch (err) {
        console.error('Failed to load subscription status', err);
      } finally {
        setLoadingSubscription(false);
      }
    };

    const fetchLogs = async () => {
      try {
        const response = await customerCheckInApi.getMyLogs();
        setCheckInLogs(Array.isArray(response.data) ? response.data : response.data ?? []);
      } catch (err) {
        console.error('Failed to load check-in logs', err);
      } finally {
        setLoadingLogs(false);
      }
    };

    fetchBranches();
    fetchSubscriptionAndProfile();
    fetchLogs();
  }, []);

  const handleCheckIn = async () => {
    if (!selectedBranchId) {
      notify.error('Vui lòng chọn chi nhánh để check-in.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await customerCheckInApi.checkIn({
        branch_id: Number(selectedBranchId),
      });

      notify.success(response.data?.message || 'Check-in thành công!');
      setSuccess(true);
      
      // Reload check-in logs
      const updatedLogs = await customerCheckInApi.getMyLogs();
      setCheckInLogs(Array.isArray(updatedLogs.data) ? updatedLogs.data : updatedLogs.data ?? []);

      setTimeout(() => {
        setSuccess(false);
        setSelectedBranchId('');
      }, 3000);
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Check-in thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogClick = (log: CustomerCheckInRecord) => {
    if (log.branch_id) {
      setReviewBranchId(log.branch_id);
      setReviewBranchName(log.branch?.branch_name || "Chi nhánh");
      setShowReviewModal(true);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8 lg:px-10">
      <div className="space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-primary" /> Điểm danh vào phòng tập
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Check-in mỗi ngày khi bạn đến tập luyện tại các chi nhánh của OmniGym.
          </p>
        </div>

        {/* Subscription Status Card */}
        {loadingSubscription ? (
          <div className="flex h-20 items-center justify-center rounded-[1.75rem] border border-border bg-card">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Đang kiểm tra gói thành viên...</span>
          </div>
        ) : activeSubscription ? (
          <div className="relative overflow-hidden rounded-[1.75rem] border border-primary/10 bg-primary/5 p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
            <div className="space-y-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground">
                Gói đang hoạt động
              </span>
              <h2 className="text-xl font-bold text-foreground mt-2">
                {activeSubscription.membership?.name || 'Gói Thành Viên'}
              </h2>
              {activeSubscription.end_date && (
                <p className="text-sm text-muted-foreground inline-flex items-center gap-1.5 mt-1">
                  <Calendar className="h-4 w-4" /> Hạn sử dụng đến ngày:{' '}
                  {new Date(activeSubscription.end_date).toLocaleDateString('vi-VN')}
                </p>
              )}
            </div>
            <div className="mt-4 sm:mt-0">
              <span className="text-xs text-emerald-600 font-bold bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 px-3 py-1.5 rounded-xl">
                Có quyền Check-in
              </span>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-[1.75rem] border border-destructive/10 bg-destructive/5 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
              <div>
                <h2 className="text-base font-semibold text-foreground">Bạn chưa có gói thành viên đang hoạt động</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Vui lòng mua gói thành viên để có quyền check-in và luyện tập tại các chi nhánh.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/membership-packages')} // Route gói tập của bạn
              className="rounded-xl bg-destructive text-destructive-foreground px-5 py-2.5 text-sm font-semibold transition-all hover:opacity-90 self-start sm:self-center"
            >
              Mua gói tập ngay
            </button>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Check-In Action Card */}
          <div className="rounded-[1.75rem] border border-border bg-card p-6 shadow-sm flex flex-col justify-between space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" /> Chọn chi nhánh tập luyện
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Hãy chắc chắn rằng bạn đang đứng tại đúng chi nhánh đã chọn.
              </p>

              <div className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Chi nhánh</label>
                  {loadingBranches ? (
                    <div className="flex items-center text-sm text-muted-foreground py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" /> Đang tải danh sách...
                    </div>
                  ) : (
                    <select
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(Number(e.target.value))}
                      disabled={!activeSubscription || submitting}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:border-primary focus:ring-primary/20 transition-all disabled:opacity-60"
                    >
                      <option value="">-- Chọn phòng tập của bạn --</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.branch_name} ({b.address})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {selectedBranchId && (
                  <div className="rounded-xl bg-muted p-3 text-xs text-muted-foreground flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      Địa chỉ: {branches.find(b => b.id === selectedBranchId)?.address}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleCheckIn}
              disabled={!activeSubscription || !selectedBranchId || submitting}
              className={cn(
                "w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:transform-none",
                success && "bg-emerald-600 hover:bg-emerald-600 shadow-emerald-200"
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Đang xử lý...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="h-5 w-5 animate-in zoom-in" /> Đã điểm danh!
                </>
              ) : (
                'Xác nhận Check-in'
              )}
            </button>
          </div>

          {/* History Check-in list */}
          <div className="rounded-[1.75rem] border border-border bg-card p-6 shadow-sm flex flex-col space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <History className="h-5 w-5 text-primary" /> Lịch sử đi tập hôm nay & gần đây
            </h3>

            <div className="flex-1 overflow-y-auto max-h-[300px] pr-1 space-y-3">
              {loadingLogs ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : checkInLogs.length === 0 ? (
                <div className="text-center py-10 text-sm text-muted-foreground italic">
                  Bạn chưa có lượt check-in nào. Hãy bắt đầu buổi tập đầu tiên của mình!
                </div>
              ) : (
                checkInLogs.map((log) => {
                  const checkInDate = new Date(log.check_in_time);
                  const isToday = new Date().toDateString() === checkInDate.toDateString();

                  return (
                    <div 
                      key={log.id} 
                      onClick={() => handleLogClick(log)}
                      title="Nhấp để đánh giá chi nhánh này"
                      className={cn(
                        "p-3 rounded-xl border border-border bg-background/50 flex items-center justify-between gap-3 text-xs transition-all cursor-pointer hover:border-primary/40 hover:bg-primary/5",
                        isToday && "border-primary/20 bg-primary/5 shadow-sm hover:border-primary/45 hover:bg-primary/10"
                      )}
                    >
                      <div className="space-y-1">
                        <div className="font-semibold text-foreground">{log.branch?.branch_name || 'Chi nhánh'}</div>
                        <div className="text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {log.branch?.address}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="font-bold text-foreground">
                          {checkInDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {isToday ? (
                            <span className="text-primary font-semibold">Hôm nay</span>
                          ) : (
                            checkInDate.toLocaleDateString('vi-VN')
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Modal Đánh giá chi nhánh */}
      <BranchReviewModal
        open={showReviewModal}
        onOpenChange={setShowReviewModal}
        branchId={reviewBranchId}
        branchName={reviewBranchName}
      />

    </div>
  );
};

export default CustomerCheckIn;
