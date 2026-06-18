import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../../components/site/Navbar";
import { Footer } from "../../components/site/Footer";
import { ScrollProgressButton } from "../../components/site/ScrollProgressButton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { postsApi, type Post } from "@/api/posts";
import {
  Search,
  Calendar,
  BookOpen,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { extractThumbnail, formatPostDate, formatViewCount, stripHtml } from "@/utils/blogUtils";
import { slugify } from "@/utils/slugify";

const CATEGORIES = ["Tất cả", "Fitness", "Dinh dưỡng", "Yoga", "Cardio"];

export default function BlogList() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 12;

  // Fetch blogs from API
  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await postsApi.list({
        page,
        limit,
        search: debouncedSearch.trim() || undefined,
        category: selectedCategory === "Tất cả" ? undefined : selectedCategory,
        sortBy,
        status: "published", // Guest is only interested in published posts
      });

      // The backend returns both data/pagination and posts/meta formats
      const items = Array.isArray(response.data) ? response.data : (response.posts || []);
      const pagination = response.pagination || response.meta || { total: 0, totalPages: 1 };

      setPosts(items);
      setTotalPages(pagination.totalPages || 1);
    } catch (err: unknown) {
      console.error("Error fetching blogs:", err);
      setError("Không thể tải danh sách bài viết. Vui lòng kiểm tra kết nối mạng hoặc tải lại trang.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, selectedCategory, sortBy]);

  // Debounced search trigger: only update state, do not call API directly here.
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch data from a single effect to avoid duplicate /api/posts calls on first load/search.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- guest blog list must fetch on filter/page/search change
    void fetchBlogs();
  }, [fetchBlogs]);

  // Reset page helper
  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setPage(1);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    setPage(1);
  };

  // Render Skeleton cards
  const renderSkeletons = () => {
    return Array.from({ length: 6 }).map((_, idx) => (
      <Card key={idx} className="h-full flex flex-col overflow-hidden border border-border bg-card">
        <Skeleton className="h-48 w-full" />
        <CardHeader className="space-y-2 p-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </CardHeader>
        <CardContent className="p-4 pt-0 flex-grow">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6 mt-2" />
        </CardContent>
        <CardFooter className="p-4 border-t flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </CardFooter>
      </Card>
    ));
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <Navbar />

      <main className="flex-grow mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <article className="mb-16 grid gap-8 lg:grid-cols-2 lg:gap-12 group">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="mb-3 w-fit bg-primary/10 text-primary border-primary/20">
              OmniGym Journal
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl leading-tight">
              Train smarter. Recover better. Live stronger.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Practical guides from our coaches, dietitians, and members — no fluff, no gimmicks.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Training tips
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" /> Published insights
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> Community stories
              </span>
            </div>
            <a
              href="/blog"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-all hover:gap-3"
            >
              Read article <ArrowRight className="h-4 w-4" />
            </a>
          </motion.div>

          <a
            href={posts[0] ? `/blog/${slugify(posts[0].title || "")}-${posts[0].id}` : "/blog"}
            className="block overflow-hidden rounded-2xl border border-border bg-card shadow-card"
          >
            <div className="aspect-[16/10] overflow-hidden bg-muted">
              <img
                src={(posts[0] ? extractThumbnail(posts[0]) : null) || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80"}
                alt={posts[0]?.title || "Featured blog"}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                loading="lazy"
              />
            </div>
            <div className="space-y-3 p-5 sm:p-6">
              <Badge variant="outline" className="w-fit bg-primary/15 text-primary border-primary/20">
                {posts[0]?.category || "Featured"}
              </Badge>
              <h2 className="text-2xl font-bold tracking-tight leading-tight sm:text-3xl">
                {posts[0]?.title || "Loading featured article"}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {posts[0] ? stripHtml(posts[0].content).slice(0, 160) + "..." : "Explore the latest training, nutrition, and recovery advice."}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{posts[0]?.user?.full_name || "OmniGym Team"}</span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> {posts[0] ? formatPostDate(posts[0].created_at) : "Today"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-current text-[10px] leading-none">6</span>
                </span>
              </div>
            </div>
          </a>
        </article>

        <div className="mb-8 flex flex-col gap-6 border-b border-border pb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${selectedCategory === cat
                  ? "bg-primary text-primary-foreground shadow-md scale-105"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center md:w-auto">
            <div className="relative flex-grow sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm bài viết..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-border bg-card pl-9"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="h-10 w-full cursor-pointer rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-44"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="popular">Phổ biến nhất</option>
            </select>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {error ? (
            <motion.div
              key="error-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-4 py-16 text-center"
            >
              <AlertTriangle className="mb-4 h-12 w-12 text-destructive" />
              <h3 className="mb-2 text-xl font-bold">Đã xảy ra lỗi</h3>
              <p className="mb-6 max-w-md text-muted-foreground">{error}</p>
              <Button onClick={fetchBlogs} className="gap-2">
                <RefreshCw className="h-4 w-4" /> Thử lại
              </Button>
            </motion.div>
          ) : loading ? (
            <motion.div
              key="loading-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {renderSkeletons()}
            </motion.div>
          ) : posts.length === 0 ? (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/10 px-4 py-20 text-center"
            >
              <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-1 text-xl font-bold">Không tìm thấy bài viết nào</h3>
              <p className="mb-4 max-w-md text-muted-foreground">
                Hiện tại không có bài viết nào thuộc chủ đề này hoặc kết quả tìm kiếm của bạn trống.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("Tất cả");
                }}
              >
                Đặt lại bộ lọc
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="grid-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
              <section>
                <h2 className="mb-6 text-xl font-bold">Latest posts</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {posts.map((post) => {
                    const thumbnail = extractThumbnail(post);
                    const postCategory = post.category || "General";
                    const summary = stripHtml(post.content).slice(0, 120) + "...";
                    const authorName = post.user?.full_name || "OmniGym Team";

                    return (
                      <motion.div
                        key={post.id}
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.2 }}
                        className="h-full"
                      >
                        <div
                          onClick={() => navigate(`/blog/${slugify(post.title || "")}-${post.id}`)}
                          className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:border-primary/30 hover:shadow-card"
                        >
                          <div className="aspect-[16/10] overflow-hidden bg-muted">
                            {thumbnail ? (
                              <img
                                src={thumbnail}
                                alt={post.title}
                                loading="lazy"
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="flex h-full w-full flex-col justify-between bg-gradient-to-br from-emerald-600 via-emerald-800 to-slate-900 p-4 text-white">
                                <BookOpen className="h-6 w-6 text-white/40" />
                                <h4 className="text-lg font-bold leading-tight line-clamp-2">
                                  {post.title}
                                </h4>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-1 flex-col p-5">
                            <Badge
                              variant="outline"
                              className="mb-3 w-fit bg-primary/10 text-primary border-primary/20"
                            >
                              {postCategory}
                            </Badge>
                            <h3 className="text-lg font-semibold leading-snug transition-colors line-clamp-2 group-hover:text-primary">
                              {post.title}
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                              {summary}
                            </p>
                            <div className="mt-auto flex items-center justify-between pt-4 text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">{authorName}</span>
                              <span className="inline-flex items-center gap-1">
                                <Eye className="h-3 w-3" /> {formatViewCount(post.view_count)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>

              {totalPages > 1 && (
                <div className="pt-6">
                  <Pagination>
                    <PaginationContent className="flex-wrap justify-center">
                      <PaginationItem>
                        <button
                          onClick={() => setPage((p) => Math.max(p - 1, 1))}
                          disabled={page === 1}
                          className="flex h-9 cursor-pointer items-center justify-center gap-1 rounded-md border border-input bg-card px-3 pl-2.5 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span>Previous</span>
                        </button>
                      </PaginationItem>

                      {Array.from({ length: totalPages }).map((_, idx) => {
                        const pageNum = idx + 1;
                        return (
                          <PaginationItem key={pageNum}>
                            <button
                              onClick={() => setPage(pageNum)}
                              className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border text-sm font-medium shadow-sm transition-colors ${page === pageNum
                                ? "border-primary bg-primary text-primary-foreground hover:bg-primary/95"
                                : "border-input bg-card hover:bg-accent hover:text-accent-foreground"
                              }`}
                            >
                              {pageNum}
                            </button>
                          </PaginationItem>
                        );
                      })}

                      <PaginationItem>
                        <button
                          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                          disabled={page === totalPages}
                          className="flex h-9 cursor-pointer items-center justify-center gap-1 rounded-md border border-input bg-card px-3 pr-2.5 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                        >
                          <span>Next</span>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
      <ScrollProgressButton />
    </div>
  );
}
