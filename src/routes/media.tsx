import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Upload as UploadIcon,
  FolderOpen,
  Film,
  Mic,
  Image as ImageIcon,
  FileText,
  Loader2,
  Trash2,
  Play,
  XCircle,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { VideosSidebar, VideosMobileNav } from "@/components/videos/videos-sidebar";
import {
  HeaderActionLinks,
  MobileAvatarMenu,
  DesktopAvatarLink,
} from "@/components/mobile-avatar-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/lib/auth";
import {
  useMediaList,
  useStorageSummary,
  uploadMedia,
  formatBytes,
  mediaThumbnailUrl,
  type MediaAsset,
  type MediaType,
} from "@/lib/media";
import { useNotification } from "@/lib/notifications/notification-provider";
import { MediaStudio } from "@/components/media/media-studio";
import { MediaDetailSheet } from "@/components/media/media-detail-sheet";

export const Route = createFileRoute("/media")({
  component: MediaPage,
  head: () => ({
    meta: [
      { title: "Media — Learning English with Coach" },
      {
        name: "description",
        content:
          "Biblioteca de vídeos, áudios, imagens e documentos, com gravação por câmara e microfone.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const TYPE_ICON: Record<MediaType, typeof Film> = {
  video: Film,
  audio: Mic,
  image: ImageIcon,
  document: FileText,
};
const STATUS_LABEL: Record<string, string> = {
  uploading: "A carregar",
  processing: "A processar",
  ready: "Pronto",
  failed: "Falhou",
};
const FILTERS: Array<{ key: MediaType | "all"; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "video", label: "Vídeos" },
  { key: "audio", label: "Áudios" },
  { key: "image", label: "Imagens" },
  { key: "document", label: "Documentos" },
];

function MediaPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const notify = useNotification();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const [typeFilter, setTypeFilter] = useState<MediaType | "all">("all");
  const [search, setSearch] = useState("");
  const [trashed, setTrashed] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [plainUploading, setPlainUploading] = useState(false);

  const filters = useMemo(
    () => ({
      type: typeFilter === "all" ? undefined : typeFilter,
      search: search || undefined,
      trashed,
    }),
    [typeFilter, search, trashed],
  );
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useMediaList(filters);
  const { data: summary } = useStorageSummary();

  const items: MediaAsset[] = data?.pages.flatMap((p) => p.items) ?? [];

  const totalBytes = (summary?.byType ?? []).reduce((acc, t) => acc + Number(t.total_bytes), 0);
  const videoCount = Number(summary?.byType.find((t) => t.media_type === "video")?.count ?? 0);
  const audioCount = Number(summary?.byType.find((t) => t.media_type === "audio")?.count ?? 0);

  const handlePlainUpload = async (file: File) => {
    setPlainUploading(true);
    try {
      await uploadMedia(file);
      notify.success("Upload concluído", { description: file.name });
      void qc.invalidateQueries({ queryKey: ["media"] });
    } catch (err) {
      notify.fromError(err, { dedupeKey: "media-page:upload" });
    } finally {
      setPlainUploading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> A carregar…
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <VideosSidebar />

      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-100 shrink-0 z-10">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-[var(--primary)]" />
            <h1 className="font-display text-xl font-bold text-[var(--ink)]">Media</h1>
          </div>
          <div className="flex items-center gap-3">
            <HeaderActionLinks />
            <MobileAvatarMenu />
            <DesktopAvatarLink />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-20 md:pb-6 scrollbar-hide">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-bold text-[var(--ink)]">Biblioteca</h2>
                <p className="text-sm text-muted-foreground">
                  Gerencie vídeos, áudios, imagens e gravações.
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setStudioOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Criar mídia
                </Button>
                <label>
                  <Button variant="outline" asChild disabled={plainUploading}>
                    <span>
                      {plainUploading ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <UploadIcon className="w-4 h-4 mr-1" />
                      )}
                      Upload
                    </span>
                  </Button>
                  <input
                    type="file"
                    className="hidden"
                    accept="video/*,audio/*,image/*,application/pdf"
                    disabled={plainUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) void handlePlainUpload(file);
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 rounded-2xl border border-gray-100 p-5 md:p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Armazenamento
                </p>
                <p className="font-display text-xl font-bold text-[var(--ink)]">
                  {formatBytes(totalBytes)}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Vídeos
                </p>
                <p className="font-display text-xl font-bold text-[var(--ink)]">{videoCount}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Áudios
                </p>
                <p className="font-display text-xl font-bold text-[var(--ink)]">{audioCount}</p>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar mídia…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setTypeFilter(f.key)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      typeFilter === f.key
                        ? "bg-[var(--primary)] text-white shadow-md"
                        : "bg-white border border-gray-200 text-muted-foreground"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setTrashed((t) => !t)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  trashed
                    ? "bg-[var(--ink)] text-white"
                    : "bg-white border border-gray-200 text-muted-foreground"
                }`}
              >
                <Trash2 className="w-4 h-4" /> Lixeira
              </button>
            </div>

            <div className="rounded-2xl border border-gray-100 overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
                  <FolderOpen className="w-8 h-8" />
                  <p className="text-sm">
                    {trashed
                      ? "Lixeira vazia."
                      : "Ainda sem mídia — cria a primeira com o Media Studio."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Miniatura</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Tamanho</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => {
                      const Icon = TYPE_ICON[item.media_type];
                      return (
                        <TableRow
                          key={item.id}
                          className="cursor-pointer"
                          onClick={() => setDetailId(item.id)}
                          role="button"
                          tabIndex={0}
                          aria-label={item.title || item.original_filename}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setDetailId(item.id);
                            }
                          }}
                        >
                          <TableCell>
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                              {item.status === "ready" && item.thumbnail_storage_key ? (
                                <img
                                  src={mediaThumbnailUrl(item.id)}
                                  alt={item.title || item.original_filename}
                                  className="w-full h-full object-cover"
                                />
                              ) : item.status === "failed" ? (
                                <XCircle className="w-4 h-4 text-red-400" />
                              ) : item.media_type === "video" ? (
                                <Play className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <Icon className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-[var(--ink)]">
                            {item.title || item.original_filename}
                          </TableCell>
                          <TableCell className="text-muted-foreground capitalize">
                            {item.media_type}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                item.status === "failed"
                                  ? "destructive"
                                  : item.status === "ready"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {STATUS_LABEL[item.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatBytes(item.size_bytes)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                </div>
              )}
            </div>

            {hasNextPage && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => void fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                  Carregar mais
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>

      <VideosMobileNav />

      <MediaStudio open={studioOpen} onOpenChange={setStudioOpen} />
      <MediaDetailSheet assetId={detailId} onOpenChange={(open) => !open && setDetailId(null)} />
    </div>
  );
}
