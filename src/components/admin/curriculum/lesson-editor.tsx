import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiFetch } from "@/lib/api/client";
import { useNotification } from "@/lib/notifications/notification-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { AdminExercise, ContentStatus } from "./exercise-shared";
import { ExerciseEditor } from "./exercise-editor";
import { LessonContentFields } from "./lesson-content-fields";
import { contentToFormValues, formValuesToContent } from "./lesson-content-shape";
import { PrerequisitesEditor } from "./prerequisites-editor";

type AdminLessonDetail = {
  id: string;
  title: string;
  summary: string | null;
  content: unknown;
  xp_reward: number;
  is_published: boolean;
  lesson_type: string;
  skill_id: string | null;
  difficulty: number;
};

type SkillRow = { id: string; code: string; label: string; order_index: number };

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "1 — Muito fácil",
  2: "2 — Fácil",
  3: "3 — Normal",
  4: "4 — Difícil",
  5: "5 — Avançado",
};

const wordlistItemSchema = z.object({
  word: z.string(),
  pos: z.string(),
  definition: z.string(),
  example: z.string(),
});

const lessonEditorSchema = z.object({
  title: z.string().min(1, "Título obrigatório"),
  summary: z.string(),
  xpReward: z.coerce.number().min(0, "XP não pode ser negativo"),
  published: z.boolean(),
  skillId: z.string(),
  difficulty: z.coerce.number().int().min(1).max(5),
  objective: z.string(),
  wordlist: z.array(wordlistItemSchema),
  activities: z.string(),
  focus: z.string(),
  rule: z.string(),
  examples: z.string(),
  practice: z.string(),
  text_title: z.string(),
  text: z.string(),
  tasks: z.string(),
  audio_script: z.string(),
  prompt: z.string(),
  rubric: z.string(),
  functions: z.string(),
  drills: z.string(),
  symbols: z.string(),
  recap: z.string(),
  task: z.string(),
  deliverables: z.string(),
});
export type LessonEditorValues = z.infer<typeof lessonEditorSchema>;

export function LessonEditor({ lessonId }: { lessonId: string }) {
  const qc = useQueryClient();
  const notify = useNotification();
  const { data: lesson, isLoading } = useQuery({
    queryKey: ["admin_lesson", lessonId],
    queryFn: () => apiFetch<AdminLessonDetail>(`/v1/lessons/${lessonId}`),
  });
  // Exercises come from the admin-only endpoint, not the embedded ones on the
  // public /v1/lessons/:id payload above — that payload now withholds
  // correct_answer for every caller on quiz/final_test lessons (grading is
  // server-side now), which would otherwise blind this editor to the very
  // data it needs to author/review.
  const [statusFilter, setStatusFilter] = useState<ContentStatus | "">("");
  const { data: exercises = [] } = useQuery({
    queryKey: ["admin_exercises", lessonId, statusFilter],
    queryFn: () =>
      apiFetch<AdminExercise[]>(
        `/v1/admin/lessons/${lessonId}/exercises${statusFilter ? `?status=${statusFilter}` : ""}`,
      ),
  });
  const { data: skills = [] } = useQuery({
    queryKey: ["admin_skills"],
    queryFn: () => apiFetch<SkillRow[]>("/v1/admin/skills"),
    staleTime: 5 * 60_000,
  });

  const form = useForm<LessonEditorValues>({
    resolver: zodResolver(lessonEditorSchema),
    defaultValues: {
      title: "",
      summary: "",
      xpReward: 10,
      published: true,
      skillId: "",
      difficulty: 3,
      ...contentToFormValues(null),
    },
  });

  useEffect(() => {
    if (!lesson) return;
    form.reset({
      title: lesson.title,
      summary: lesson.summary ?? "",
      xpReward: lesson.xp_reward,
      published: lesson.is_published,
      skillId: lesson.skill_id ?? "",
      difficulty: lesson.difficulty,
      ...contentToFormValues(lesson.content),
    });
  }, [lesson, form]);

  const invalidateLesson = () => {
    qc.invalidateQueries({ queryKey: ["admin_lesson", lessonId] });
    qc.invalidateQueries({ queryKey: ["admin_exercises", lessonId] });
    qc.invalidateQueries({ queryKey: ["admin_review_summary"] });
    qc.invalidateQueries({ queryKey: ["curriculum"] });
    qc.invalidateQueries({ queryKey: ["lesson", lessonId] });
  };

  const save = useMutation({
    mutationFn: (values: LessonEditorValues) =>
      apiFetch(`/v1/admin/lessons/${lessonId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: values.title,
          summary: values.summary,
          xpReward: values.xpReward,
          isPublished: values.published,
          skillId: values.skillId || undefined,
          difficulty: values.difficulty,
          content: formValuesToContent(values, lesson!.lesson_type),
        }),
      }),
    onSuccess: () => {
      notify.success("Lição atualizada");
      invalidateLesson();
    },
    onError: (e) => {
      const normalized = notify.fromError(e, { dedupeKey: "admin:save-lesson" });
      // The backend doesn't validate `content` shape, so a `content.*` error
      // path has no single field to attach to — it still surfaces via the
      // toast above, it just can't highlight one specific input.
      const toFormField: Record<string, keyof LessonEditorValues> = {
        title: "title",
        summary: "summary",
        xpReward: "xpReward",
        isPublished: "published",
      };
      normalized.fieldPaths?.forEach((path) => {
        const field = toFormField[path];
        if (field) form.setError(field, { type: "server", message: normalized.description });
      });
    },
  });

  const submit = form.handleSubmit((values) => save.mutate(values));

  if (isLoading || !lesson)
    return <div className="p-4 text-sm text-muted-foreground">Carregando…</div>;

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={submit} className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="uppercase">
              {lesson.lesson_type}
            </Badge>
            <FormField
              control={form.control}
              name="published"
              render={({ field }) => (
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  Publicada
                </label>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold text-muted-foreground">
                  Título
                </FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="summary"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold text-muted-foreground">
                  Resumo
                </FormLabel>
                <FormControl>
                  <Textarea rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="xpReward"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold text-muted-foreground">XP</FormLabel>
                <FormControl>
                  <Input type="number" min={0} className="w-28" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="skillId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-muted-foreground">
                    Competência
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione…" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {skills.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="difficulty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-muted-foreground">
                    Dificuldade
                  </FormLabel>
                  <Select
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((d) => (
                        <SelectItem key={d} value={String(d)}>
                          {DIFFICULTY_LABELS[d]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="objective"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold text-muted-foreground">
                  Objetivo
                </FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <LessonContentFields form={form} lessonType={lesson.lesson_type} />
          <Button type="submit" disabled={save.isPending} className="w-full">
            {save.isPending ? "Salvando..." : "Salvar lição"}
          </Button>
        </form>
      </Form>

      {/* Sibling of the lesson <form> above, not nested inside it. Each
          exercise row below renders its own <form>; nesting them inside the
          lesson's <form> made a click on any exercise's "Salvar" bubble up
          and also submit the lesson form. */}
      <div className="mt-6 border-t border-border pt-4">
        <ExerciseEditor
          lessonId={lessonId}
          exercises={exercises}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onChanged={invalidateLesson}
        />
      </div>

      <div className="mt-6 border-t border-border pt-4">
        <PrerequisitesEditor lessonId={lessonId} />
      </div>
    </div>
  );
}
