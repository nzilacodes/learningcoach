import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type PaymentMethod = "card" | "reference" | "transfer" | "mobile_money";
export type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];
export type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];
export type PlanRow = Database["public"]["Tables"]["subscription_plans"]["Row"];

export type OrderInfo = {
  subscription_id: string;
  payment_id: string;
  reference: string;
  entity: string;
  invoice_number: string;
  amount_kz: number;
};

export const createSubscriptionOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    planId: string;
    method: PaymentMethod;
    phone?: string | null;
    provider?: string | null;
  }) => input)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.rpc("create_subscription_order", {
      _plan_id: data.planId,
      _method: data.method,
      _phone: data.phone ?? undefined,
      _provider: data.provider ?? undefined,
    });
    if (error) throw new Error(error.message);
    return row as unknown as OrderInfo;
  });

export const listMyPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("payments")
      .select("*, subscription_plans(tier, billing_cycle, price_kz, duration_days)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as (PaymentRow & { subscription_plans: Pick<PlanRow, "tier" | "billing_cycle" | "price_kz" | "duration_days"> | null })[];
  });

export const listMySubscriptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("subscriptions")
      .select("*, subscription_plans(tier, billing_cycle, price_kz, duration_days, features)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as (SubscriptionRow & { subscription_plans: PlanRow | null })[];
  });

export const listPlans = createServerFn({ method: "GET" })
  .handler(async () => {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { data, error } = await sb.from("subscription_plans").select("*").eq("is_active", true).order("price_kz");
    if (error) throw new Error(error.message);
    return (data ?? []) as PlanRow[];
  });

// Demo confirmation — real gateway would call a webhook. Kept for admin & sandbox.
export const simulatePaymentConfirmation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { paymentId: string }) => input)
  .handler(async ({ data, context }) => {
    // Only allow user to simulate for their own pending payment (sandbox mode).
    const { data: pay, error: fetchErr } = await context.supabase
      .from("payments").select("*").eq("id", data.paymentId).single();
    if (fetchErr) throw new Error(fetchErr.message);
    if (pay.user_id !== context.userId) throw new Error("forbidden");
    if (pay.status === "paid") return pay;
    const { data: updated, error } = await context.supabase
      .from("payments")
      .update({ status: "paid", provider_transaction_id: "SANDBOX-" + Date.now() })
      .eq("id", data.paymentId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return updated;
  });
