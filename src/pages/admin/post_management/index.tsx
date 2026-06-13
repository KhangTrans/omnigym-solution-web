import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { postsApi, type Post } from "@/api/posts";
import { CheckCircle2, Clock, Eye, FileEdit, FileText, Loader2, Plus, Search, Trash2, XCircle } from "lucide-react";
import { PostDialog, type PostDialogMode } from "./components/PostDialog";
import { cn } from "@/lib/utils";

type StatusKey = "draft" | "pending" | "approved" | "rejected";

const STATUS_LABEL: Record<StatusKey, string> = {
  draft: "Bản nháp",
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
};

function normalizeStatus(post: Post): StatusKey {
  const status = String(post.status || "").trim().toUpperCase();

  switch (status) {
    case "DRAFT":
      return "draft";
    case "PENDING":
      return "pending";
    case "PUBLISHED":
      return "approved";
    case "REJECTED":
      return "rejected";
    case "APPROVED":
    case "PUBLIC":
    case "PUBLISH":
    case "ACTIVE":
      return "approved";
    default:
      return post.is_published === true ? "approved" : "draft";
  }
}

function useCurrentUser() {
  return useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);
}

function getAuthorRole(post: Post) {
  return post.user?.role?.role_name || post.user?.role?.name || "Staff";
}

function extractThumbnail(post: Post) {
  if (post.images?.[0]?.image_url) return post.images[0].image_url;
  const match = (post.content || "").match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] || null;
}

function stripHtml(html?: string) {
  return (html || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim();
}

function getSavedPostId(response: unknown, fallbackId?: number) {
  const data = response as { id?: number; post?: { id?: number }; data?: { id?: number; post?: { id?: number } } } | null;
  return data?.id || data?.post?.id || data?.data?.id || data?.data?.post?.id || fallbackId;
}

export default function PostManagement() {
  const currentUser = useCurrentUser();
  const currentRole = String(currentUser?.role || "").toLowerCase();
  const currentRoleName = String(currentUser?.role?.role_name || currentUser?.role?.name || currentUser?.role || "").toLowerCase();
  const isAdminLike = [currentRole, currentRoleName].some((role) => role === "admin" || role === "branchmanager") || [1, 3].includes(Number(currentUser?.role_id));

  const [tab, setTab] = useState<StatusKey | "all">(isAdminLike ? "all" : "draft");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [mode, setMode] = useState<PostDialogMode>("create");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [reviewingPost, setReviewingPost] = useState<Post | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isStaffView = !isAdminLike;

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await postsApi.list({
        search: search.trim() || undefined,
        page: 1,
        limit: 100,
      });
      const items = Array.isArray(data.posts)
        ? data.posts
        : Array.isArray(data.data?.posts)
          ? data.data.posts
          : Array.isArray(data.data)
            ? data.data
            : Array.isArray(data.items)
              ? data.items
              : Array.isArray(data)
                ? data
                : [];
      setPosts(items);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      toast.error("Không thể tải danh sách bài viết");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchPosts, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const scopedPosts = useMemo(() => {
    const mine = (p: Post) =>
      Number(p.user_id) === Number(currentUser?.id) ||
      Number(p.user?.id) === Number(currentUser?.id);

    if (isStaffView) {
      return posts.filter(mine);
    }

    // Admin/BranchManager xem hàng quản trị: Chờ duyệt, Từ chối, Đã public/Đã duyệt.
    // Không hiển thị Draft vì Draft vẫn là bản nháp riêng của tác giả.
    return posts.filter((p) => ["pending", "rejected", "approved"].includes(normalizeStatus(p)));
  }, [posts, currentUser?.id, isStaffView]);

  const counts = useMemo(() => ({
    draft: scopedPosts.filter((p) => normalizeStatus(p) === "draft").length,
    pending: scopedPosts.filter((p) => normalizeStatus(p) === "pending").length,
    approved: scopedPosts.filter((p) => normalizeStatus(p) === "approved").length,
    rejected: scopedPosts.filter((p) => normalizeStatus(p) === "rejected").length,
  }), [scopedPosts]);

  const visiblePosts = useMemo(() => {
    return scopedPosts.filter((p) => tab === "all" || normalizeStatus(p) === tab);
  }, [scopedPosts, tab]);

  const handleOpenDialog = (targetMode: PostDialogMode, post?: Post) => {
    setMode(targetMode);
    setSelectedPost(post || null);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: { title: string; content: string }, action: "draft" | "submit" | "publish") => {
    const text = stripHtml(data.content);
    if (!data.title.trim() || !text) {
      toast.error("Vui lòng nhập đầy đủ tiêu đề và nội dung");
      return;
    }
    try {
      setIsSubmitting(true);
      let savedResponse: unknown = selectedPost;
      const shouldPublish = isAdminLike && action === "publish";
      const payload = {
        title: data.title.trim(),
        content: data.content,
      };
      if (mode === "edit" && selectedPost) {
        savedResponse = await postsApi.update(selectedPost.id, payload);
        if (shouldPublish) {
          await postsApi.approve(selectedPost.id);
        }
        toast.success(shouldPublish ? "Đã lưu và public bài viết" : action === "draft" ? "Đã lưu bài viết" : "Đã cập nhật bài viết");
      } else {
        savedResponse = await postsApi.create(payload);
        toast.success(shouldPublish ? "Đã tạo bài viết" : "Đã tạo bài viết chưa public");
      }
      const postId = getSavedPostId(savedResponse, selectedPost?.id);
      if (shouldPublish && mode !== "edit" && postId) {
        await postsApi.approve(postId);
        toast.success("Đã public bài viết");
      } else if (action === "submit" && postId) {
        await postsApi.submit(postId);
        toast.success("Đã gửi bài viết lên chờ duyệt");
      } else if (action === "submit") {
        throw new Error("Không tìm thấy ID bài viết vừa tạo để gửi duyệt");
      }
      setDialogOpen(false);
      fetchPosts();
    } catch (error) {
      console.error("Failed to save post:", error);
      toast.error("Có lỗi xảy ra khi lưu bài viết");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (post: Post) => {
    try {
      setIsSubmitting(true);
      await postsApi.approve(post.id);
      toast.success("Đã duyệt bài viết");
      setReviewingPost(null);
      fetchPosts();
    } catch (error) {
      console.error("Failed to approve post:", error);
      toast.error("Không thể duyệt bài viết");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmReject = async () => {
    if (!reviewingPost) return;
    if (!rejectNote.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }
    try {
      setIsSubmitting(true);
      await postsApi.reject(reviewingPost.id, { note: rejectNote.trim(), reason: rejectNote.trim() });
      toast.success("Đã từ chối bài viết");
      setRejectOpen(false);
      setReviewingPost(null);
      setRejectNote("");
      fetchPosts();
    } catch (error) {
      console.error("Failed to reject post:", error);
      toast.error("Không thể từ chối bài viết");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;
    try {
      setIsSubmitting(true);
      await postsApi.remove(postToDelete.id);
      toast.success("Xóa bài viết thành công");
      fetchPosts();
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast.error("Không thể xóa bài viết");
    } finally {
      setIsSubmitting(false);
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý bài viết</h1>
          <p className="text-muted-foreground">
            {isStaffView ? "Soạn bài, lưu nháp và gửi Admin duyệt." : "Quản lý bài viết, duyệt/từ chối bài gửi lên hoặc tạo bài public trực tiếp."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => handleOpenDialog("create")}><Plus className="mr-2 h-4 w-4" /> Bài viết mới</Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {isStaffView && <StatCard label="Bản nháp" value={counts.draft} icon={FileEdit} tone="muted" />}
        <StatCard label="Chờ duyệt" value={counts.pending} icon={Clock} tone="warning" />
        <StatCard label="Đã duyệt" value={counts.approved} icon={CheckCircle2} tone="success" />
        <StatCard label="Từ chối" value={counts.rejected} icon={XCircle} tone="destructive" />
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>{isStaffView ? "Bài viết của tôi" : "Hàng đợi duyệt bài"}</CardTitle>
          <div className="flex flex-wrap items-center gap-3">
            <Tabs value={tab} onValueChange={(v) => setTab(v as StatusKey | "all")}>
              <TabsList>
                {isStaffView && <TabsTrigger value="draft">Nháp ({counts.draft})</TabsTrigger>}
                <TabsTrigger value="pending">Chờ duyệt ({counts.pending})</TabsTrigger>
                <TabsTrigger value="approved">Đã duyệt ({counts.approved})</TabsTrigger>
                <TabsTrigger value="rejected">Từ chối ({counts.rejected})</TabsTrigger>
                <TabsTrigger value="all">Tất cả</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm kiếm bài viết..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="mt-2 text-sm text-muted-foreground">Đang tải dữ liệu...</p></div>
          ) : visiblePosts.length === 0 ? (
            <div className="grid place-items-center rounded-md border border-dashed py-16 text-center text-sm text-muted-foreground"><FileText className="mb-2 h-6 w-6" />Không có bài viết trong mục này.</div>
          ) : (
            <div className="rounded-xl bg-card shadow-[0_2px_12px_rgba(15,23,42,0.08)] overflow-x-auto admin-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ảnh</TableHead><TableHead>Tiêu đề</TableHead><TableHead>Tác giả</TableHead><TableHead>Trạng thái</TableHead><TableHead>Cập nhật</TableHead><TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visiblePosts.map((post) => {
                    const status = normalizeStatus(post);
                    const canEdit = isAdminLike || (isStaffView && ["draft", "rejected"].includes(status));
                    const thumbnail = extractThumbnail(post);
                    return (
                      <TableRow key={post.id} className="cursor-pointer hover:bg-muted/50" onClick={() => canEdit ? handleOpenDialog("edit", post) : setReviewingPost(post)}>
                        <TableCell>{thumbnail ? <img src={thumbnail} alt="thumbnail" className="h-12 w-16 rounded-md border object-cover" /> : <div className="flex h-12 w-16 items-center justify-center rounded-md border border-dashed bg-muted text-[10px] text-muted-foreground">No image</div>}</TableCell>
                        <TableCell><div className="max-w-[260px] truncate font-semibold">{post.title}</div><div className="max-w-[320px] truncate text-sm text-muted-foreground">{stripHtml(post.content)}</div></TableCell>
                        <TableCell><div className="font-medium">{post.user?.full_name || (post.user_id === currentUser?.id ? currentUser?.full_name : "N/A")}</div><div className="text-xs text-muted-foreground">{getAuthorRole(post)}</div></TableCell>
                        <TableCell><StatusBadge status={status} /></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(post.updated_at || post.created_at).toLocaleDateString("vi-VN")}</TableCell>
                        <TableCell className="text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                          {!isStaffView && status === "pending" && <Button variant="ghost" size="icon" onClick={() => handleApprove(post)} title="Duyệt bài"><CheckCircle2 className="h-4 w-4 text-emerald-600" /></Button>}
                          <Button variant="ghost" size="icon" onClick={() => isAdminLike || canEdit ? handleOpenDialog("edit", post) : setReviewingPost(post)} title={isAdminLike || canEdit ? "Chỉnh sửa" : "Xem chi tiết"}>{isAdminLike || canEdit ? <FileEdit className="h-4 w-4" /> : <Eye className="h-4 w-4 text-blue-600" />}</Button>
                          {(!isStaffView || canEdit) && <Button variant="ghost" size="icon" onClick={() => { setPostToDelete(post); setDeleteDialogOpen(true); }} className="text-destructive hover:text-destructive hover:bg-destructive/10" title="Xóa"><Trash2 className="h-4 w-4" /></Button>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <PostDialog open={dialogOpen} onOpenChange={setDialogOpen} mode={mode} post={selectedPost} onSubmit={handleSubmit} isSubmitting={isSubmitting} canPublishDirectly={isAdminLike} />

      <Dialog open={!!reviewingPost} onOpenChange={(o) => !o && setReviewingPost(null)}>
        <DialogContent className="sm:max-w-[760px] max-h-[95vh] overflow-y-auto admin-scrollbar">
          {reviewingPost && <><DialogHeader><DialogTitle>{reviewingPost.title}</DialogTitle><DialogDescription>Đăng bởi {reviewingPost.user?.full_name || "N/A"} · {new Date(reviewingPost.created_at).toLocaleString("vi-VN")}</DialogDescription></DialogHeader>
            {extractThumbnail(reviewingPost) && <img src={extractThumbnail(reviewingPost)!} alt="" className="max-h-72 w-full rounded-md border object-cover" />}
            <div className="flex items-center gap-2"><StatusBadge status={normalizeStatus(reviewingPost)} /><Badge variant="outline">{getAuthorRole(reviewingPost)}</Badge></div>
            <div className="prose prose-sm max-w-none rounded-md border bg-muted/30 p-4 [&_img]:max-w-full [&_img]:rounded-lg" dangerouslySetInnerHTML={{ __html: reviewingPost.content || "" }} />
            <DialogFooter className="gap-2 sm:justify-between">
              {!isStaffView ? <><Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => { setPostToDelete(reviewingPost); setReviewingPost(null); setDeleteDialogOpen(true); }}><Trash2 className="mr-2 h-4 w-4" /> Xóa</Button><div className="flex gap-2"><Button variant="outline" onClick={() => setRejectOpen(true)} disabled={isSubmitting}><XCircle className="mr-2 h-4 w-4" /> Từ chối</Button><Button onClick={() => handleApprove(reviewingPost)} disabled={isSubmitting}><CheckCircle2 className="mr-2 h-4 w-4" /> Duyệt</Button></div></> : <Button className="ml-auto" variant="outline" onClick={() => setReviewingPost(null)}>Đóng</Button>}
            </DialogFooter></>}
        </DialogContent>
      </Dialog>

      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Từ chối bài viết?</AlertDialogTitle><AlertDialogDescription>Nhập lý do từ chối để tác giả có thể chỉnh sửa và gửi lại.</AlertDialogDescription></AlertDialogHeader><div className="space-y-2"><Label>Lý do</Label><Textarea rows={4} value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="Ví dụ: Nội dung chưa đủ thông tin, cần bổ sung hình ảnh..." /></div><AlertDialogFooter><AlertDialogCancel disabled={isSubmitting}>Hủy</AlertDialogCancel><AlertDialogAction onClick={(e) => { e.preventDefault(); confirmReject(); }} disabled={isSubmitting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Từ chối</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle><AlertDialogDescription>Hành động này không thể hoàn tác. Bài viết sẽ bị xóa vĩnh viễn khỏi hệ thống.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={isSubmitting}>Hủy</AlertDialogCancel><AlertDialogAction onClick={(e) => { e.preventDefault(); confirmDelete(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Xóa bài viết"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}

function StatusBadge({ status }: { status: StatusKey }) {
  const map: Record<StatusKey, string> = {
    draft: "bg-slate-100 text-slate-700 border-slate-200",
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
  };
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", map[status])}>{STATUS_LABEL[status]}</span>;
}

function StatCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof Clock; tone: "warning" | "success" | "destructive" | "muted" }) {
  const tones = { warning: "text-amber-500", success: "text-emerald-500", destructive: "text-destructive", muted: "text-muted-foreground" };
  return <Card><CardContent className="p-4"><div className="flex items-center justify-between"><span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span><Icon className={cn("h-4 w-4", tones[tone])} /></div><div className="mt-1 text-2xl font-bold">{value}</div></CardContent></Card>;
}
