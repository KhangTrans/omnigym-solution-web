import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/site/ImageUpload";
import { toast } from "sonner";
import { blogsApi, type Blog, type BlogStatus } from "@/api/blogs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";

const STATUS_OPTIONS: BlogStatus[] = ["draft", "published"];
const STATUS_LABEL: Record<BlogStatus, string> = {
  draft: "Draft",
  published: "Published",
};
const TITLE_MIN = 10;
const TITLE_MAX = 200;
const CONTENT_MIN = 50;
const FALLBACK_COVER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='180' viewBox='0 0 320 180'><rect width='320' height='180' fill='%23e2e8f0'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2364748b' font-family='Arial, sans-serif' font-size='16'>No Image</text></svg>";

type BlogDraft = {
  title: string;
  content: string;
  coverUrl: string;
  category: string;
  tags: string;
  status: BlogStatus;
  author: string;
};

const emptyDraft: BlogDraft = {
  title: "",
  content: "",
  coverUrl: "",
  category: "",
  tags: "",
  status: "draft",
  author: "OmniGym Staff",
};

const parseTags = (value: string) =>
  value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

const validateDraft = (draft: BlogDraft) => {
  const errors: string[] = [];
  const title = draft.title.trim();
  const category = draft.category.trim();
  const content = draft.content.trim();

  if (!title) {
    errors.push("Title required");
  } else if (title.length < TITLE_MIN || title.length > TITLE_MAX) {
    errors.push(`Title must be ${TITLE_MIN}-${TITLE_MAX} characters`);
  }

  if (!category) errors.push("Category required");

  if (!content) {
    errors.push("Content required");
  } else if (content.length < CONTENT_MIN) {
    errors.push(`Content must be at least ${CONTENT_MIN} characters`);
  }

  if (!draft.coverUrl.trim()) errors.push("Cover image required");

  return errors;
};

const excerpt = (text: string) => {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= 120) return clean;
  return `${clean.slice(0, 120)}...`;
};

function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<BlogDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Blog | null>(null);
  const validationErrors = useMemo(() => validateDraft(draft), [draft]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return blogs;
    return blogs.filter((b) => {
      const tags = b.tags.join(" ");
      return [b.title, b.category, b.author, b.status, tags, b.content]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [blogs, query]);

  const publishedCount = blogs.filter((b) => b.status === "published").length;

  const loadBlogs = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await blogsApi.list();
      setBlogs(data);
    } catch (error) {
      console.error("Failed to load blogs", error);
      setLoadError("Failed to load blogs");
      toast.error("Failed to load blogs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadBlogs();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const startEdit = (blog: Blog) => {
    setEditing(blog);
    setDraft({
      title: blog.title,
      content: blog.content,
      coverUrl: blog.coverUrl ?? "",
      category: blog.category,
      tags: blog.tags.join(", "),
      status: blog.status,
      author: blog.author || "OmniGym Staff",
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    setDraft(emptyDraft);
  };

  const handleDelete = async (blog: Blog) => {
    if (!window.confirm(`Delete "${blog.title}"?`)) return;
    try {
      await blogsApi.remove(blog.id);
      setBlogs((prev) => prev.filter((b) => b.id !== blog.id));
      toast("Blog deleted");
    } catch (error) {
      console.error("Failed to delete blog", error);
      toast.error("Failed to delete blog");
    }
  };

  const submit = async () => {
    if (validationErrors.length > 0) {
      return toast.error(validationErrors[0]);
    }

    const tagsValue = draft.tags.trim();
    const authorValue = draft.author.trim();
    const coverUrl = draft.coverUrl.trim();

    try {
      setSaving(true);
      const payload = {
        title: draft.title.trim(),
        content: draft.content.trim(),
        cover_url: coverUrl,
        category: draft.category.trim(),
        status: draft.status,
        ...(tagsValue ? { tags: parseTags(tagsValue) } : {}),
        ...(authorValue ? { author: authorValue } : {}),
      };

      if (editing) {
        const updated = await blogsApi.update(editing.id, payload);
        setBlogs((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
        toast.success("Blog updated");
      } else {
        const created = await blogsApi.create(payload);
        setBlogs((prev) => [created, ...prev]);
        toast.success(draft.status === "published" ? "Blog published" : "Blog saved as draft");
      }

      setDraft(emptyDraft);
      setEditing(null);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err?.response?.data?.message || "Failed to save blog";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blogs</h1>
          <p className="text-sm text-muted-foreground">
            {blogs.length} posts · {publishedCount} published
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All blog posts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search by title, category, tag..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="rounded-md bg-card shadow-[0_2px_10px_rgba(15,23,42,0.10)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Post</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="hidden lg:table-cell">Tags</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Updated</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      Loading blogs...
                    </TableCell>
                  </TableRow>
                ) : loadError ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-destructive">
                      {loadError}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {b.coverUrl ? (
                            <img
                              src={b.coverUrl}
                              alt={b.title}
                              className="h-12 w-16 rounded object-cover shadow-[0_2px_8px_rgba(15,23,42,0.10)]"
                              loading="lazy"
                            />
                          ) : (
                            <img
                              src={FALLBACK_COVER}
                              alt="No cover"
                              className="h-12 w-16 rounded object-cover shadow-[0_2px_8px_rgba(15,23,42,0.10)]"
                              loading="lazy"
                            />
                          )}
                          <div className="min-w-0">
                            <div className="font-medium line-clamp-1">{b.title}</div>
                            <div className="text-xs text-muted-foreground line-clamp-2">
                              {excerpt(b.content)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{b.category}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {b.tags.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {b.tags.map((t) => (
                              <Badge key={t} variant="secondary" className="text-[10px] uppercase">
                                {t}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={b.status === "published" ? "default" : "secondary"}>
                          {STATUS_LABEL[b.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground tabular-nums">
                        {b.updatedAt ? b.updatedAt.slice(0, 10) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => startEdit(b)} aria-label="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(b)} aria-label="Delete">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {!loading && !loadError && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      No blog posts found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {editing ? "Edit blog post" : "New blog post"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="e.g. 5 ways to stay consistent"
            />
          </div>
          <ImageUpload
            label="Cover image"
            required
            value={draft.coverUrl}
            onChange={(v) => setDraft({ ...draft, coverUrl: v })}
            previewClassName="h-20 w-32 rounded-md"
            hint="PNG, JPG or GIF · max 4MB"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Category</Label>
              <Input
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                placeholder="Training, Nutrition, Recovery"
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={draft.status}
                onValueChange={(v) => setDraft({ ...draft, status: v as BlogStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Tags</Label>
            <Input
              value={draft.tags}
              onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
              placeholder="strength, mobility, habit"
            />
            <p className="text-xs text-muted-foreground">Separate tags with commas.</p>
          </div>
          <div>
            <Label>Author</Label>
            <Input
              value={draft.author}
              onChange={(e) => setDraft({ ...draft, author: e.target.value })}
              placeholder="OmniGym Staff"
            />
          </div>
          <div>
            <Label>Content</Label>
            <Textarea
              rows={8}
              value={draft.content}
              onChange={(e) => setDraft({ ...draft, content: e.target.value })}
              placeholder="Write the blog content here..."
            />
          </div>
          <div className="flex justify-end">
            <div className="flex items-center gap-2">
              {editing && (
                <Button variant="ghost" onClick={cancelEdit} disabled={saving}>
                  Cancel
                </Button>
              )}
              <Button onClick={submit} disabled={saving}>
                {saving ? "Saving..." : editing ? "Save" : "Create"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default BlogsPage;
