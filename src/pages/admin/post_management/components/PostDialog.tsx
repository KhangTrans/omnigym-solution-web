import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { type Post } from "@/api/posts";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { uploadImageToCloudinary } from "@/utils/cloudinary";
import { toast } from "sonner";

export type PostDialogMode = "create" | "edit" | "view";

interface PostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: PostDialogMode;
  post: Post | null;
  onSubmit: (data: { title: string; content: string; is_published: boolean }) => Promise<void>;
  isSubmitting: boolean;
}

export function PostDialog({
  open,
  onOpenChange,
  mode,
  post,
  onSubmit,
  isSubmitting,
}: PostDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const quillRef = useRef<ReactQuill>(null);

  useEffect(() => {
    if (open) {
      if (post && (mode === "edit" || mode === "view")) {
        setTitle(post.title || "");
        setContent(post.content || "");
        setIsPublished(post.is_published);
      } else {
        setTitle("");
        setContent("");
        setIsPublished(false);
      }
    }
  }, [open, post, mode]);

  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        try {
          toast.loading("Đang tải ảnh lên...", { id: "upload-image" });
          const url = await uploadImageToCloudinary(file);
          const quill = quillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection();
            if (range) {
              quill.insertEmbed(range.index, 'image', url);
              quill.setSelection(range.index + 1);
            }
          }
          toast.success("Tải ảnh lên thành công", { id: "upload-image" });
        } catch (error) {
          console.error("Upload error:", error);
          toast.error("Không thể tải ảnh lên", { id: "upload-image" });
        }
      }
    };
  }, []);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    }
  }), [imageHandler]);

  const handleSubmit = async () => {
    if (mode === "view") {
      onOpenChange(false);
      return;
    }
    await onSubmit({ title, content, is_published: isPublished });
  };

  const getDialogTitle = () => {
    switch (mode) {
      case "create": return "Tạo bài viết mới";
      case "edit": return "Chỉnh sửa bài viết";
      case "view": return "Chi tiết bài viết";
      default: return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] w-[95vw] max-h-[95vh] overflow-y-auto font-sans">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            {getDialogTitle()}
            {mode === "view" && (
              <Badge variant={isPublished ? "outline" : "secondary"} className={isPublished ? "text-emerald-600 border-emerald-600" : ""}>
                 {isPublished ? "Công khai" : "Chờ duyệt"}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === "view" 
              ? "Thông tin chi tiết của bài viết."
              : "Điền thông tin chi tiết cho bài viết của bạn bên dưới."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title" className="text-base font-semibold">Tiêu đề</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề bài viết..."
              readOnly={mode === "view"}
              className={mode === "view" ? "bg-muted border-none font-bold text-xl px-0 focus-visible:ring-0 shadow-none h-auto" : ""}
            />
          </div>

          {mode === "view" && post && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground pb-2 border-b">
              <span>Tác giả: <span className="font-medium text-foreground">{post.user?.full_name}</span></span>
              <span>•</span>
              <span>Ngày tạo: <span className="font-medium text-foreground">{new Date(post.created_at).toLocaleString("vi-VN")}</span></span>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="content" className="text-base font-semibold">Nội dung</Label>
            {mode === "view" ? (
              <div 
                className="bg-muted/30 border rounded-md px-4 py-3 min-h-[300px] prose prose-sm max-w-none dark:prose-invert [&_img]:!max-w-full [&_img]:!h-auto [&_img]:rounded-lg break-words overflow-x-hidden"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : (
              <div className="flex flex-col gap-2">
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  modules={modules}
                  className="bg-background min-h-[350px] [&_.ql-container]:min-h-[300px] [&_.ql-editor]:text-base [&_.ql-editor_img]:!max-w-full [&_.ql-editor_img]:!h-auto"
                  placeholder="Nhập nội dung bài viết chi tiết..."
                />
              </div>
            )}
          </div>

          {mode !== "view" && (
            <div className="flex items-center space-x-2 border rounded-lg p-4 bg-muted/20">
              <Switch
                id="is-published"
                checked={isPublished}
                onCheckedChange={setIsPublished}
              />
              <div className="grid gap-1">
                <Label htmlFor="is-published" className="cursor-pointer font-medium">Công khai bài viết</Label>
                <p className="text-xs text-muted-foreground">Bật để hiển thị bài viết này trên trang chủ.</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t">
          {mode === "view" ? (
            <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Đóng
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="min-w-[120px]">
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang xử lý</>
                ) : (
                  mode === "edit" ? "Lưu thay đổi" : "Tạo bài viết"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
