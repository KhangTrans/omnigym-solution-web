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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Send, Save } from "lucide-react";
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
  onSubmit: (data: { title: string; content: string }, action: "draft" | "submit" | "publish") => Promise<void>;
  isSubmitting: boolean;
  canPublishDirectly?: boolean;
}

export function PostDialog({
  open,
  onOpenChange,
  mode,
  post,
  onSubmit,
  isSubmitting,
  canPublishDirectly = false,
}: PostDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [publishNow, setPublishNow] = useState(false);
  const quillRef = useRef<ReactQuill>(null);

  useEffect(() => {
    if (open) {
      if (post && (mode === "edit" || mode === "view")) {
        setTitle(post.title || "");
        setContent(post.content || "");
        setPublishNow(String(post.status || "").toLowerCase() === "approved" || post.is_published === true);
      } else {
        setTitle("");
        setContent("");
        setPublishNow(false);
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

  const handleSubmit = async (action: "draft" | "submit" | "publish") => {
    if (mode === "view") {
      onOpenChange(false);
      return;
    }
    await onSubmit({ title, content }, action);
  };

  const getStatusLabel = () => {
    const status = String(post?.status || "Draft").toLowerCase();
    if (status === "approved") return "Đã duyệt";
    if (status === "pending") return "Chờ duyệt";
    if (status === "rejected") return "Từ chối";
    return "Bản nháp";
  };

  const getStatusClass = () => {
    const status = String(post?.status || "Draft").toLowerCase();
    if (status === "approved") return "bg-emerald-100 text-emerald-700";
    if (status === "pending") return "bg-amber-100 text-amber-700";
    if (status === "rejected") return "bg-red-100 text-red-700";
    return "bg-slate-100 text-slate-700";
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
              <Badge variant="secondary" className={getStatusClass()}>
                 {getStatusLabel()}
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
            <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
              {canPublishDirectly
                ? "Chọn Public nếu muốn bài viết hiển thị công khai ngay, hoặc bỏ chọn để lưu không public."
                : "Lưu nháp để tiếp tục chỉnh sửa, hoặc gửi duyệt để Admin kiểm tra trước khi hiển thị công khai."}
            </div>
          )}

          {mode !== "view" && canPublishDirectly && (
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <Checkbox
                id="publish-now"
                checked={publishNow}
                onCheckedChange={(checked) => setPublishNow(Boolean(checked))}
                disabled={isSubmitting}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="publish-now" className="cursor-pointer font-semibold">
                  Public bài viết
                </Label>
                <p className="text-sm text-muted-foreground">
                  Bật lựa chọn này để bài viết được public/đã duyệt ngay sau khi lưu.
                </p>
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
              <Button variant="outline" onClick={() => handleSubmit(canPublishDirectly && publishNow ? "publish" : "draft")} disabled={isSubmitting} className="min-w-[120px]">
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang xử lý</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" /> {canPublishDirectly ? "Lưu bài viết" : "Lưu nháp"}</>
                )}
              </Button>
              {!canPublishDirectly && (
                <Button onClick={() => handleSubmit("submit")} disabled={isSubmitting} className="min-w-[140px]">
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang xử lý</>
                  ) : (
                    <><Send className="mr-2 h-4 w-4" /> Gửi duyệt</>
                  )}
                </Button>
                )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
