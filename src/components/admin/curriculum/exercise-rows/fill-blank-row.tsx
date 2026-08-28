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
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { ExerciseStatusBadge, type AdminExercise } from "../exercise-shared";
import type { ExerciseRowProps } from "./types";

function fillBlankRowSchema() {
  return z.object({
    prompt: z.string().min(1, "Pergunta obrigatória"),
    answers: z.string().min(1, "Pelo menos uma resposta aceite"),
    xpReward: z.coerce.number().min(0, "XP não pode ser negativo"),
  });
}
type FillBlankRowValues = z.infer<ReturnType<typeof fillBlankRowSchema>>;

export function FillBlankExerciseRow({
  exercise,
  onDeleted,
  onStatusChange,
  onSaved,
}: ExerciseRowProps) {
  const notify = useNotification();
  const toValues = (ex: AdminExercise): FillBlankRowValues => ({
    prompt: ex.prompt,
    answers: (ex.correct_answer?.answers ?? []).join(" | "),
    xpReward: ex.xp_reward,
  });
  const form = useForm<FillBlankRowValues>({
    resolver: zodResolver(fillBlankRowSchema()),
    defaultValues: toValues(exercise),
  });
  useEffect(() => form.reset(toValues(exercise)), [exercise, form]);

  const save = useMutation({
    mutationFn: (values: FillBlankRowValues) => {
      const answers = values.answers
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);
      return apiFetch(`/v1/admin/exercises/${exercise.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          prompt: values.prompt,
          data: {},
          correctAnswer: { answers },
          xpReward: values.xpReward,
        }),
      });
    },
    onSuccess: () => {
      notify.success("Exercício salvo");
      onSaved();
    },
    onError: (e) => notify.fromError(e, { dedupeKey: "admin:save-exercise" }),
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
                <Input placeholder="Frase com ___ para a lacuna" className="text-sm" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="answers"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">
                Respostas aceites (separadas por |)
              </FormLabel>
              <FormControl>
                <Input className="text-xs" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-center gap-2">
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
