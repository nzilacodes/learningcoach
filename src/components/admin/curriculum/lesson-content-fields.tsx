import { useFieldArray, type UseFormReturn, type Path } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import type { LessonEditorValues } from "./lesson-editor";

function TextField({
  form,
  name,
  label,
}: {
  form: UseFormReturn<LessonEditorValues>;
  name: Path<LessonEditorValues>;
  label: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-semibold text-muted-foreground">{label}</FormLabel>
          <FormControl>
            <Input {...field} value={field.value as string} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function LongTextField({
  form,
  name,
  label,
  rows = 5,
}: {
  form: UseFormReturn<LessonEditorValues>;
  name: Path<LessonEditorValues>;
  label: string;
  rows?: number;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-semibold text-muted-foreground">{label}</FormLabel>
          <FormControl>
            <Textarea rows={rows} {...field} value={field.value as string} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function ListTextarea({
  form,
  name,
  label,
  rows = 3,
}: {
  form: UseFormReturn<LessonEditorValues>;
  name: Path<LessonEditorValues>;
  label: string;
  rows?: number;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-semibold text-muted-foreground">
            {label} <span className="font-normal normal-case">— um por linha</span>
          </FormLabel>
          <FormControl>
            <Textarea rows={rows} {...field} value={field.value as string} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function WordlistFields({ form }: { form: UseFormReturn<LessonEditorValues> }) {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "wordlist" });
  return (
    <div className="space-y-3">
      <FormLabel className="text-xs font-semibold text-muted-foreground">Vocabulário</FormLabel>
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-1 gap-2 rounded-xl border border-border p-3 sm:grid-cols-2"
          >
            <FormField
              control={form.control}
              name={`wordlist.${index}.word`}
              render={({ field: f }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Palavra" className="text-sm" {...f} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`wordlist.${index}.pos`}
              render={({ field: f }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Classe gramatical (ex: noun)" className="text-sm" {...f} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`wordlist.${index}.definition`}
              render={({ field: f }) => (
                <FormItem className="sm:col-span-2">
                  <FormControl>
                    <Input placeholder="Definição" className="text-sm" {...f} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`wordlist.${index}.example`}
              render={({ field: f }) => (
                <FormItem className="sm:col-span-2">
                  <FormControl>
                    <Input placeholder="Frase de exemplo" className="text-sm" {...f} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="sm:col-span-2">
              <Button type="button" size="sm" variant="outline" onClick={() => remove(index)}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Remover palavra
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => append({ word: "", pos: "", definition: "", example: "" })}
      >
        <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar palavra
      </Button>
    </div>
  );
}

/**
 * Structured content editor, replacing the old raw-JSON textarea. Which
 * fields render is driven entirely by `lessonType` — see
 * lesson-content-shape.ts for the authoritative field-per-type table (kept
 * in sync with lesson.$lessonId.tsx's LessonBody, which is what actually
 * renders this content to learners).
 */
export function LessonContentFields({
  form,
  lessonType,
}: {
  form: UseFormReturn<LessonEditorValues>;
  lessonType: string;
}) {
  switch (lessonType) {
    case "vocabulary":
      return (
        <div className="space-y-4">
          <WordlistFields form={form} />
          <ListTextarea form={form} name="activities" label="Atividades" />
        </div>
      );
    case "grammar":
      return (
        <div className="space-y-4">
          <TextField form={form} name="focus" label="Foco gramatical" />
          <LongTextField form={form} name="rule" label="Regra" rows={3} />
          <ListTextarea form={form} name="examples" label="Exemplos" />
          <ListTextarea form={form} name="practice" label="Prática" />
        </div>
      );
    case "reading":
      return (
        <div className="space-y-4">
          <TextField form={form} name="text_title" label="Título do texto" />
          <LongTextField form={form} name="text" label="Texto" rows={8} />
          <ListTextarea form={form} name="tasks" label="Tarefas" />
        </div>
      );
    case "listening":
      return (
        <div className="space-y-4">
          <LongTextField form={form} name="audio_script" label="Roteiro de áudio" rows={8} />
          <ListTextarea form={form} name="tasks" label="Tarefas" />
        </div>
      );
    case "writing":
      return (
        <div className="space-y-4">
          <LongTextField form={form} name="prompt" label="Tema de escrita" rows={3} />
          <ListTextarea form={form} name="rubric" label="Critérios de avaliação" />
        </div>
      );
    case "speaking":
      return (
        <div className="space-y-4">
          <LongTextField form={form} name="prompt" label="Tema de fala" rows={3} />
          <ListTextarea form={form} name="functions" label="Funções linguísticas" />
          <ListTextarea form={form} name="rubric" label="Critérios de avaliação" />
        </div>
      );
    case "pronunciation":
      return (
        <div className="space-y-4">
          <TextField form={form} name="focus" label="Foco de pronúncia" />
          <ListTextarea form={form} name="drills" label="Exercícios de repetição" />
        </div>
      );
    case "ipa":
      return (
        <div className="space-y-4">
          <ListTextarea form={form} name="symbols" label="Símbolos IPA" />
          <ListTextarea form={form} name="tasks" label="Tarefas" />
        </div>
      );
    case "review":
      return (
        <div className="space-y-4">
          <ListTextarea form={form} name="recap" label="Resumo" />
          <ListTextarea form={form} name="activities" label="Atividades" />
        </div>
      );
    case "project":
      return (
        <div className="space-y-4">
          <LongTextField form={form} name="task" label="Tarefa do projeto" rows={4} />
          <ListTextarea form={form} name="deliverables" label="Entregáveis" />
        </div>
      );
    case "quiz":
    case "final_test":
      return (
        <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          Este tipo de lição não tem conteúdo estruturado — apenas os exercícios abaixo.
        </p>
      );
    default:
      return null;
  }
}
