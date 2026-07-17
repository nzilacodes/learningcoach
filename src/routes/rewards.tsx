import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Trophy, Flame, Coins, Sparkles, Target, Users, Globe, MapPin,
  Calendar as CalendarIcon, ShoppingBag, UserPlus, Check, Loader2, Star,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { celebrate, levelProgress, xpForLevel } from "@/lib/gamification";

export const Route = createFileRoute("/rewards")({
  component: RewardsPage,
  head: () => ({
    meta: [
      { title: "Recompensas — Learning English with Coach" },
      { name: "description", content: "XP, moedas, missões, loja, rankings e streak — o teu progresso gamificado." },
      { property: "og:title", content: "Recompensas — Coach" },
      { property: "og:description", content: "Ganha XP, moedas e sobe no ranking mundial." },
    ],
  }),
});

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  xp: number;
  level: number;
  coins: number;
  streak: number;
  country: string | null;
  avatar_config: Record<string, unknown>;
};
type Mission = {
  id: string; code: string; scope: string; title: string; description: string;
  action_type: string; target: number; xp_reward: number; coin_reward: number; icon: string;
};
type UserMission = {
  id: string; mission_id: string; period_key: string;
  progress: number; completed_at: string | null; claimed_at: string | null;
};
type ShopItem = {
  id: string; code: string; category: string; name: string; description: string;
  cost_coins: number; icon: string;
};
type XpEvent = { created_at: string; amount: number; source: string };
type RankRow = { id: string; full_name: string | null; avatar_url: string | null; xp: number; level: number; country: string | null };

function RewardsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [userMissions, setUserMissions] = useState<UserMission[]>([]);
  const [shop, setShop] = useState<ShopItem[]>([]);
  const [inventory, setInventory] = useState<{ item_id: string; equipped: boolean }[]>([]);
  const [events, setEvents] = useState<XpEvent[]>([]);
  const [ranks, setRanks] = useState<{ world: RankRow[]; national: RankRow[]; friends: RankRow[] }>({
    world: [], national: [], friends: [],
  });
  const [friendEmail, setFriendEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  const refresh = async () => {
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) { setLoading(false); return; }
    await supabase.rpc("ensure_user_missions");

    const [p, ms, ums, si, inv, ev, w] = await Promise.all([
      supabase.from("profiles").select("id,full_name,avatar_url,xp,level,coins,streak,country,avatar_config").eq("id", uid).maybeSingle(),
      supabase.from("missions").select("*").eq("is_active", true).order("scope"),
      supabase.from("user_missions").select("*").eq("user_id", uid),
      supabase.from("shop_items").select("*").eq("is_active", true).order("cost_coins"),
      supabase.from("user_inventory").select("item_id,equipped").eq("user_id", uid),
      supabase.from("xp_events").select("created_at,amount,source").eq("user_id", uid).order("created_at", { ascending: false }).limit(200),
      supabase.from("profiles").select("id,full_name,avatar_url,xp,level,country").order("xp", { ascending: false }).limit(50),
    ]);
    setProfile((p.data as Profile) ?? null);
    setMissions((ms.data as Mission[]) ?? []);
    setUserMissions((ums.data as UserMission[]) ?? []);
    setShop((si.data as ShopItem[]) ?? []);
    setInventory((inv.data as { item_id: string; equipped: boolean }[]) ?? []);
    setEvents((ev.data as XpEvent[]) ?? []);
    const world = (w.data as RankRow[]) ?? [];
    const country = (p.data as Profile | null)?.country;
    const national = country
      ? (await supabase.from("profiles").select("id,full_name,avatar_url,xp,level,country").eq("country", country).order("xp", { ascending: false }).limit(50)).data as RankRow[] ?? []
      : [];
    const friendsList = (await supabase.from("friendships").select("friend_id,user_id").or(`user_id.eq.${uid},friend_id.eq.${uid}`).eq("status","accepted")).data ?? [];
    const friendIds = Array.from(new Set(friendsList.map((f) => (f.user_id === uid ? f.friend_id : f.user_id))));
    friendIds.push(uid);
    const friends = friendIds.length
      ? (await supabase.from("profiles").select("id,full_name,avatar_url,xp,level,country").in("id", friendIds).order("xp", { ascending: false })).data as RankRow[] ?? []
      : [];
    setRanks({ world, national, friends });
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const ownedIds = useMemo(() => new Set(inventory.map((i) => i.item_id)), [inventory]);
  const userMissionMap = useMemo(
    () => new Map(userMissions.map((um) => [um.mission_id, um])),
    [userMissions],
  );

  const claim = async (missionId: string) => {
    setClaiming(missionId);
    const { data, error } = await supabase.rpc("claim_mission", { _mission_id: missionId });
    setClaiming(null);
    if (error) return toast.error(error.message);
    const r = data as { xp: number; coins: number };
    toast.success(`Recompensa: +${r.xp} XP · +${r.coins} 🪙`);
    celebrate();
    refresh();
  };

  const buy = async (itemId: string) => {
    const { error } = await supabase.rpc("buy_shop_item", { _item_id: itemId });
    if (error) return toast.error(error.message);
    toast.success("Item comprado!");
    celebrate();
    refresh();
  };

  const equip = async (itemId: string, category: string) => {
    if (!profile) return;
    if (category === "avatar") {
      await supabase.from("user_inventory").update({ equipped: false }).eq("user_id", profile.id);
    }
    await supabase.from("user_inventory").update({ equipped: true }).eq("user_id", profile.id).eq("item_id", itemId);
    toast.success("Equipado!");
    refresh();
  };

  const addFriend = async () => {
    if (!profile || !friendEmail.trim()) return;
    const email = friendEmail.trim().toLowerCase();
    const { data: target } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
    if (!target) return toast.error("Utilizador não encontrado");
    if (target.id === profile.id) return toast.error("Não podes adicionar-te a ti");
    const { error } = await supabase.from("friendships").insert({ user_id: profile.id, friend_id: target.id, status: "accepted" });
    if (error) return toast.error(error.message);
    toast.success("Amigo adicionado!");
    setFriendEmail("");
    refresh();
  };

  if (loading) return <div className="min-h-screen"><SiteHeader /><div className="p-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div></div>;
  if (!profile) return (
    <div className="min-h-screen"><SiteHeader />
      <div className="mx-auto max-w-xl p-10 text-center">
        <p className="text-muted-foreground">Precisas de iniciar sessão para veres as tuas recompensas.</p>
        <Button asChild className="mt-4"><Link to="/auth">Entrar</Link></Button>
      </div>
    </div>
  );

  const lp = levelProgress(profile.xp, profile.level);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-sunset text-white">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase opacity-90"><Trophy className="h-4 w-4"/>Nível</div>
              <div className="mt-1 font-display text-4xl font-bold">{profile.level}</div>
              <Progress value={lp.pct} className="mt-3 h-1.5 bg-white/30" />
              <div className="mt-1 text-xs opacity-90">{profile.xp} / {xpForLevel(profile.level + 1)} XP</div>
            </CardContent>
          </Card>
          <Card><CardContent className="p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground"><Sparkles className="h-4 w-4"/>XP total</div>
            <div className="mt-1 font-display text-4xl font-bold">{profile.xp.toLocaleString()}</div>
          </CardContent></Card>
          <Card><CardContent className="p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground"><Coins className="h-4 w-4 text-yellow-500"/>Moedas</div>
            <div className="mt-1 font-display text-4xl font-bold text-yellow-600">{profile.coins}</div>
          </CardContent></Card>
          <Card><CardContent className="p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground"><Flame className="h-4 w-4 text-orange-500"/>Streak</div>
            <div className="mt-1 font-display text-4xl font-bold">{profile.streak} <span className="text-lg">dias 🔥</span></div>
          </CardContent></Card>
        </div>

        <Tabs defaultValue="missions" className="mt-8">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="missions"><Target className="mr-1 h-4 w-4"/>Missões</TabsTrigger>
            <TabsTrigger value="calendar"><CalendarIcon className="mr-1 h-4 w-4"/>Calendário</TabsTrigger>
            <TabsTrigger value="rankings"><Trophy className="mr-1 h-4 w-4"/>Rankings</TabsTrigger>
            <TabsTrigger value="shop"><ShoppingBag className="mr-1 h-4 w-4"/>Loja</TabsTrigger>
            <TabsTrigger value="avatar"><Star className="mr-1 h-4 w-4"/>Avatar</TabsTrigger>
            <TabsTrigger value="friends"><Users className="mr-1 h-4 w-4"/>Amigos</TabsTrigger>
          </TabsList>

          {/* Missões */}
          <TabsContent value="missions" className="mt-6 space-y-6">
            {(["daily", "weekly", "monthly"] as const).map((scope) => {
              const label = scope === "daily" ? "Diárias" : scope === "weekly" ? "Semanais" : "Mensais";
              const list = missions.filter((m) => m.scope === scope);
              return (
                <section key={scope}>
                  <h2 className="mb-3 font-display text-lg font-bold">Missões {label}</h2>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {list.map((m) => {
                      const um = userMissionMap.get(m.id);
                      const progress = um?.progress ?? 0;
                      const done = !!um?.completed_at;
                      const claimed = !!um?.claimed_at;
                      return (
                        <Card key={m.id} className={done && !claimed ? "border-sunset shadow-glow" : ""}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="text-3xl">{m.icon}</div>
                              <Badge variant="outline">+{m.xp_reward} XP · +{m.coin_reward}🪙</Badge>
                            </div>
                            <div className="mt-2 font-display text-base font-bold">{m.title}</div>
                            <div className="text-xs text-muted-foreground">{m.description}</div>
                            <Progress value={(progress / m.target) * 100} className="mt-3 h-1.5" />
                            <div className="mt-1 text-xs text-muted-foreground">{Math.min(progress, m.target)} / {m.target}</div>
                            <Button
                              size="sm" className="mt-3 w-full"
                              disabled={!done || claimed || claiming === m.id}
                              onClick={() => claim(m.id)}
                            >
                              {claimed ? <><Check className="mr-1 h-4 w-4"/>Reclamado</> : done ? "Reclamar recompensa" : "Em progresso"}
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </TabsContent>

          {/* Calendário */}
          <TabsContent value="calendar" className="mt-6">
            <CalendarHeatmap events={events} />
          </TabsContent>

          {/* Rankings */}
          <TabsContent value="rankings" className="mt-6">
            <Tabs defaultValue="world">
              <TabsList>
                <TabsTrigger value="world"><Globe className="mr-1 h-4 w-4"/>Mundial</TabsTrigger>
                <TabsTrigger value="national"><MapPin className="mr-1 h-4 w-4"/>Nacional</TabsTrigger>
                <TabsTrigger value="friends"><Users className="mr-1 h-4 w-4"/>Amigos</TabsTrigger>
              </TabsList>
              <TabsContent value="world" className="mt-4"><RankList rows={ranks.world} me={profile.id} /></TabsContent>
              <TabsContent value="national" className="mt-4">
                {profile.country ? <RankList rows={ranks.national} me={profile.id} /> :
                  <p className="text-sm text-muted-foreground">Define o teu país no perfil para veres o ranking nacional.</p>}
              </TabsContent>
              <TabsContent value="friends" className="mt-4"><RankList rows={ranks.friends} me={profile.id} /></TabsContent>
            </Tabs>
          </TabsContent>

          {/* Loja */}
          <TabsContent value="shop" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {shop.map((it) => {
                const owned = ownedIds.has(it.id);
                const canAfford = profile.coins >= it.cost_coins;
                return (
                  <Card key={it.id}>
                    <CardContent className="p-5">
                      <div className="text-5xl">{it.icon}</div>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{it.category}</Badge>
                      </div>
                      <div className="mt-1 font-display text-lg font-bold">{it.name}</div>
                      <div className="text-xs text-muted-foreground">{it.description}</div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-1 font-bold text-yellow-600"><Coins className="h-4 w-4"/>{it.cost_coins}</div>
                        {owned ? (
                          <Button size="sm" variant="outline" onClick={() => equip(it.id, it.category)}>Equipar</Button>
                        ) : (
                          <Button size="sm" disabled={!canAfford} onClick={() => buy(it.id)}>Comprar</Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Avatar */}
          <TabsContent value="avatar" className="mt-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full bg-gradient-sunset text-6xl font-bold text-white shadow-glow">
                  {(profile.full_name ?? "?").slice(0, 1).toUpperCase()}
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {inventory.filter((i) => i.equipped).map((i) => {
                    const it = shop.find((s) => s.id === i.item_id);
                    return it ? <Badge key={i.item_id} variant="outline" className="text-lg">{it.icon} {it.name}</Badge> : null;
                  })}
                </div>
                <p className="mt-4 text-sm text-muted-foreground">Compra acessórios na loja e equipa-os para personalizar o teu avatar.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Amigos */}
          <TabsContent value="friends" className="mt-6 space-y-4">
            <Card><CardContent className="p-5">
              <div className="flex items-center gap-2 font-display text-lg font-bold"><UserPlus className="h-4 w-4"/>Adicionar amigo</div>
              <div className="mt-3 flex gap-2">
                <Input placeholder="email@exemplo.com" value={friendEmail} onChange={(e) => setFriendEmail(e.target.value)} />
                <Button onClick={addFriend}>Adicionar</Button>
              </div>
            </CardContent></Card>
            <RankList rows={ranks.friends} me={profile.id} />
          </TabsContent>
        </Tabs>
      </main>
      <SiteFooter />
    </div>
  );
}

function RankList({ rows, me }: { rows: RankRow[]; me: string }) {
  return (
    <div className="space-y-2">
      {rows.length === 0 && <p className="text-sm text-muted-foreground">Sem dados ainda.</p>}
      {rows.map((r, i) => (
        <Card key={r.id} className={r.id === me ? "border-sunset" : ""}>
          <CardContent className="flex items-center gap-4 p-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${i < 3 ? "bg-gradient-sunset text-white" : "bg-muted"}`}>
              {i + 1}
            </div>
            <div className="flex-1">
              <div className="font-semibold">{r.full_name ?? "—"} {r.id === me && <Badge variant="outline" className="ml-1 text-xs">Tu</Badge>}</div>
              <div className="text-xs text-muted-foreground">Nível {r.level} · {r.country ?? "🌍"}</div>
            </div>
            <div className="text-right">
              <div className="font-display text-lg font-bold">{r.xp.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">XP</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CalendarHeatmap({ events }: { events: XpEvent[] }) {
  // Aggregate XP per day for last 90 days
  const map = new Map<string, number>();
  for (const e of events) {
    const k = e.created_at.slice(0, 10);
    map.set(k, (map.get(k) ?? 0) + e.amount);
  }
  const days: { date: string; xp: number }[] = [];
  const now = new Date();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    const k = d.toISOString().slice(0, 10);
    days.push({ date: k, xp: map.get(k) ?? 0 });
  }
  const max = Math.max(1, ...days.map((d) => d.xp));
  const color = (xp: number) => {
    if (xp === 0) return "bg-muted";
    const t = xp / max;
    if (t < 0.25) return "bg-sunset/20";
    if (t < 0.5) return "bg-sunset/40";
    if (t < 0.75) return "bg-sunset/70";
    return "bg-sunset";
  };
  const totalXp = days.reduce((s, d) => s + d.xp, 0);
  const activeDays = days.filter((d) => d.xp > 0).length;

  return (
    <Card><CardContent className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-display text-lg font-bold">Últimos 90 dias</div>
        <div className="text-sm text-muted-foreground">{activeDays} dias ativos · {totalXp} XP</div>
      </div>
      <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] gap-1 sm:grid-cols-[repeat(30,minmax(0,1fr))]">
        {days.map((d) => (
          <div key={d.date} title={`${d.date}: ${d.xp} XP`} className={`aspect-square rounded ${color(d.xp)}`} />
        ))}
      </div>
    </CardContent></Card>
  );
}
