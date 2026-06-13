import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, Calendar, Eye, RefreshCw, UserRound } from "lucide-react";
import { Navbar } from "../../components/site/Navbar";
import { Footer } from "../../components/site/Footer";
import { ScrollProgressButton } from "../../components/site/ScrollProgressButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { postsApi, trackBlogView, type Post } from "@/api/posts";
import {
  formatPostDate,
  formatViewCount,
  getAuthUser,
  getPostHeroImage,
  removeFirstImageFromContent,
} from "@/utils/blogUtils";

export default function BlogDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayViewCount, setDisplayViewCount] = useState<number | undefined>(undefined);

  const postId = Number(id);

  const fetchPostDetail = useCallback(async () => {
    if (!Number.isFinite(postId) || postId <= 0) {
      setError("Đường dẫn bài viết không hợp lệ.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const detail = await postsApi.getById(postId);
      setPost(detail);
      setDisplayViewCount(detail.view_count);
    } catch (err) {
      console.error("Error loading post detail:", err);
      setError("Không thể tải bài viết. Bài viết có thể không tồn tại hoặc chưa được công khai.");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchPostDetail();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchPostDetail]);

  useEffect(() => {
    if (!post?.id) return;

    const authUser = getAuthUser();
    const countableRoles = ["Customer", "Trainer"];
    const token = localStorage.getItem("token");
    const canTrack = !!token && !!authUser?.role && countableRoles.includes(authUser.role);

    if (!canTrack) return;

    trackBlogView(post.id)
      .then((result) => {
        if (!result.success) {
          console.error("Track view failed:", result);
          return;
        }

        if (typeof result.viewCount === "number") {
          setDisplayViewCount(result.viewCount);
          setPost((current) => current?.id === post.id ? { ...current, view_count: result.viewCount } : current);
        }
      })
      .catch((err) => {
        console.error("Track view failed:", err);
      });
  }, [post?.id]);

  const renderLoading = () => (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <Skeleton className="h-10 w-36" />
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-72 md:h-96 w-full rounded-2xl" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-9/12" />
      </div>
    </div>
  );

  const renderError = () => (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="flex flex-col items-center justify-center text-center py-16 px-6 bg-muted/20 border border-dashed rounded-2xl">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Không thể hiển thị bài viết</h1>
        <p className="text-muted-foreground max-w-md mb-6">{error}</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={() => navigate("/blog")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Quay lại Blog
          </Button>
          <Button onClick={fetchPostDetail} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Thử lại
          </Button>
        </div>
      </div>
    </div>
  );

  const heroImage = post ? getPostHeroImage(post) : { url: null, source: null };
  const authorName = post?.user?.full_name || "Huấn luyện viên";
  const authorAvatar = post?.user?.avatar_url;
  const authorRole = post?.user?.role?.role_name || post?.user?.role?.name;
  const contentHtml = heroImage.source === "content"
    ? removeFirstImageFromContent(post?.content)
    : post?.content || "";

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <Navbar />

      <main className="flex-grow">
        {loading ? renderLoading() : error || !post ? renderError() : (
          <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
          >
            <Button variant="ghost" asChild className="mb-8 gap-2 pl-0 hover:pl-2 transition-all">
              <Link to="/blog">
                <ArrowLeft className="h-4 w-4" /> Quay lại danh sách blog
              </Link>
            </Button>

            <header className="space-y-6 mb-8">
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100/85 border-none">
                  {post.category || "General"}
                </Badge>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formatPostDate(post.created_at)}
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4" />
                  {formatViewCount(displayViewCount ?? post.view_count)} lượt xem
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-foreground">
                {post.title || "Bài viết không có tiêu đề"}
              </h1>

              <div className="flex items-center gap-3 rounded-2xl border bg-card/80 p-4 shadow-sm">
                {authorAvatar ? (
                  <img
                    src={authorAvatar}
                    alt={authorName}
                    className="h-12 w-12 rounded-full object-cover border"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center border">
                    <UserRound className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Tác giả</p>
                  <p className="font-semibold text-foreground">{authorName}</p>
                  {authorRole && <p className="text-xs text-muted-foreground">{authorRole}</p>}
                </div>
              </div>
            </header>

            {heroImage.url && (
              <div className="relative h-64 md:h-[460px] w-full rounded-3xl overflow-hidden border bg-muted shadow-sm mb-8">
                <img
                  src={heroImage.url}
                  alt={post.title || "Ảnh bài viết"}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            {post.images?.length > 1 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {post.images.slice(1).map((image) => (
                  <div key={image.id} className="h-32 rounded-xl overflow-hidden border bg-muted">
                    <img
                      src={image.image_url}
                      alt={post.title || "Ảnh bài viết"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            <section
              className="bg-muted/10 border border-border/80 rounded-2xl p-5 md:p-8 prose prose-slate max-w-none dark:prose-invert [&_img]:max-w-full [&_img]:rounded-lg [&_img]:mx-auto [&_p]:leading-relaxed [&_p]:text-base md:[&_p]:text-lg [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:text-xl [&_h3]:font-bold break-words"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </motion.article>
        )}
      </main>

      <Footer />
      <ScrollProgressButton />
    </div>
  );
}
