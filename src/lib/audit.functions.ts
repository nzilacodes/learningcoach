import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

export type AuditLog = {
  id: string;
  user_id: string | null;
  actor_email: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  severity: string;
  metadata: JsonValue;
  created_at: string;
};

export type LoginAttempt = {
  id: string;
  email: string;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  reason: string | null;
  created_at: string;
};

export type Lockout = {
  id: string;
  email: string;
  ip_address: string | null;
  reason: string;
  locked_until: string;
  created_at: string;
};

export const logAuditEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: {
    action: string;
    entity?: string;
    entityId?: string;
    severity?: "info" | "warning" | "critical";
    metadata?: JsonValue;
  }) => i)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("log_audit_event", {
      _action: data.action,
      _entity: data.entity ?? undefined,
      _entity_id: data.entityId ?? undefined,
      _severity: data.severity ?? "info",
      _metadata: (data.metadata ?? {}) as never,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { limit?: number; severity?: string; action?: string }) => i)
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("audit_logs").select("*")
      .order("created_at", { ascending: false })
      .limit(Math.min(data.limit ?? 200, 500));
    if (data.severity) q = q.eq("severity", data.severity);
    if (data.action) q = q.ilike("action", `%${data.action}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as AuditLog[];
  });

export const listLoginAttempts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("login_attempts")
      .select("*").order("created_at", { ascending: false }).limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as LoginAttempt[];
  });

export const listLockouts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("account_lockouts")
      .select("*").order("created_at", { ascending: false }).limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Lockout[];
  });

export const getSecuritySummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("admin_security_summary");
    if (error) throw new Error(error.message);
    return data as unknown as {
      total_events_24h: number;
      failed_logins_24h: number;
      active_lockouts: number;
      critical_events_7d: number;
      suspicious_ips: { ip_address: string; attempts: number }[];
      recent_lockouts: Lockout[];
    };
  });
