import { Link } from "react-router-dom";
import { useMemo, useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Eye, Film, Image as ImageIcon, GripVertical, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useAdminPacks,
  newExercise,
  useExerciseLibrary,
  type ExercisePack,
  type Exercise,
  type ExerciseMediaType,
} from "@/lib/admin-store";
import { toast } from "sonner";
import { DifficultyBar } from "@/components/site/DifficultyBar";
import { ImageUpload } from "@/components/site/ImageUpload";



const CATEGORIES: ExercisePack["category"][] = ["Strength", "Cardio", "Mobility", "HIIT", "Recovery"];
const LEVELS: ExercisePack["level"][] = ["Beginner", "Inter.", "Advanced"];
const emptyPack: Omit<ExercisePack, "id"> = {
  name: "",
  description: "",
  category: "Strength",
  level: "Beginner",
  durationMin: 20,
  coverUrl: "",
  publishedToDashboard: false,
  exercises: [],
};

function ExercisesPage() {
  const { packs, create, update, remove, togglePublish } = useAdminPacks();
  const { exercises: libraryExercises } = useExerciseLibrary();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ExercisePack | null>(null);
  const [draft, setDraft] = useState<Omit<ExercisePack, "id">>(emptyPack);
  const [previewing, setPreviewing] = useState<ExercisePack | null>(null);

  const stats = useMemo(() => {
    const published = packs.filter((p) => p.publishedToDashboard).length;
    const totalEx = packs.reduce((s, p) => s + p.exercises.length, 0);
    return { published, totalEx };
  }, [packs]);

  function startCreate() {
    setEditing(null);
    setDraft({ ...emptyPack, exercises: [newExercise()] });
    setOpen(true);
  }
  function startEdit(p: ExercisePack) {
    setEditing(p);
    const { id: _id, ...rest } = p;
    void _id;
    setDraft({ ...rest, exercises: rest.exercises.map((e) => ({ ...e })) });
    setOpen(true);
  }
  function patchExercise(idx: number, patch: Partial<Exercise>) {
    setDraft({
      ...draft,
      exercises: draft.exercises.map((e, i) => (i === idx ? { ...e, ...patch } : e)),
    });
  }
  function addExercise() {
    setDraft({ ...draft, exercises: [...draft.exercises, newExercise()] });
  }
  function removeExercise(idx: number) {
    setDraft({ ...draft, exercises: draft.exercises.filter((_, i) => i !== idx) });
  }
  function moveExercise(idx: number, dir: -1 | 1) {
    const next = [...draft.exercises];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setDraft({ ...draft, exercises: next });
  }
  function submit() {
    if (!draft.name.trim()) return toast.error("Pack name required");
    if (draft.exercises.length === 0) return toast.error("Add at least one exercise");
    if (draft.exercises.some((e) => !e.name.trim() || !e.mediaUrl.trim()))
      return toast.error("Every exercise needs a name and media URL");
    if (editing) {
      update(editing.id, draft);
      toast.success("Pack updated");
    } else {
      create(draft);
      toast.success("Pack created");
    }
    setOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Exercise packs</h1>
          <p className="text-sm text-muted-foreground">
            {packs.length} packs · {stats.totalEx} exercises · {stats.published} live on dashboard
          </p>
        </div>
        <Button size="sm" onClick={startCreate}>
          <Plus className="mr-2 h-3 w-3" />
          New pack
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {packs.map((p) => (
          <Card key={p.id} className="overflow-hidden">
            {p.coverUrl ? (
              <div className="aspect-video w-full overflow-hidden bg-muted">
                <img src={p.coverUrl} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
              </div>
            ) : (
              <div className="aspect-video w-full bg-muted" />
            )}
            <CardHeader className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{p.name}</CardTitle>
                <Badge variant={p.publishedToDashboard ? "default" : "secondary"}>
                  {p.publishedToDashboard ? "Live" : "Draft"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch
                    checked={p.publishedToDashboard}
                    onCheckedChange={() => {
                      togglePublish(p.id);
                      toast(p.publishedToDashboard ? "Hidden from dashboard" : "Published to dashboard");
                    }}
                  />
                  Show on dashboard
                </div>
                <div className="flex">
                  <Button size="icon" variant="ghost" asChild aria-label="Start workout">
                    <Link to={`/packs/${p.id}`}>
                      <Play className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setPreviewing(p)} aria-label="Preview">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => startEdit(p)} aria-label="Sửa">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      remove(p.id);
                      toast("Pack removed");
                    }}
                    aria-label="Xóa"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {packs.length === 0 && (
          <Card className="sm:col-span-2 xl:col-span-3">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No exercise packs yet. Create one to publish to the member dashboard.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create / edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto admin-scrollbar">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit pack" : "New pack"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Name</Label>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <ImageUpload
              label="Cover image"
              value={draft.coverUrl ?? ""}
              onChange={(v) => setDraft({ ...draft, coverUrl: v })}
              previewClassName="h-20 w-32 rounded-md"
            />
            <div>
              <Label>Description</Label>
              <Textarea
                rows={2}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <Label>Category</Label>
                <Select
                  value={draft.category}
                  onValueChange={(v) => setDraft({ ...draft, category: v as ExercisePack["category"] })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Level</Label>
                <Select
                  value={draft.level}
                  onValueChange={(v) => setDraft({ ...draft, level: v as ExercisePack["level"] })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Duration (min)</Label>
                <Input
                  type="number"
                  value={draft.durationMin}
                  onChange={(e) => setDraft({ ...draft, durationMin: +e.target.value })}
                />
              </div>
              <div className="flex items-end gap-2">
                <Switch
                  checked={draft.publishedToDashboard}
                  onCheckedChange={(v) => setDraft({ ...draft, publishedToDashboard: v })}
                />
                <Label className="mb-2">Publish to dashboard</Label>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Exercises ({draft.exercises.length})</Label>
                <Button size="sm" variant="outline" onClick={addExercise}>
                  <Plus className="mr-1 h-3 w-3" />Add exercise
                </Button>
              </div>
              <div className="space-y-3">
                {draft.exercises.map((ex, idx) => (
                  <div key={ex.id} className="rounded-xl bg-card shadow-[0_2px_12px_rgba(15,23,42,0.08)] p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center pt-1 text-muted-foreground">
                        <button
                          type="button"
                          className="hover:text-foreground"
                          onClick={() => moveExercise(idx, -1)}
                          aria-label="Move up"
                        >
                          ▲
                        </button>
                        <GripVertical className="my-1 h-4 w-4" />
                        <button
                          type="button"
                          className="hover:text-foreground"
                          onClick={() => moveExercise(idx, 1)}
                          aria-label="Move down"
                        >
                          ▼
                        </button>
                      </div>
                      <div className="grid flex-1 gap-2 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                          <Label className="text-xs">Name</Label>
                          <ExerciseNameSearch
                            value={ex.name}
                            library={libraryExercises}
                            onChange={(name) => patchExercise(idx, { name })}
                            onPick={(picked) =>
                              patchExercise(idx, {
                                name: picked.name,
                                mediaUrl: picked.mediaUrl,
                                mediaType: picked.mediaType,
                                sets: picked.sets,
                                reps: picked.reps,
                                rest: picked.rest,
                                notes: picked.notes,
                                description: picked.description,
                                difficulty: picked.difficulty,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Sets</Label>
                          <Input
                            type="number"
                            value={ex.sets}
                            onChange={(e) => patchExercise(idx, { sets: +e.target.value })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Reps</Label>
                          <Input
                            value={ex.reps}
                            onChange={(e) => patchExercise(idx, { reps: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Rest (s)</Label>
                          <Input
                            type="number"
                            value={ex.rest}
                            onChange={(e) => patchExercise(idx, { rest: +e.target.value })}
                          />
                        </div>
                        <div className="sm:col-span-3 flex items-end">
                          <Input
                            placeholder="Notes (optional)"
                            value={ex.notes ?? ""}
                            onChange={(e) => patchExercise(idx, { notes: e.target.value })}
                          />
                        </div>
                        <div className="sm:col-span-6">
                          <Label className="text-xs">Description</Label>
                          <Textarea
                            rows={2}
                            placeholder="Explain how to perform the exercise…"
                            value={ex.description ?? ""}
                            onChange={(e) => patchExercise(idx, { description: e.target.value })}
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <Label className="text-xs">Difficulty</Label>
                          <Select
                            value={String(ex.difficulty ?? 1)}
                            onValueChange={(v) =>
                              patchExercise(idx, { difficulty: Number(v) as 1 | 2 | 3 })
                            }
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Easy</SelectItem>
                              <SelectItem value="2">Medium</SelectItem>
                              <SelectItem value="3">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="sm:col-span-3 flex items-end">
                          <DifficultyBar level={(ex.difficulty ?? 1) as 1 | 2 | 3} />
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        {ex.mediaUrl ? (
                          <MediaThumb url={ex.mediaUrl} type={ex.mediaType} />
                        ) : (
                          <div className="grid h-16 w-16 place-items-center rounded-md bg-muted shadow-[0_2px_10px_rgba(15,23,42,0.10)] text-muted-foreground">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => removeExercise(idx)} aria-label="Remove">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>{editing ? "Lưu" : "Tạo mới"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog open={!!previewing} onOpenChange={(o) => !o && setPreviewing(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto admin-scrollbar">
          <DialogHeader>
            <DialogTitle>{previewing?.name}</DialogTitle>
          </DialogHeader>
          {previewing && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{previewing.description}</p>
              <div className="space-y-3">
                {previewing.exercises.map((ex, i) => (
                  <div key={ex.id} className="flex gap-3 rounded-xl bg-card shadow-[0_2px_12px_rgba(15,23,42,0.08)] p-3">
                    <MediaThumb url={ex.mediaUrl} type={ex.mediaType} large />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground tabular-nums">#{i + 1}</span>
                        <h4 className="font-medium">{ex.name}</h4>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {ex.sets} × {ex.reps} · rest {ex.rest}s
                      </div>
                      <DifficultyBar level={(ex.difficulty ?? 1) as 1 | 2 | 3} className="mt-2" />
                      {ex.description && (
                        <p className="mt-2 text-sm text-foreground/80">{ex.description}</p>
                      )}
                      {ex.notes && <p className="mt-1 text-xs text-muted-foreground">{ex.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MediaThumb({ url, type, large = false }: { url: string; type: ExerciseMediaType; large?: boolean }) {
  const size = large ? "h-24 w-24" : "h-16 w-16";
  if (type === "video") {
    return (
      <div className={`relative ${size} overflow-hidden rounded-md bg-muted shadow-[0_2px_10px_rgba(15,23,42,0.10)]`}>
        <video src={url} muted loop playsInline autoPlay className="h-full w-full object-cover" />
        <Film className="absolute right-1 top-1 h-3 w-3 text-white drop-shadow" />
      </div>
    );
  }
  return (
    <img
      src={url}
      alt=""
      loading="lazy"
      className={`${size} rounded-xl bg-card shadow-[0_2px_12px_rgba(15,23,42,0.08)] object-cover`}
      onError={(e) => ((e.currentTarget.style.opacity = "0.3"))}
    />
  );
}

function ExerciseNameSearch({
  value,
  library,
  onChange,
  onPick,
}: {
  value: string;
  library: Exercise[];
  onChange: (name: string) => void;
  onPick: (ex: Exercise) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const q = value.trim().toLowerCase();
  const matches = useMemo(() => {
    const list = q
      ? library.filter((e) => e.name.toLowerCase().includes(q))
      : library;
    return list.slice(0, 8);
  }, [library, q]);

  return (
    <div ref={wrapRef} className="relative">
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search library or type a new name…"
      />
      {open && matches.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto admin-scrollbar rounded-md bg-popover shadow-[0_2px_10px_rgba(15,23,42,0.10)] p-1">
          {matches.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onPick(ex);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-sm p-1.5 text-left text-sm hover:bg-accent"
            >
              {ex.mediaUrl ? (
                <MediaThumb url={ex.mediaUrl} type={ex.mediaType} />
              ) : (
                <div className="grid h-16 w-16 place-items-center rounded-md bg-muted shadow-[0_2px_10px_rgba(15,23,42,0.10)] text-muted-foreground">
                  <ImageIcon className="h-4 w-4" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{ex.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {ex.sets} × {ex.reps} · rest {ex.rest}s
                </div>
                {ex.description && (
                  <div className="line-clamp-1 text-xs text-muted-foreground">
                    {ex.description}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ExercisesPage;
