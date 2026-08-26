import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type NotificationCategory = "system" | "learning" | "assessment" | "account";
type NotificationRow = {
  id: string;
  category: NotificationCategory;
  title: string;
  description: string | null;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
};
type NotificationsResponse = { items: NotificationRow[]; unreadCount: number };
type TabValue = "all" | "unread" | NotificationCategory;

const TAB_LABEL: Record<TabValue, { pt: string; en: string }> = {
  all: { pt: "Todas", en: "All" },
  unread: { pt: "Não lidas", en: "Unread" },
  system: { pt: "Sistema", en: "System" },
  learning: { pt: "Aprendizagem", en: "Learning" },
  assessment: { pt: "Avaliações", en: "Assessments" },
  account: { pt: "Conta", en: "Account" },
};

function fetchNotifications(tab: TabValue) {
  const params = new URLSearchParams();
  if (tab === "unread") params.set("unreadOnly", "true");
  else if (tab !== "all") params.set("category", tab);
  return apiFetch<NotificationsResponse>(`/v1/me/notifications?${params.toString()}`);
}

/** Bell icon + unread badge for the header, opening a filterable Notification
 * Center panel — the persistent counterpart to the ephemeral toasts fired by
 * useNotification(). Backed by learningcoachbackEnd's modules/notifications. */
export function NotificationBell() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabValue>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", tab],
    enabled: !!user,
    queryFn: () => fetchNotifications(tab),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => apiFetch(`/v1/me/notifications/${id}/read`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const markAllRead = useMutation({
    mutationFn: () => apiFetch("/v1/me/notifications/read-all", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  if (!user) return null;
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={locale === "pt" ? "Notificações" : "Notifications"}
          aria-label={locale === "pt" ? "Notificações" : "Notifications"}
          className="relative p-2 text-muted-foreground hover:bg-gray-50 rounded-full transition-colors hidden sm:inline-flex focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-2xs font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 max-h-[28rem] overflow-hidden p-0">
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <span className="text-sm font-semibold">
            {locale === "pt" ? "Notificações" : "Notifications"}
          </span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
            >
              <CheckCheck className="size-3.5" />
              {locale === "pt" ? "Marcar tudo como lido" : "Mark all read"}
            </button>
          )}
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
          <TabsList className="mx-3 mt-2 grid grid-cols-3 gap-1 bg-transparent p-0 h-auto">
            {(Object.keys(TAB_LABEL) as TabValue[]).map((t) => (
              <TabsTrigger key={t} value={t} className="text-2xs px-1.5 py-1">
                {TAB_LABEL[t][locale]}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={tab} className="mt-2 max-h-80 overflow-y-auto px-1 pb-2">
            {isLoading ? (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                {locale === "pt" ? "A carregar…" : "Loading…"}
              </p>
            ) : !data || data.items.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                {locale === "pt" ? "Sem notificações." : "No notifications."}
              </p>
            ) : (
              <ul className="space-y-1">
                {data.items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => !n.read_at && markRead.mutate(n.id)}
                      className={cn(
                        "w-full rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                        !n.read_at && "bg-primary/5",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-foreground">{n.title}</span>
                        {!n.read_at ? (
                          <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary" />
                        ) : (
                          <Check className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                        )}
                      </div>
                      {n.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{n.description}</p>
                      )}
                      <p className="mt-1 text-2xs text-muted-foreground">
                        {new Date(n.created_at).toLocaleString(
                          locale === "pt" ? "pt-PT" : "en-US",
                          {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
