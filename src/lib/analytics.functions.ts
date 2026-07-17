import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AnalyticsData = {
  students: number;
  active_7: number;
  active_30: number;
  revenue_total: number;
  revenue_month: number;
  revenue_year: number;
  avg_study_min: number;
  completion_rate: number;
  dropout_rate: number;
  retention_rate: number;
  revenue_series: { month: string; amount: number }[];
  students_series: { month: string; count: number }[];
  activity_series: { day: string; seconds: number; users: number }[];
  plans: { name: string; tier: string; orders: number; revenue: number }[];
  methods: { method: string; count: number; revenue: number }[];
};

export const getAdminAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { days?: number }) => i)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.rpc("admin_analytics", {
      _days: data.days ?? 30,
    });
    if (error) throw new Error(error.message);
    return row as unknown as AnalyticsData;
  });
