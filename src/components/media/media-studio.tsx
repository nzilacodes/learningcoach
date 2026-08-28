import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Mic,
  Video,
  Upload as UploadIcon,
  Loader2,
  Pause,
  Play,
  Square,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useMediaDevices,
  classifyGetUserMediaError,
  type MediaDeviceErrorReason,
} from "@/lib/media-devices";
import { createLevelMeter, type LevelMeter } from "@/lib/audio-level-meter";
import {
  startCameraPreview,
  startMicOnlyStream,
  recordStream,
  stopStreamTracks,
  capturePhoto,
  isRecordingSupported,
  type ActiveRecording,
} from "@/lib/media-recorder-engine";
import {
  uploadMedia,
  useUpdateMedia,
  formatBytes,
  formatDuration,
  type MediaAsset,
  type MediaVisibility,
} from "@/lib/media";
import { useCurriculum, type CourseRow, type UnitRow, type LessonRow } from "@/lib/learning";
import { useNotification } from "@/lib/notifications/notification-provider";

type Mode = "video" | "audio" | "photo" | "import";
type DeviceStatus = "checking" | "ready" | "denied" | "unavailable";
type RecordPhase = "idle" | "recording" | "paused";
type ResultFile = {
  blob: Blob;
  mime: string;
  filename: string;
  previewUrl: string;
  kind: "video" | "audio" | "image" | "document";
};

const NONE = "__none__";

export function MediaStudio({
  open,
  onOpenChange,
  defaultLessonId = null,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultLessonId?: string | null;
  onSaved?: (asset: MediaAsset) => void;
}) {
  const notify = useNotification();
  const { cameras, microphones } = useMediaDevices();
  const { data: curriculum } = useCurriculum();
  const updateMedia = useUpdateMedia();

  const [mode, setMode] = useState<Mode>("video");
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>("checking");
  const [errorReason, setErrorReason] = useState<MediaDeviceErrorReason | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [cameraId, setCameraId] = useState("");
  const [micId, setMicId] = useState("");
  const [resolution, setResolution] = useState({ width: 1280, height: 720 });
  const [fps, setFps] = useState(30);
  const [recordPhase, setRecordPhase] = useState<RecordPhase>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [level, setLevel] = useState(0);
  const [result, setResult] = useState<ResultFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [savedAsset, setSavedAsset] = useState<MediaAsset | null>(null);

  const [title, setTitle] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [visibility, setVisibility] = useState<MediaVisibility>("private");
  const [courseId, setCourseId] = useState(NONE);
  const [unitId, setUnitId] = useState(NONE);
  const [lessonId, setLessonId] = useState(defaultLessonId ?? NONE);

  // Switching tabs or closing the dialog tears down the active MediaStream
  // (see the cleanup in the effect below), which silently discards an
  // in-progress recording — recordingRef.current.stop() is never called, so
  // the blob never reaches handleStop()/setResult(). Gate both exits on an
  // explicit choice whenever a recording is live.
  const confirmDiscardRecording = () => {
    if (recordPhase === "idle") return true;
    return window.confirm(
      "Há uma gravação em curso. Se continuar, ela será perdida. Deseja continuar?",
    );
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingRef = useRef<ActiveRecording | null>(null);
  const meterRef = useRef<LevelMeter | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const levelRafRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);

  useEffect(() => {
    if (!open) return;
    if (mode === "import") {
      setDeviceStatus("ready");
      return;
    }
    let cancelled = false;
    setDeviceStatus("checking");
    setErrorReason(null);

    if (!isRecordingSupported()) {
      setErrorReason("unsupported");
      setDeviceStatus("unavailable");
      return;
    }

    void (async () => {
      try {
        const stream =
          mode === "audio"
            ? await startMicOnlyStream(micId || undefined)
            : await startCameraPreview({
                cameraId: cameraId || undefined,
                micId: mode === "video" ? micId || undefined : undefined,
                width: resolution.width,
                height: resolution.height,
                fps,
              });
        if (cancelled) {
          stopStreamTracks(stream);
          return;
        }
        streamRef.current = stream;
        if (videoRef.current && mode !== "audio") {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => {});
        }
        if (stream.getAudioTracks().length > 0) {
          meterRef.current = createLevelMeter(stream);
          const tick = () => {
            setLevel(meterRef.current?.getLevel() ?? 0);
            levelRafRef.current = requestAnimationFrame(tick);
          };
          tick();
        }
        setDeviceStatus("ready");
      } catch (err) {
        if (cancelled) return;
        const reason = classifyGetUserMediaError(err);
        setErrorReason(reason);
        setDeviceStatus(reason === "denied" ? "denied" : "unavailable");
      }
    })();

    return () => {
      cancelled = true;
      if (levelRafRef.current) cancelAnimationFrame(levelRafRef.current);
      meterRef.current?.stop();
      meterRef.current = null;
      if (streamRef.current) {
        stopStreamTracks(streamRef.current);
        streamRef.current = null;
      }
    };
  }, [open, mode, cameraId, micId, resolution.width, resolution.height, fps, retryKey]);

  useEffect(() => {
    if (open) return;
    if (result) URL.revokeObjectURL(result.previewUrl);
    setResult(null);
    setSavedAsset(null);
    setRecordPhase("idle");
    setElapsedMs(0);
    setTitle("");
    setTagsInput("");
    setVisibility("private");
    if (timerRef.current) clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const startTimer = () => {
    startedAtRef.current = Date.now();
    timerRef.current = setInterval(() => setElapsedMs(Date.now() - startedAtRef.current), 250);
  };
  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const handleRecordToggle = () => {
    if (!streamRef.current) return;
    recordingRef.current = recordStream(streamRef.current, mode === "video" ? "video" : "audio");
    setRecordPhase("recording");
    startTimer();
  };
  const handlePause = () => {
    recordingRef.current?.pause();
    setRecordPhase("paused");
    stopTimer();
  };
  const handleResume = () => {
    recordingRef.current?.resume();
    setRecordPhase("recording");
    startedAtRef.current = Date.now() - elapsedMs;
    timerRef.current = setInterval(() => setElapsedMs(Date.now() - startedAtRef.current), 250);
  };
  const handleStop = async () => {
    if (!recordingRef.current) return;
    stopTimer();
    const blob = await recordingRef.current.stop();
    recordingRef.current = null;
    setRecordPhase("idle");
    setElapsedMs(0);
    setResult({
      blob,
      mime: blob.type,
      filename: mode === "video" ? "gravacao-video.webm" : "gravacao-audio.webm",
      previewUrl: URL.createObjectURL(blob),
      kind: mode === "video" ? "video" : "audio",
    });
  };

  const handleCapturePhoto = async () => {
    if (!videoRef.current) return;
    const blob = await capturePhoto(videoRef.current);
    setResult({
      blob,
      mime: "image/jpeg",
      filename: "foto.jpg",
      previewUrl: URL.createObjectURL(blob),
      kind: "image",
    });
  };

  const handleImportFile = (file: File) => {
    const kind = file.type.startsWith("video/")
      ? "video"
      : file.type.startsWith("audio/")
        ? "audio"
        : file.type.startsWith("image/")
          ? "image"
          : "document";
    setResult({
      blob: file,
      mime: file.type,
      filename: file.name,
      previewUrl: URL.createObjectURL(file),
      kind,
    });
  };

  const handleRetake = () => {
    if (result) URL.revokeObjectURL(result.previewUrl);
    setResult(null);
  };

  const handleSave = async () => {
    if (!result) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const asset = await uploadMedia(result.blob, {
        filename: result.filename,
        onProgress: setUploadProgress,
      });
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const saved = await updateMedia.mutateAsync({
        id: asset.id,
        patch: {
          title: title.trim() || null,
          tags,
          visibility,
          courseId: courseId === NONE ? null : courseId,
          unitId: unitId === NONE ? null : unitId,
          lessonId: lessonId === NONE ? null : lessonId,
        },
      });
      setSavedAsset(saved);
      notify.success("Media guardada", { description: saved.title || result.filename });
      onSaved?.(saved);
    } catch (err) {
      notify.fromError(err, { dedupeKey: "media-studio:save" });
    } finally {
      setUploading(false);
    }
  };

  const courses = curriculum?.courses ?? [];
  const units = (curriculum?.units ?? []).filter(
    (u) => courseId === NONE || u.course_id === courseId,
  );
  const lessons = (curriculum?.lessons ?? []).filter(
    (l) => unitId === NONE || l.unit_id === unitId,
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !confirmDiscardRecording()) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Media Studio</DialogTitle>
        </DialogHeader>

        {savedAsset ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
            <div>
              <p className="font-display text-lg font-bold text-ink">Gravação guardada</p>
              <p className="text-sm text-muted-foreground">
                {savedAsset.title || savedAsset.original_filename} ·{" "}
                {formatBytes(savedAsset.size_bytes)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSavedAsset(null);
                  handleRetake();
                }}
              >
                Criar outra
              </Button>
              <Button onClick={() => onOpenChange(false)}>Concluir</Button>
            </div>
          </div>
        ) : result ? (
          <ReviewPanel
            result={result}
            uploading={uploading}
            uploadProgress={uploadProgress}
            title={title}
            setTitle={setTitle}
            tagsInput={tagsInput}
            setTagsInput={setTagsInput}
            visibility={visibility}
            setVisibility={setVisibility}
            courseId={courseId}
            setCourseId={setCourseId}
            unitId={unitId}
            setUnitId={setUnitId}
            lessonId={lessonId}
            setLessonId={setLessonId}
            courses={courses}
            units={units}
            lessons={lessons}
            allowRetake={mode !== "import"}
            onRetake={handleRetake}
            onSave={handleSave}
          />
        ) : (
          <>
            <Tabs
              value={mode}
              onValueChange={(v) => {
                if (!confirmDiscardRecording()) return;
                setMode(v as Mode);
              }}
            >
              <TabsList className="grid grid-cols-2 gap-1 sm:grid-cols-4 w-full">
                <TabsTrigger value="video">
                  <Video className="w-4 h-4 mr-1" /> Vídeo
                </TabsTrigger>
                <TabsTrigger value="audio">
                  <Mic className="w-4 h-4 mr-1" /> Áudio
                </TabsTrigger>
                <TabsTrigger value="photo">
                  <Camera className="w-4 h-4 mr-1" /> Câmara
                </TabsTrigger>
                <TabsTrigger value="import">
                  <UploadIcon className="w-4 h-4 mr-1" /> Importar
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {mode === "import" ? (
              <ImportPanel onSelect={handleImportFile} />
            ) : (
              <RecordingPanel
                mode={mode}
                status={deviceStatus}
                errorReason={errorReason}
                onRetry={() => setRetryKey((k) => k + 1)}
                videoRef={videoRef}
                level={level}
                cameras={cameras}
                microphones={microphones}
                cameraId={cameraId}
                setCameraId={setCameraId}
                micId={micId}
                setMicId={setMicId}
                resolution={resolution}
                setResolution={setResolution}
                fps={fps}
                setFps={setFps}
                recordPhase={recordPhase}
                elapsedMs={elapsedMs}
                onRecordToggle={handleRecordToggle}
                onPause={handlePause}
                onResume={handleResume}
                onStop={() => void handleStop()}
                onCapturePhoto={() => void handleCapturePhoto()}
              />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DeviceErrorCard({
  reason,
  onRetry,
}: {
  reason: MediaDeviceErrorReason | null;
  onRetry: () => void;
}) {
  if (reason === "unsupported") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
        <p className="font-bold text-ink">Gravação não suportada</p>
        <p className="text-sm text-muted-foreground">
          Este navegador não suporta gravação de áudio/vídeo. Tente o Chrome, Firefox ou Safari
          atualizados.
        </p>
      </div>
    );
  }
  const title =
    reason === "denied"
      ? "Permissão bloqueada"
      : reason === "not-found"
        ? "Dispositivo não encontrado"
        : "Câmara/microfone indisponível";
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center space-y-3">
      <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
      <p className="font-bold text-ink">{title}</p>
      <p className="text-sm text-muted-foreground">A câmara/microfone não pôde ser acedido.</p>
      <ul className="text-xs text-muted-foreground text-left max-w-xs mx-auto list-disc pl-4 space-y-0.5">
        <li>Permissão bloqueada no navegador</li>
        <li>Dispositivo já em uso por outra aplicação</li>
        <li>Dispositivo desconectado</li>
      </ul>
      <Button size="sm" variant="outline" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  );
}

function LevelMeterBars({ level }: { level: number }) {
  const bars = 14;
  return (
    <div className="flex items-end gap-0.5 h-8">
      {Array.from({ length: bars }).map((_, i) => {
        const threshold = (i + 1) / bars;
        const active = level >= threshold * 0.85;
        return (
          <div
            key={i}
            className={`w-1.5 rounded-full transition-colors ${active ? "bg-primary" : "bg-gray-200"}`}
            style={{ height: `${20 + i * 4}%` }}
          />
        );
      })}
    </div>
  );
}

function RecordingPanel(props: {
  mode: Exclude<Mode, "import">;
  status: DeviceStatus;
  errorReason: MediaDeviceErrorReason | null;
  onRetry: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  level: number;
  cameras: Array<{ deviceId: string; label: string }>;
  microphones: Array<{ deviceId: string; label: string }>;
  cameraId: string;
  setCameraId: (v: string) => void;
  micId: string;
  setMicId: (v: string) => void;
  resolution: { width: number; height: number };
  setResolution: (v: { width: number; height: number }) => void;
  fps: number;
  setFps: (v: number) => void;
  recordPhase: RecordPhase;
  elapsedMs: number;
  onRecordToggle: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onCapturePhoto: () => void;
}) {
  const { mode, status, errorReason, onRetry } = props;

  if (status === "checking") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-sm">A verificar permissões…</p>
      </div>
    );
  }
  if (status === "denied" || status === "unavailable") {
    return <DeviceErrorCard reason={errorReason} onRetry={onRetry} />;
  }

  const showVideo = mode === "video" || mode === "photo";

  return (
    <div className="space-y-4">
      <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center">
        {showVideo ? (
          <video ref={props.videoRef} muted playsInline className="w-full h-full object-cover" />
        ) : (
          <div className="text-white/70 flex flex-col items-center gap-2">
            <Mic className="w-10 h-10" />
            <LevelMeterBars level={props.level} />
          </div>
        )}
        {props.recordPhase !== "idle" && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-white text-xs font-bold">
            <span
              className={`w-2 h-2 rounded-full bg-red-500 ${props.recordPhase === "recording" ? "animate-pulse" : ""}`}
            />
            {props.recordPhase === "recording" ? "GRAVANDO" : "PAUSADO"} ·{" "}
            {formatDuration(props.elapsedMs / 1000, { alwaysShowHours: true })}
          </div>
        )}
      </div>

      {showVideo && props.level > 0 && (
        <div className="flex items-center gap-3">
          <Mic className="w-4 h-4 text-muted-foreground shrink-0" />
          <LevelMeterBars level={props.level} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {mode !== "audio" && (
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
              Câmara
            </label>
            <Select value={props.cameraId || undefined} onValueChange={props.setCameraId}>
              <SelectTrigger>
                <SelectValue placeholder="Predefinida" />
              </SelectTrigger>
              <SelectContent>
                {props.cameras.map((c) => (
                  <SelectItem key={c.deviceId} value={c.deviceId}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
            Microfone
          </label>
          <Select value={props.micId || undefined} onValueChange={props.setMicId}>
            <SelectTrigger>
              <SelectValue placeholder="Predefinido" />
            </SelectTrigger>
            <SelectContent>
              {props.microphones.map((m) => (
                <SelectItem key={m.deviceId} value={m.deviceId}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {mode !== "audio" && (
          <>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
                Resolução
              </label>
              <Select
                value={`${props.resolution.width}x${props.resolution.height}`}
                onValueChange={(v) => {
                  const [w, h] = v.split("x").map(Number);
                  props.setResolution({ width: w!, height: h! });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1920x1080">1920 × 1080</SelectItem>
                  <SelectItem value="1280x720">1280 × 720</SelectItem>
                  <SelectItem value="640x480">640 × 480</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
                FPS
              </label>
              <Select value={String(props.fps)} onValueChange={(v) => props.setFps(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 FPS</SelectItem>
                  <SelectItem value="60">60 FPS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 pt-2">
        {mode === "photo" ? (
          <Button size="lg" onClick={props.onCapturePhoto} className="rounded-full px-8">
            <Camera className="w-5 h-5 mr-2" /> Capturar
          </Button>
        ) : props.recordPhase === "idle" ? (
          <Button
            size="lg"
            onClick={props.onRecordToggle}
            className="rounded-full px-8 bg-red-500 hover:bg-red-600"
          >
            <span className="w-3 h-3 rounded-full bg-white mr-2" /> Gravar
          </Button>
        ) : (
          <>
            {props.recordPhase === "recording" ? (
              <Button variant="outline" size="lg" onClick={props.onPause}>
                <Pause className="w-5 h-5 mr-2" /> Pausar
              </Button>
            ) : (
              <Button variant="outline" size="lg" onClick={props.onResume}>
                <Play className="w-5 h-5 mr-2" /> Retomar
              </Button>
            )}
            <Button
              size="lg"
              onClick={props.onStop}
              className="rounded-full px-8 bg-red-500 hover:bg-red-600"
            >
              <Square className="w-5 h-5 mr-2" /> Parar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function ImportPanel({ onSelect }: { onSelect: (file: File) => void }) {
  return (
    <label className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 py-16 cursor-pointer hover:border-primary/40 transition-colors">
      <UploadIcon className="w-8 h-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Vídeo, áudio, imagem ou documento (PDF)</p>
      <input
        type="file"
        accept="video/*,audio/*,image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelect(file);
        }}
      />
      <span className="text-xs font-bold text-primary uppercase tracking-widest">
        Escolher ficheiro
      </span>
    </label>
  );
}

function ReviewPanel(props: {
  result: ResultFile;
  uploading: boolean;
  uploadProgress: number;
  title: string;
  setTitle: (v: string) => void;
  tagsInput: string;
  setTagsInput: (v: string) => void;
  visibility: MediaVisibility;
  setVisibility: (v: MediaVisibility) => void;
  courseId: string;
  setCourseId: (v: string) => void;
  unitId: string;
  setUnitId: (v: string) => void;
  lessonId: string;
  setLessonId: (v: string) => void;
  courses: CourseRow[];
  units: UnitRow[];
  lessons: LessonRow[];
  allowRetake: boolean;
  onRetake: () => void;
  onSave: () => void;
}) {
  const { result } = props;
  return (
    <div className="space-y-4">
      <div className="rounded-2xl overflow-hidden bg-black flex items-center justify-center max-h-64">
        {result.kind === "video" && (
          <video src={result.previewUrl} controls className="w-full max-h-64" />
        )}
        {result.kind === "audio" && (
          <div className="w-full p-6">
            <audio src={result.previewUrl} controls className="w-full" />
          </div>
        )}
        {result.kind === "image" && (
          <img src={result.previewUrl} alt="Pré-visualização" className="max-h-64 object-contain" />
        )}
        {result.kind === "document" && (
          <div className="p-8 text-white/70 text-sm">{result.filename}</div>
        )}
      </div>

      <div className="grid gap-3">
        <Input
          placeholder="Título (opcional)"
          value={props.title}
          onChange={(e) => props.setTitle(e.target.value)}
        />
        <Input
          placeholder="Tags separadas por vírgula"
          value={props.tagsInput}
          onChange={(e) => props.setTagsInput(e.target.value)}
        />

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Select
            value={props.courseId}
            onValueChange={(v) => {
              props.setCourseId(v);
              props.setUnitId(NONE);
              props.setLessonId(NONE);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Curso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Sem curso</SelectItem>
              {props.courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={props.unitId}
            onValueChange={(v) => {
              props.setUnitId(v);
              props.setLessonId(NONE);
            }}
            disabled={props.courseId === NONE}
          >
            <SelectTrigger>
              <SelectValue placeholder="Unidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Sem unidade</SelectItem>
              {props.units.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={props.lessonId}
            onValueChange={props.setLessonId}
            disabled={props.unitId === NONE}
          >
            <SelectTrigger>
              <SelectValue placeholder="Lição" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Sem lição</SelectItem>
              {props.lessons.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
            Quem pode visualizar?
          </label>
          <div className="flex gap-2">
            {(["private", "class", "public"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => props.setVisibility(v)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  props.visibility === v
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-muted-foreground hover:bg-gray-200"
                }`}
              >
                {v === "private" ? "Apenas eu" : v === "class" ? "Turma" : "Todos"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {props.uploading && (
        <div className="space-y-1">
          <Progress value={props.uploadProgress} />
          <p className="text-xs text-muted-foreground text-center">
            A carregar… {props.uploadProgress}%
          </p>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        {props.allowRetake && (
          <Button variant="outline" onClick={props.onRetake} disabled={props.uploading}>
            <RotateCcw className="w-4 h-4 mr-1" /> Regravar
          </Button>
        )}
        <Button onClick={props.onSave} disabled={props.uploading}>
          {props.uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
          Guardar
        </Button>
      </div>
    </div>
  );
}
