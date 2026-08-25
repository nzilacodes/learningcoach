import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { useNotification } from "@/lib/notifications/notification-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { ExerciseStatusBadge } from "../exercise-shared";
import type { ExerciseRowProps } from "./types";

function exerciseRowSchema() {
  return z
    .object({
      prompt: z.string().min(1, "Pergunta obrigatória"),
      options: z.string(),
      correctIndex: z.coerce.number().int(),
      xpReward: z.coerce.number().min(0, "XP não pode ser negativo"),
    })
    .refine(
      (v) => {
        const parsed = v.options
          .split("|")
          .map((s) => s.trim())
          .filter(Boolean);
        return v.correctIndex >= 0 && v.correctIndex < parsed.length;
      },
      (v) => {
        const parsed = v.options
          .split("|")
          .map((s) => s.trim())
          .filter(Boolean);
        return {
          message: `Índice da resposta correta (${v.correctIndex}) precisa estar entre 0 e ${parsed.length - 1}.`,
          path: ["correctIndex"],
        };
      },
    );
}
type ExerciseRowValues = z.infer<ReturnType<typeof exerciseRowSchema>>;

export function ExerciseRow({ exercise, onDeleted, onStatusChange, onSaved }: ExerciseRowProps) {
  const notify = useNotification();
  const form = useForm<ExerciseRowValues>({
    resolver: zodResolver(exerciseRowSchema()),
    defaultValues: {
      prompt: exercise.prompt,
      options: (exercise.data?.options ?? []).join(" | "),
      correctIndex: exercise.correct_answer?.index ?? 0,
      xpReward: exercise.xp_reward,
    },
  });

  // Resync local fields if the server row changes under us (e.g. another
  // admin edits it, or a refetch returns updated data) — useState's initial
  // value only applies on mount, so without this the form would keep
  // showing stale values after the first render.
  useEffect(() => {
    form.reset({
      prompt: exercise.prompt,
      options: (exercise.data?.options ?? []).join(" | "),
      correctIndex: exercise.correct_answer?.index ?? 0,
      xpReward: exercise.xp_reward,
    });
  }, [exercise, form]);

  const save = useMutation({
    mutationFn: (values: ExerciseRowValues) => {
      const parsedOptions = values.options
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);
      return apiFetch(`/v1/admin/exercises/${exercise.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          prompt: values.prompt,
          data: { options: parsedOptions },
          correctAnswer: { index: values.correctIndex },
          xpReward: values.xpReward,
        }),
      });
    },
    onSuccess: () => {
      notify.success("Exercício salvo");
      onSaved();
    },
    onError: (e) => {
      const normalized = notify.fromError(e, { dedupeKey: "admin:save-exercise" });
      const toFormField: Record<string, keyof ExerciseRowValues> = {
        prompt: "prompt",
        data: "options",
        correctAnswer: "correctIndex",
        xpReward: "xpReward",
      };
      normalized.fieldPaths?.forEach((path) => {
        const field = toFormField[path];
        if (field) form.setError(field, { type: "server", message: normalized.description });
      });
    },
  });

  const submit = form.handleSubmit((values) => save.mutate(values));

  return (
    <Form {...form}>
      <form onSubmit={submit} className="space-y-2 rounded-xl border border-border p-3">
        <div className="flex justify-end">
          <ExerciseStatusBadge exercise={exercise} onStatusChange={onStatusChange} />
        </div>
        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Pergunta" className="text-sm" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="options"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Opções separadas por |" className="text-xs" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-wrap items-center gap-2">
          <FormField
            control={form.control}
            name="correctIndex"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormLabel className="text-xs text-muted-foreground">Correta (índice)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} className="w-16 text-xs" {...field} />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="xpReward"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormLabel className="text-xs text-muted-foreground">XP</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} className="w-16 text-xs" {...field} />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={save.isPending}>
            Salvar
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onDeleted}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
