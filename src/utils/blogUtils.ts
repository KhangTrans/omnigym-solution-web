import type { Post } from "@/api/posts";

export type HeroImageSource = "images" | "content" | null;

export type HeroImage = {
  url: string | null;
  source: HeroImageSource;
};

export function getPostHeroImage(post: Post): HeroImage {
  if (post.images?.[0]?.image_url) {
    return { url: post.images[0].image_url, source: "images" };
  }

  const match = (post.content || "").match(/<img[^>]+src=["']([^"']+)["']/i);
  return { url: match?.[1] || null, source: match?.[1] ? "content" : null };
}

export function extractThumbnail(post: Post) {
  return getPostHeroImage(post).url;
}

export function removeFirstImageFromContent(html?: string) {
  return (html || "").replace(/<p>\s*<img[^>]*>\s*<\/p>|<img[^>]*>/i, "");
}

export function stripHtml(html?: string) {
  return (html || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim();
}

export function formatViewCount(count?: number): string {
  const n = count ?? 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${n}`;
}

export function getAuthUser(): { role?: string } | null {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function formatPostDate(date?: string | Date) {
  if (!date) return "Không rõ ngày đăng";

  return new Date(date).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
