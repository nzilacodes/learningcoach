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

function matchingRowSchema() {
  return z
    .object({
      prompt: z.string().min(1, "Pergunta obrigatória"),
      leftItems: z.string().min(1, "Pelo menos um item à esquerda"),
      rightItems: z.string().min(1, "Pelo menos um item à direita"),
      pairs: z.string().min(1, "Pares corretos obrigatórios"),
      xpReward: z.coerce.number().min(0, "XP não pode ser negativo"),
    })
    .refine(
      (v) => {
        const left = v.leftItems
          .split("|")
          .map((s) => s.trim())
          .filter(Boolean);
        const right = v.rightItems
          .split("|")
          .map((s) => s.trim())
          .filter(Boolean);
        const pairs = v.pairs
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (pairs.length !== left.length) return false;
        return pairs.every((p) => {
          const [l, r] = p.split(":").map((s) => Number(s.trim()));
          return (
            Number.isInteger(l) &&
            Number.isInteger(r) &&
            l! >= 0 &&
            l! < left.length &&
            r! >= 0 &&
            r! < right.length
          );
        });
      },
      {
        message:
          'Pares inválidos — um par "esquerda:direita" por item à esquerda, separados por vírgula (ex: "0:2,1:0,2:1")',
        path: ["pairs"],
      },
    );
}
type MatchingRowValues = z.infer<ReturnType<typeof matchingRowSchema>>;

export function MatchingExerciseRow({
  exercise,
  onDeleted,
  onStatusChange,
  onSaved,
}: ExerciseRowProps) {
  const notify = useNotification();
  const toValues = (ex: AdminExercise): MatchingRowValues => ({
    prompt: ex.prompt,
    leftItems: (ex.data?.leftItems ?? []).join(" | "),
    rightItems: (ex.data?.rightItems ?? []).join(" | "),
    pairs: (ex.correct_answer?.pairs ?? []).map((p) => `${p.left}:${p.right}`).join(","),
    xpReward: ex.xp_reward,
  });
  const form = useForm<MatchingRowValues>({
    resolver: zodResolver(matchingRowSchema()),
    defaultValues: toValues(exercise),
  });
  useEffect(() => form.reset(toValues(exercise)), [exercise, form]);

  const save = useMutation({
    mutationFn: (values: MatchingRowValues) => {
      const leftItems = values.leftItems
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);
      const rightItems = values.rightItems
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);
      const pairs = values.pairs
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((p) => {
          const [left, right] = p.split(":").map((s) => Number(s.trim()));
          return { left, right };
        });
      return apiFetch(`/v1/admin/exercises/${exercise.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          prompt: values.prompt,
          data: { leftItems, rightItems },
          correctAnswer: { pairs },
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
                <Input placeholder="Pergunta" className="text-sm" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="leftItems"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">
                Itens à esquerda (separados por |)
              </FormLabel>
              <FormControl>
                <Input className="text-xs" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="rightItems"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">
                Itens à direita (separados por |)
              </FormLabel>
              <FormControl>
                <Input className="text-xs" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="pairs"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">
                Pares corretos — esquerda:direita por índice, separados por vírgula (ex:
                0:2,1:0,2:1)
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
