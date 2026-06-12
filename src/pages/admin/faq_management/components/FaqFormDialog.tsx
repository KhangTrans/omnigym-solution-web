import { useState, useEffect } from "react";
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
import { Loader2, Save } from "lucide-react";
import { cn } from "@/utils/cn";

export type FaqStatus = "Published" | "Draft";

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  status: FaqStatus;
  views: number;
  author: {
    name: string;
    email: string;
  };
  updatedAt: string;
}

interface FaqFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "update";
  faq: FaqItem | null;
  categories: string[];
  onSubmit: (payload: { title: string; content: string; category: string; is_published: boolean }) => Promise<void>;
  isSubmitting: boolean;
}

export function FaqFormDialog({
  open,
  onOpenChange,
  mode,
  faq,
  categories,
  onSubmit,
  isSubmitting,
}: FaqFormDialogProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<FaqStatus>("Draft");
  const [formMessage, setFormMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    question: "",
    answer: "",
    category: "",
  });

  const isUpdateMode = mode === "update";

  useEffect(() => {
    if (open) {
      if (faq && isUpdateMode) {
        setQuestion(faq.question);
        setAnswer(faq.answer);
        setCategory(faq.category);
        setStatus(faq.status);
      } else {
        setQuestion("");
        setAnswer("");
        setCategory("");
        setStatus("Draft");
      }
      setFormMessage("");
      setFieldErrors({ question: "", answer: "", category: "" });
    }
  }, [open, faq, mode, isUpdateMode]);

  const handleSubmit = async () => {
    const errors = {
      question: question.trim() ? "" : "Vui lòng nhập câu hỏi.",
      answer: answer.trim() ? "" : "Vui lòng nhập câu trả lời.",
      category: category.trim() ? "" : "Vui lòng nhập hoặc chọn danh mục.",
    };

    setFieldErrors(errors);

    if (errors.question || errors.answer || errors.category) {
      return;
    }

    setFormMessage("");

    try {
      await onSubmit({
        title: question.trim(),
        content: answer.trim(),
        category: category.trim(),
        is_published: status === "Published",
      });
      onOpenChange(false);
    } catch (error: any) {
      const msg = error.response?.data?.message || (isUpdateMode ? "Không thể cập nhật FAQ." : "Không thể tạo FAQ.");
      setFormMessage(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[768px] w-[95vw] max-h-[95vh] overflow-y-auto admin-scrollbar font-sans rounded-3xl p-0">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b">
          <DialogHeader>
            <div className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary w-fit">
              {isUpdateMode ? "Cập nhật nội dung" : "Nội dung mới"}
            </div>
            <DialogTitle className="mt-3 text-xl font-bold text-slate-900">
              {isUpdateMode ? "Cập nhật FAQ" : "Tạo FAQ mới"}
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              {isUpdateMode
                ? "Chỉnh sửa câu hỏi, câu trả lời, danh mục và trạng thái xuất bản."
                : "Nhập nội dung câu hỏi thường gặp để hiển thị trong hệ thống."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-5 p-6">
          {formMessage && (
            <div
              className={cn(
                "rounded-xl border px-4 py-3 text-sm font-medium",
                formMessage.includes("thành công")
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700",
              )}
            >
              {formMessage}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2 lg:col-span-2">
              <Label className="text-sm font-semibold" htmlFor="faq-question">
                Câu hỏi
              </Label>
              <Input
                id="faq-question"
                type="text"
                value={question}
                onChange={(e) => {
                  setQuestion(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, question: "" }));
                }}
                placeholder="Nhập câu hỏi FAQ..."
                className={cn(
                  "h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20",
                  fieldErrors.question ? "border-red-300" : "border-border",
                )}
              />
              {fieldErrors.question && <p className="text-xs font-medium text-red-600">{fieldErrors.question}</p>}
            </div>

            <div className="space-y-2 lg:col-span-2">
              <Label className="text-sm font-semibold" htmlFor="faq-answer">
                Câu trả lời
              </Label>
              <Textarea
                id="faq-answer"
                rows={7}
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, answer: "" }));
                }}
                placeholder="Nhập nội dung câu trả lời..."
                className={cn(
                  "w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20",
                  fieldErrors.answer ? "border-red-300" : "border-border",
                )}
              />
              {fieldErrors.answer && <p className="text-xs font-medium text-red-600">{fieldErrors.answer}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold" htmlFor="faq-category">
                Danh mục
              </Label>
              <Input
                id="faq-category"
                type="text"
                list="faq-dialog-category-options"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, category: "" }));
                }}
                placeholder="Nhập hoặc chọn danh mục FAQ..."
                className={cn(
                  "h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20",
                  fieldErrors.category ? "border-red-300" : "border-border",
                )}
              />
              {fieldErrors.category && <p className="text-xs font-medium text-red-600">{fieldErrors.category}</p>}
              <datalist id="faq-dialog-category-options">
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold" htmlFor="faq-status">
                Trạng thái
              </Label>
              <select
                id="faq-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as FaqStatus)}
                className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="Draft">Bản nháp</option>
                <option value="Published">Đã xuất bản</option>
              </select>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-wrap justify-end gap-3 border-t p-6 bg-slate-50/50">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="h-10 rounded-xl"
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:bg-primary/90"
          >
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> {isUpdateMode ? "Đang cập nhật..." : "Đang tạo..."}</>
            ) : (
              <><Save className="h-4 w-4" /> {isUpdateMode ? "Lưu cập nhật" : "Tạo mới"}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
