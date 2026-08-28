// Content shape per lesson_type — mirrors what learningcoach's
// src/routes/lesson.$lessonId.tsx (LessonBody) reads for each type. The
// backend stores `content` as an unvalidated JSON blob, so this is the only
// place the shape is enforced; keep the two in sync when adding a type.
export type LessonContentFormValues = {
  objective: string;
  wordlist: { word: string; pos: string; definition: string; example: string }[];
  activities: string;
  focus: string;
  rule: string;
  examples: string;
  practice: string;
  text_title: string;
  text: string;
  tasks: string;
  audio_script: string;
  prompt: string;
  rubric: string;
  functions: string;
  drills: string;
  symbols: string;
  recap: string;
  task: string;
  deliverables: string;
};

export const EMPTY_CONTENT_FORM_VALUES: LessonContentFormValues = {
  objective: "",
  wordlist: [],
  activities: "",
  focus: "",
  rule: "",
  examples: "",
  practice: "",
  text_title: "",
  text: "",
  tasks: "",
  audio_script: "",
  prompt: "",
  rubric: "",
  functions: "",
  drills: "",
  symbols: "",
  recap: "",
  task: "",
  deliverables: "",
};

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const strArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

export function contentToFormValues(content: unknown): LessonContentFormValues {
  const c = (content && typeof content === "object" ? content : {}) as Record<string, unknown>;
  const wordlistRaw = Array.isArray(c.wordlist) ? (c.wordlist as Record<string, unknown>[]) : [];
  return {
    ...EMPTY_CONTENT_FORM_VALUES,
    objective: str(c.objective),
    wordlist: wordlistRaw.map((w) => ({
      word: str(w.word),
      pos: str(w.pos),
      definition: str(w.definition),
      example: str(w.example),
    })),
    activities: strArr(c.activities).join("\n"),
    focus: str(c.focus),
    rule: str(c.rule),
    examples: strArr(c.examples).join("\n"),
    practice: strArr(c.practice).join("\n"),
    text_title: str(c.text_title),
    text: str(c.text),
    tasks: strArr(c.tasks).join("\n"),
    audio_script: str(c.audio_script),
    prompt: str(c.prompt),
    rubric: strArr(c.rubric).join("\n"),
    functions: strArr(c.functions).join("\n"),
    drills: strArr(c.drills).join("\n"),
    symbols: strArr(c.symbols).join("\n"),
    recap: strArr(c.recap).join("\n"),
    task: str(c.task),
    deliverables: strArr(c.deliverables).join("\n"),
  };
}

const splitLines = (v: string) =>
  v
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

/**
 * Only the fields relevant to `lessonType` are written back — keeps the
 * saved content shape identical to what LessonBody reads for that type,
 * instead of ballooning every lesson with ~19 mostly-empty keys.
 */
export function formValuesToContent(
  values: LessonContentFormValues,
  lessonType: string,
): Record<string, unknown> {
  const content: Record<string, unknown> = {};
  if (values.objective.trim()) content.objective = values.objective.trim();

  switch (lessonType) {
    case "vocabulary":
      content.wordlist = values.wordlist.filter((w) => w.word.trim());
      content.activities = splitLines(values.activities);
      break;
    case "grammar":
      content.focus = values.focus;
      content.rule = values.rule;
      content.examples = splitLines(values.examples);
      content.practice = splitLines(values.practice);
      break;
    case "reading":
      content.text_title = values.text_title;
      content.text = values.text;
      content.tasks = splitLines(values.tasks);
      break;
    case "listening":
      content.audio_script = values.audio_script;
      content.tasks = splitLines(values.tasks);
      break;
    case "writing":
      content.prompt = values.prompt;
      content.rubric = splitLines(values.rubric);
      break;
    case "speaking":
      content.prompt = values.prompt;
      content.functions = splitLines(values.functions);
      content.rubric = splitLines(values.rubric);
      break;
    case "pronunciation":
      content.focus = values.focus;
      content.drills = splitLines(values.drills);
      break;
    case "ipa":
      content.symbols = splitLines(values.symbols);
      content.tasks = splitLines(values.tasks);
      break;
    case "review":
      content.recap = splitLines(values.recap);
      content.activities = splitLines(values.activities);
      break;
    case "project":
      content.task = values.task;
      content.deliverables = splitLines(values.deliverables);
      break;
    default:
      break;
  }
  return content;
}
