import { useEffect, useState } from "react";
import { Loader2, Trash2, RotateCcw, XCircle, FileText } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useMediaAsset,
  useUpdateMedia,
  useDeleteMedia,
  useRestoreMedia,
  usePurgeMedia,
  mediaStreamUrl,
  mediaThumbnailUrl,
  formatBytes,
  formatDuration,
  type MediaVisibility,
} from "@/lib/media";
import { useCurriculum } from "@/lib/learning";
import { useNotification } from "@/lib/notifications/notification-provider";

const NONE = "__none__";

const STATUS_LABEL: Record<string, string> = {
  uploading: "A carregar",
  processing: "A processar",
  ready: "Pronto",
  failed: "Falhou",
};

export function MediaDetailSheet({
  assetId,
  onOpenChange,
}: {
  assetId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const notify = useNotification();
  const { data: asset, isLoading } = useMediaAsset(assetId ?? undefined);
  const { data: curriculum } = useCurriculum();
  const updateMedia = useUpdateMedia();
  const deleteMedia = useDeleteMedia();
  const restoreMedia = useRestoreMedia();
  const purgeMedia = usePurgeMedia();

  const [title, setTitle] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [visibility, setVisibility] = useState<MediaVisibility>("private");
  const [courseId, setCourseId] = useState(NONE);
  const [unitId, setUnitId] = useState(NONE);
  const [lessonId, setLessonId] = useState(NONE);

  useEffect(() => {
    if (!asset) return;
    setTitle(asset.title ?? "");
    setTagsInput(asset.tags.join(", "));
    setVisibility(asset.visibility);
    setCourseId(asset.course_id ?? NONE);
    setUnitId(asset.unit_id ?? NONE);
    setLessonId(asset.lesson_id ?? NONE);
  }, [asset]);

  const courses = curriculum?.courses ?? [];
  const units = (curriculum?.units ?? []).filter(
    (u) => courseId === NONE || u.course_id === courseId,
  );
  const lessons = (curriculum?.lessons ?? []).filter(
    (l) => unitId === NONE || l.unit_id === unitId,
  );

  const handleSave = async () => {
    if (!asset) return;
    try {
      await updateMedia.mutateAsync({
        id: asset.id,
        patch: {
          title: title.trim() || null,
          tags: tagsInput
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          visibility,
          courseId: courseId === NONE ? null : courseId,
          unitId: unitId === NONE ? null : unitId,
          lessonId: lessonId === NONE ? null : lessonId,
        },
      });
      notify.success("Alterações guardadas");
    } catch (err) {
      notify.fromError(err, { dedupeKey: "media-detail:save" });
    }
  };

  const handleDelete = async () => {
    if (!asset) return;
    try {
      await deleteMedia.mutateAsync(asset.id);
      notify.success("Enviado para a lixeira");
      onOpenChange(false);
    } catch (err) {
      notify.fromError(err, { dedupeKey: "media-detail:delete" });
    }
  };

  const handleRestore = async () => {
    if (!asset) return;
    try {
      await restoreMedia.mutateAsync(asset.id);
      notify.success("Restaurado");
    } catch (err) {
      notify.fromError(err, { dedupeKey: "media-detail:restore" });
    }
  };

  const handlePurge = async () => {
    if (!asset) return;
    if (!window.confirm("Apagar definitivamente? Esta ação não pode ser revertida.")) return;
    try {
      await purgeMedia.mutateAsync(asset.id);
      notify.success("Apagado definitivamente");
      onOpenChange(false);
    } catch (err) {
      notify.fromError(err, { dedupeKey: "media-detail:purge" });
    }
  };

  const trashed = Boolean(asset?.deleted_at);

  return (
    <Sheet open={assetId !== null} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display">
            {asset?.title || asset?.original_filename || "Media"}
          </SheetTitle>
        </SheetHeader>

        {isLoading || !asset ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="mt-4 space-y-5">
            <div className="rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center min-h-32">
              {asset.status === "ready" && asset.media_type === "video" && (
                <video src={mediaStreamUrl(asset.id)} controls className="w-full max-h-48" />
              )}
              {asset.status === "ready" && asset.media_type === "audio" && (
                <div className="w-full p-4">
                  <audio src={mediaStreamUrl(asset.id)} controls className="w-full" />
                </div>
              )}
              {asset.status === "ready" && asset.media_type === "image" && (
                <img
                  src={mediaStreamUrl(asset.id)}
                  alt={asset.title ?? ""}
                  className="max-h-48 object-contain"
                />
              )}
              {asset.media_type === "document" && (
                <a
                  href={mediaStreamUrl(asset.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center gap-2 py-8 text-gray-500 text-sm"
                >
                  <FileText className="w-8 h-8" /> Abrir documento
                </a>
              )}
              {asset.status !== "ready" && asset.media_type !== "document" && (
                <div className="flex flex-col items-center gap-2 py-8 text-gray-400 text-sm">
                  {asset.status === "failed" ? (
                    <XCircle className="w-6 h-6 text-red-400" />
                  ) : (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  )}
                  {asset.status === "failed"
                    ? asset.processing_error || "Processamento falhou"
                    : "A processar…"}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <Badge variant={asset.status === "failed" ? "destructive" : "secondary"}>
                {STATUS_LABEL[asset.status]}
              </Badge>
              <span>{formatBytes(asset.size_bytes)}</span>
              {asset.duration_seconds && <span>· {formatDuration(asset.duration_seconds)}</span>}
              {asset.width && asset.height && (
                <span>
                  · {asset.width}×{asset.height}
                </span>
              )}
            </div>

            {trashed ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">Este item está na lixeira.</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => void handleRestore()}
                    disabled={restoreMedia.isPending}
                  >
                    <RotateCcw className="w-4 h-4 mr-1" /> Restaurar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => void handlePurge()}
                    disabled={purgeMedia.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Apagar definitivamente
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Input
                  placeholder="Título"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <Input
                  placeholder="Tags separadas por vírgula"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                />

                <div className="grid grid-cols-1 gap-2">
                  <Select
                    value={courseId}
                    onValueChange={(v) => {
                      setCourseId(v);
                      setUnitId(NONE);
                      setLessonId(NONE);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Curso" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Sem curso</SelectItem>
                      {courses.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={unitId}
                    onValueChange={(v) => {
                      setUnitId(v);
                      setLessonId(NONE);
                    }}
                    disabled={courseId === NONE}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Sem unidade</SelectItem>
                      {units.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={lessonId} onValueChange={setLessonId} disabled={unitId === NONE}>
                    <SelectTrigger>
                      <SelectValue placeholder="Lição" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Sem lição</SelectItem>
                      {lessons.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1 block">
                    Quem pode visualizar?
                  </label>
                  <div className="flex gap-2">
                    {(["private", "class", "public"] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setVisibility(v)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                          visibility === v
                            ? "bg-[var(--primary)] text-white"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {v === "private" ? "Apenas eu" : v === "class" ? "Turma" : "Todos"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <Button
                    variant="outline"
                    onClick={() => void handleDelete()}
                    disabled={deleteMedia.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Lixeira
                  </Button>
                  <Button onClick={() => void handleSave()} disabled={updateMedia.isPending}>
                    {updateMedia.isPending ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : null}
                    Guardar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
