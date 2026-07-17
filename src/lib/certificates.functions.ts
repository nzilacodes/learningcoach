import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type CertificateRow = Database["public"]["Tables"]["certificates"]["Row"];

export const issueCertificate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      level: Database["public"]["Enums"]["cefr_level"];
      courseId?: string | null;
      courseTitle?: string | null;
      score?: number | null;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.rpc("issue_certificate", {
      _level: data.level,
      _course_id: data.courseId ?? undefined,
      _score: data.score ?? undefined,
      _course_title: data.courseTitle ?? undefined,
    });
    if (error) throw new Error(error.message);
    return row as unknown as CertificateRow;
  });

export const listMyCertificates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("certificates")
      .select("*")
      .eq("user_id", context.userId)
      .order("issued_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as CertificateRow[];
  });

export type VerifiedCertificate = {
  verification_code: string;
  full_name: string | null;
  level: Database["public"]["Enums"]["cefr_level"];
  course_title: string | null;
  score: number | null;
  issued_at: string;
  signature: string;
  valid: boolean;
};

export const verifyCertificate = createServerFn({ method: "GET" })
  .inputValidator((input: { code: string }) => ({ code: String(input.code || "").trim() }))
  .handler(async ({ data }) => {
    if (!data.code) return null;
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { data: rows, error } = await supabase.rpc("verify_certificate", { _code: data.code });
    if (error) throw new Error(error.message);
    const row = Array.isArray(rows) ? rows[0] : rows;
    return (row ?? null) as VerifiedCertificate | null;
  });
