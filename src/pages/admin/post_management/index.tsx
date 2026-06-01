import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { postsApi, type Post } from "@/api/posts";
import { Pencil, Trash2, CheckCircle, Plus, Search, Loader2, Eye } from "lucide-react";
import { PostDialog, type PostDialogMode } from "./components/PostDialog";

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

export default function PostManagement() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<number | null>(null);
  const [mode, setMode] = useState<PostDialogMode>("create");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await postsApi.list({ search });
      setPosts(Array.isArray(data.posts) ? data.posts : []);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      toast.error("Không thể tải danh sách bài viết");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPosts();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenDialog = (targetMode: PostDialogMode, post?: Post) => {
    setMode(targetMode);
    setSelectedPost(post || null);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: { title: string; content: string; is_published: boolean }) => {
    if (!data.title.trim() || !data.content.trim()) {
      toast.error("Vui lòng nhập đầy đủ tiêu đề và nội dung");
      return;
    }

    try {
      setIsSubmitting(true);
      if (mode === "edit" && selectedPost) {
        await postsApi.update(selectedPost.id, data);
        toast.success("Cập nhật bài viết thành công");
      } else {
        await postsApi.create(data);
        toast.success("Tạo bài viết mới thành công");
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

  const handleDelete = (id: number) => {
    setPostToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;

    try {
      setIsSubmitting(true);
      await postsApi.remove(postToDelete);
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

  const handleApprove = async (id: number) => {
    try {
      await postsApi.approve(id);
      toast.success("Đã duyệt bài viết");
      fetchPosts();
    } catch (error) {
      console.error("Failed to approve post:", error);
      toast.error("Không thể duyệt bài viết");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý bài viết</h1>
          <p className="text-muted-foreground">
            Tạo và quản lý các bài blog, tin tức cho hệ thống.
          </p>
        </div>
        <Button onClick={() => handleOpenDialog("create")} className="w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Bài viết mới
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Danh sách bài viết</CardTitle>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm bài viết..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-sm text-muted-foreground">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead className="w-[100px]">Ảnh bìa</TableHead>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead>Nội dung sơ lược</TableHead>
                    <TableHead>Tác giả</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                        Không tìm thấy bài viết nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    posts.map((post) => {
                      const thumbnail = post.images && post.images.length > 0 
                        ? post.images[0].image_url 
                        : (function() {
                            const div = document.createElement('div');
                            div.innerHTML = post.content;
                            const img = div.querySelector('img');
                            return img ? img.getAttribute('src') : null;
                          })();

                      return (
                        <TableRow key={post.id} className="group transition-colors hover:bg-muted/50">
                          <TableCell className="font-medium text-muted-foreground">#{post.id}</TableCell>
                          <TableCell>
                            {thumbnail ? (
                              <img 
                                src={thumbnail} 
                                alt="thumbnail" 
                                className="w-16 h-12 object-cover rounded-md border"
                              />
                            ) : (
                              <div className="w-16 h-12 bg-muted rounded-md flex items-center justify-center text-[10px] text-muted-foreground border border-dashed text-center px-1">
                                No thumbnail
                              </div>
                            )}
                          </TableCell>
                        <TableCell className="max-w-[200px] truncate font-semibold">
                          {post.title}
                        </TableCell>
                        <TableCell className="max-w-[250px] truncate text-muted-foreground text-sm">
                          <div dangerouslySetInnerHTML={{ __html: post.content }} className="line-clamp-1" />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{post.user?.full_name || "N/A"}</div>
                          <div className="text-xs text-muted-foreground">
                            {post.user?.role?.name || "Staff"}
                          </div>
                        </TableCell>
                        <TableCell>
                          {post.is_published ? (
                            <Badge variant="success" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                              Công khai
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                              Chờ duyệt
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(post.created_at).toLocaleDateString("vi-VN")}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          {!post.is_published && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleApprove(post.id)}
                              title="Duyệt bài"
                            >
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog("view", post)}
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog("edit", post)}
                            title="Chỉnh sửa"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(post.id)}
                            title="Xóa"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <PostDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={mode}
        post={selectedPost}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Bài viết sẽ bị xóa vĩnh viễn khỏi hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Xóa bài viết"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
