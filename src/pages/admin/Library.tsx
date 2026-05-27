
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search, Dumbbell, Film, Image as ImageIcon, Upload } from "lucide-react";
import {
  useExerciseLibrary,
  newExercise,
  type Exercise,
  type ExerciseMediaType,
} from "@/lib/admin-store";
import { toast } from "sonner";
import { DifficultyBar } from "@/components/site/DifficultyBar";



function detectMediaType(file: File): ExerciseMediaType {
  if (file.type.startsWith("video/")) return "video";
  if (file.type === "image/gif") return "gif";
  return "image";
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function LibraryPage() {
  const { exercises, create, update, remove } = useExerciseLibrary();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [draft, setDraft] = useState<Omit<Exercise, "id">>(stripId(newExercise()));

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return exercises;
    return exercises.filter(
      (e) =>
        e.name.toLowerCase().includes(needle) ||
        (e.description?.toLowerCase().includes(needle) ?? false),
    );
  }, [exercises, q]);

  function startCreate() {
    setEditing(null);
    setDraft(stripId(newExercise()));
    setOpen(true);
  }
  function startEdit(ex: Exercise) {
    setEditing(ex);
    setDraft(stripId(ex));
    setOpen(true);
  }
  function submit() {
    if (!draft.name.trim()) return toast.error("Name required");
    if (!draft.mediaUrl.trim()) return toast.error("Please upload a media file");
    if (editing) {
      update(editing.id, draft);
      toast.success("Exercise updated");
    } else {
      create(draft);
      toast.success("Exercise added to library");
    }
    setOpen(false);
  }

  async function handleFile(file: File | null | undefined) {
    if (!file) return;
    const MAX = 8 * 1024 * 1024;
    if (file.size > MAX) {
      return toast.error("File too large (max 8MB)");
    }
    try {
      const dataUrl = await readAsDataUrl(file);
      setDraft({ ...draft, mediaUrl: dataUrl, mediaType: detectMediaType(file) });
    } catch {
      toast.error("Could not read file");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Exercise library</h1>
          <p className="text-sm text-muted-foreground">
            {exercises.length} exercise{exercises.length === 1 ? "" : "s"} available for pack creation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search exercises…"
              className="w-64 pl-8"
            />
          </div>
          <Button size="sm" onClick={startCreate}>
            <Plus className="mr-2 h-3 w-3" />
            New exercise
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
            <Dumbbell className="h-8 w-8" />
            {exercises.length === 0
              ? "No exercises yet. Add one to make it available in packs."
              : "No exercise matches your search."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((ex) => (
            <Card key={ex.id}>
              <CardContent className="flex gap-3 p-3">
                <MediaThumb url={ex.mediaUrl} type={ex.mediaType} />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{ex.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {ex.sets} × {ex.reps} · rest {ex.rest}s
                      </div>
                    </div>
                    <div className="flex shrink-0">
                      <Button size="icon" variant="ghost" onClick={() => startEdit(ex)} aria-label="Sửa">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Remove"
                        onClick={() => {
                          remove(ex.id);
                          toast("Removed from library");
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <Badge variant="secondary" className="text-[10px] uppercase">
                      {ex.mediaType}
                    </Badge>
                    {ex.difficulty && <DifficultyBar level={ex.difficulty} />}
                  </div>
                  {ex.description && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {ex.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit exercise" : "New exercise"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Name</Label>
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. Push-Ups"
              />
            </div>
            <div>
              <Label>Media (image, gif, or video)</Label>
              <div className="mt-1 flex items-start gap-3">
                <div className="shrink-0">
                  {draft.mediaUrl ? (
                    <MediaThumb url={draft.mediaUrl} type={draft.mediaType} />
                  ) : (
                    <div className="grid h-20 w-20 place-items-center rounded-md border bg-muted text-muted-foreground">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm hover:bg-accent">
                    <Upload className="h-4 w-4" />
                    {draft.mediaUrl ? "Replace file" : "Upload file"}
                    <input
                      type="file"
                      accept="image/*,image/gif,video/*"
                      className="hidden"
                      onChange={(e) => void handleFile(e.target.files?.[0])}
                    />
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Accepts images, GIFs, or videos · max 8MB · type{" "}
                    <Badge variant="secondary" className="text-[10px] uppercase">
                      {draft.mediaType}
                    </Badge>{" "}
                    detected automatically.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <Label>Sets</Label>
                <Input
                  type="number"
                  value={draft.sets}
                  onChange={(e) => setDraft({ ...draft, sets: +e.target.value })}
                />
              </div>
              <div>
                <Label>Reps</Label>
                <Input
                  value={draft.reps}
                  onChange={(e) => setDraft({ ...draft, reps: e.target.value })}
                />
              </div>
              <div>
                <Label>Rest (s)</Label>
                <Input
                  type="number"
                  value={draft.rest}
                  onChange={(e) => setDraft({ ...draft, rest: +e.target.value })}
                />
              </div>
              <div>
                <Label>Difficulty</Label>
                <Select
                  value={String(draft.difficulty ?? 1)}
                  onValueChange={(v) =>
                    setDraft({ ...draft, difficulty: +v as 1 | 2 | 3 })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Easy</SelectItem>
                    <SelectItem value="2">Medium</SelectItem>
                    <SelectItem value="3">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={draft.description ?? ""}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="How to perform this exercise…"
              />
            </div>
            <div>
              <Label>Coaching notes</Label>
              <Textarea
                rows={2}
                value={draft.notes ?? ""}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                placeholder="Cues, common mistakes…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>{editing ? "Lưu" : "Thêm"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function stripId(ex: Exercise): Omit<Exercise, "id"> {
  const { id: _id, ...rest } = ex;
  void _id;
  return rest;
}

function MediaThumb({ url, type }: { url: string; type: ExerciseMediaType }) {
  if (!url) {
    return (
      <div className="grid h-20 w-20 shrink-0 place-items-center rounded-md border bg-muted text-muted-foreground">
        <ImageIcon className="h-4 w-4" />
      </div>
    );
  }
  if (type === "video") {
    return (
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-muted">
        <video src={url} muted loop playsInline autoPlay className="h-full w-full object-cover" />
        <Film className="absolute right-1 top-1 h-3 w-3 text-white/90" />
      </div>
    );
  }
  return (
    <img
      src={url}
      alt=""
      className="h-20 w-20 shrink-0 rounded-md border object-cover"
      onError={(e) => ((e.currentTarget.style.opacity = "0.3"))}
    />
  );
}

export default LibraryPage;
