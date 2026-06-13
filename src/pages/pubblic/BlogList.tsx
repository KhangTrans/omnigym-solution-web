import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../../components/site/Navbar";
import { Footer } from "../../components/site/Footer";
import { ScrollProgressButton } from "../../components/site/ScrollProgressButton";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Search, Calendar, BookOpen, ArrowRight, RefreshCw, AlertTriangle, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { extractThumbnail, formatPostDate, formatViewCount, stripHtml } from "@/utils/blogUtils";

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
  const fetchBlogs = async () => {
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
  };

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
    fetchBlogs();
  }, [page, selectedCategory, sortBy, debouncedSearch]);

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

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Banner Section */}
        <div className="relative mb-12 rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-8 md:p-12 text-center shadow-xl">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20" />
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 space-y-4"
          >
            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none px-3 py-1 text-xs uppercase tracking-widest">
              OmniGym Blog
            </Badge>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Chia sẻ kiến thức & phong cách sống lành mạnh
            </h1>
            <p className="text-slate-300 max-w-2xl mx-auto text-sm md:text-base font-normal">
              Cập nhật những bí quyết luyện tập, chế độ dinh dưỡng khoa học và câu chuyện truyền cảm hứng từ các huấn luyện viên chuyên nghiệp.
            </p>
          </motion.div>
        </div>

        {/* Filter Section */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-8 pb-6 border-b border-border">
          {/* Categories Tab Layout */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${selectedCategory === cat
                    ? "bg-primary text-primary-foreground shadow-md scale-105"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search and Sort */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-grow sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm bài viết..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-card border-border"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="h-10 rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-full sm:w-44 cursor-pointer"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="popular">Phổ biến nhất</option>
            </select>
          </div>
        </div>

        {/* Main Content Area */}
        <AnimatePresence mode="wait">
          {error ? (
            /* Error State */
            <motion.div
              key="error-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center text-center py-16 px-4 bg-muted/20 border border-dashed rounded-2xl"
            >
              <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-xl font-bold mb-2">Đã xảy ra lỗi</h3>
              <p className="text-muted-foreground max-w-md mb-6">{error}</p>
              <Button onClick={fetchBlogs} className="gap-2">
                <RefreshCw className="h-4 w-4" /> Thử lại
              </Button>
            </motion.div>
          ) : loading ? (
            /* Loading State */
            <motion.div
              key="loading-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {renderSkeletons()}
            </motion.div>
          ) : posts.length === 0 ? (
            /* Empty State */
            <motion.div
              key="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center text-center py-20 px-4 bg-muted/10 border border-dashed rounded-2xl"
            >
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-bold mb-1">Không tìm thấy bài viết nào</h3>
              <p className="text-muted-foreground max-w-md mb-4">
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
            /* Blog Grid */
            <motion.div
              key="grid-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => {
                  const thumbnail = extractThumbnail(post);
                  const postCategory = post.category || "General";
                  const summary = stripHtml(post.content).slice(0, 120) + "...";
                  const createdDate = formatPostDate(post.created_at);

                  return (
                    <motion.div
                      key={post.id}
                      whileHover={{ y: -6 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card
                        className="h-full flex flex-col overflow-hidden border border-border bg-card hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                        onClick={() => navigate(`/blog/${post.id}`)}
                      >
                        {/* Cover Image */}
                        <div className="relative h-48 w-full overflow-hidden bg-muted">
                          {thumbnail ? (
                            <img
                              src={thumbnail}
                              alt={post.title}
                              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                              onError={(e) => {
                                // Fallback if image fails to load
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            /* Visual Fallback Image */
                            <div className="w-full h-full bg-gradient-to-br from-emerald-600 via-emerald-800 to-slate-900 flex flex-col justify-between p-4 text-white relative">
                              <div className="flex justify-between items-start">
                                <Badge className="bg-white/25 backdrop-blur-md text-white border-none">
                                  {postCategory}
                                </Badge>
                                <BookOpen className="h-6 w-6 text-white/40" />
                              </div>
                              <div>
                                <h4 className="font-bold text-lg line-clamp-2 leading-tight">
                                  {post.title}
                                </h4>
                              </div>
                            </div>
                          )}
                          {thumbnail && (
                            <Badge className="absolute top-3 left-3 bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow">
                              {postCategory}
                            </Badge>
                          )}
                        </div>

                        {/* Card Contents */}
                        <CardHeader className="p-4 pb-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{createdDate}</span>
                          </div>
                          <CardTitle className="text-lg font-bold line-clamp-2 leading-snug hover:text-primary transition-colors">
                            {post.title}
                          </CardTitle>
                        </CardHeader>

                        <CardContent className="p-4 pt-0 flex-grow">
                          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                            {summary}
                          </p>
                        </CardContent>

                        {/* Card Footer with Stats */}
                        <CardFooter className="p-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground bg-muted/10">
                          <span className="text-primary font-semibold flex items-center gap-1 group">
                            Đọc tiếp
                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Eye className="h-3.5 w-3.5" />
                            <span>{formatViewCount(post.view_count)}</span>
                          </span>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {/* Pagination Section */}
              {totalPages > 1 && (
                <div className="pt-6">
                  <Pagination>
                    <PaginationContent className="flex-wrap justify-center">
                      <PaginationItem>
                        <button
                          onClick={() => setPage((p) => Math.max(p - 1, 1))}
                          disabled={page === 1}
                          className="flex h-9 items-center justify-center rounded-md border border-input bg-card px-3 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 gap-1 pl-2.5 cursor-pointer"
                        >
                          <ChevronLeftIcon className="h-4 w-4" />
                          <span>Previous</span>
                        </button>
                      </PaginationItem>

                      {Array.from({ length: totalPages }).map((_, idx) => {
                        const pageNum = idx + 1;
                        return (
                          <PaginationItem key={pageNum}>
                            <button
                              onClick={() => setPage(pageNum)}
                              className={`flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium shadow-sm border cursor-pointer transition-colors ${page === pageNum
                                  ? "bg-primary text-primary-foreground border-primary hover:bg-primary/95"
                                  : "bg-card border-input hover:bg-accent hover:text-accent-foreground"
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
                          className="flex h-9 items-center justify-center rounded-md border border-input bg-card px-3 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 gap-1 pr-2.5 cursor-pointer"
                        >
                          <span>Next</span>
                          <ChevronRightIcon className="h-4 w-4" />
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

// Simple Helper Components for Pagination Icons
function ChevronLeftIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
