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
import { ExerciseStatusBadge, type AdminExercise } from "../exercise-shared";
import type { ExerciseRowProps } from "./types";

function orderingRowSchema() {
  return z
    .object({
      prompt: z.string().min(1, "Pergunta obrigatória"),
      items: z.string().min(1, "Pelo menos um item"),
      order: z.string().min(1, "Ordem correta obrigatória"),
      xpReward: z.coerce.number().min(0, "XP não pode ser negativo"),
    })
    .refine(
      (v) => {
        const items = v.items
          .split("|")
          .map((s) => s.trim())
          .filter(Boolean);
        const order = v.order.split(",").map((s) => Number(s.trim()));
        if (order.length !== items.length || order.some((n) => Number.isNaN(n))) return false;
        const sorted = [...order].sort((a, b) => a - b);
        return sorted.every((n, i) => n === i);
      },
      {
        message:
          'A ordem tem de listar cada índice dos itens exatamente uma vez (ex: para 3 itens, "2,0,1")',
        path: ["order"],
      },
    );
}
type OrderingRowValues = z.infer<ReturnType<typeof orderingRowSchema>>;

export function OrderingExerciseRow({ exercise, onDeleted, onStatusChange, onSaved }: ExerciseRowProps) {
  const notify = useNotification();
  const toValues = (ex: AdminExercise): OrderingRowValues => ({
    prompt: ex.prompt,
    items: (ex.data?.items ?? []).join(" | "),
    order: (ex.correct_answer?.order ?? []).join(","),
    xpReward: ex.xp_reward,
  });
  const form = useForm<OrderingRowValues>({
    resolver: zodResolver(orderingRowSchema()),
    defaultValues: toValues(exercise),
  });
  useEffect(() => form.reset(toValues(exercise)), [exercise, form]);

  const save = useMutation({
    mutationFn: (values: OrderingRowValues) => {
      const items = values.items
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);
      const order = values.order.split(",").map((s) => Number(s.trim()));
      return apiFetch(`/v1/admin/exercises/${exercise.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          prompt: values.prompt,
          data: { items },
          correctAnswer: { order },
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
          name="items"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">
                Itens na ordem apresentada (separados por |)
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
          name="order"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">
                Ordem correta — índices dos itens acima, separados por vírgula (0 = primeiro item)
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
