// Comprehensive diagnostic question bank covering 7 skills.
// Each MCQ carries a CEFR difficulty used to weight scoring.

export type Cefr = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface McqItem {
  id: string;
  prompt: string;      // English question / stem
  options: string[];
  correct: number;
  level: Cefr;
  note?: string;       // optional PT hint shown above the question
}

export interface ListeningItem extends McqItem {
  audio: string;       // text passed to TTS
}

export interface ReadingPassage {
  id: string;
  level: Cefr;
  passage: string;
  questions: Omit<McqItem, "id" | "level">[];
}

export interface WritingPrompt {
  id: string;
  level: Cefr;
  prompt: string;      // instruction to the learner
  minWords: number;
}

export interface SpeakingPrompt {
  id: string;
  level: Cefr;
  prompt: string;      // instruction shown to the learner
  minWords: number;
}

export interface PronunciationItem {
  id: string;
  level: Cefr;
  sentence: string;    // sentence to read aloud
}

/* ---------------- Grammar (6) ---------------- */
export const GRAMMAR: McqItem[] = [
  { id: "g1", level: "A1", prompt: "She ___ a teacher.", options: ["am", "is", "are", "be"], correct: 1 },
  { id: "g2", level: "A2", prompt: "Yesterday I ___ to the market.", options: ["go", "goes", "went", "gone"], correct: 2 },
  { id: "g3", level: "B1", prompt: "If it rains tomorrow, we ___ stay home.", options: ["will", "would", "would have", "are"], correct: 0 },
  { id: "g4", level: "B2", prompt: "By the time he arrived, we ___ dinner.", options: ["finished", "have finished", "had finished", "were finishing"], correct: 2 },
  { id: "g5", level: "C1", prompt: "Rarely ___ such a compelling argument.", options: ["I have heard", "have I heard", "I heard", "did I heard"], correct: 1 },
  { id: "g6", level: "C2", prompt: "Were it not ___ your help, I would have failed.", options: ["by", "for", "of", "with"], correct: 1 },
];

/* ---------------- Vocabulary (6) ---------------- */
export const VOCABULARY: McqItem[] = [
  { id: "v1", level: "A1", prompt: "The opposite of 'big' is:", options: ["small", "tall", "fat", "long"], correct: 0 },
  { id: "v2", level: "A2", prompt: "You use an ___ to open a door.", options: ["window", "key", "spoon", "book"], correct: 1 },
  { id: "v3", level: "B1", prompt: "'Reliable' means someone you can:", options: ["ignore", "trust", "avoid", "fear"], correct: 1 },
  { id: "v4", level: "B2", prompt: "'To postpone' a meeting means to:", options: ["cancel it", "attend it", "delay it", "shorten it"], correct: 2 },
  { id: "v5", level: "C1", prompt: "A 'meticulous' person is very:", options: ["careless", "detail-oriented", "friendly", "hesitant"], correct: 1 },
  { id: "v6", level: "C2", prompt: "'To exacerbate' a problem is to:", options: ["solve it", "reduce it", "worsen it", "ignore it"], correct: 2 },
];

/* ---------------- Reading (2 passages, 4 questions) ---------------- */
export const READING: ReadingPassage[] = [
  {
    id: "r1",
    level: "A2",
    passage:
      "Maria wakes up at seven o'clock every morning. She drinks a cup of coffee and reads the news for twenty minutes. Then she rides her bike to the office. In the evening she cooks dinner with her sister and they watch a movie together.",
    questions: [
      { prompt: "How does Maria get to work?", options: ["By car", "By bus", "By bike", "On foot"], correct: 2 },
      { prompt: "What does she do in the morning before work?", options: ["Cooks dinner", "Reads the news", "Watches a movie", "Rides with her sister"], correct: 1 },
    ],
  },
  {
    id: "r2",
    level: "B2",
    passage:
      "Although remote work has undeniable perks — flexibility, no commute, and quieter spaces — many employees report feeling isolated. Companies experimenting with hybrid schedules argue that a balance between office collaboration and home focus tends to yield higher productivity and stronger engagement over time.",
    questions: [
      { prompt: "According to the text, a downside of remote work is:", options: ["higher costs", "isolation", "longer commutes", "less flexibility"], correct: 1 },
      { prompt: "Hybrid schedules aim to combine:", options: ["office focus and home meetings", "collaboration and focus", "shorter days and lower pay", "isolation and productivity"], correct: 1 },
    ],
  },
];

/* ---------------- Listening (4 — text played via TTS) ---------------- */
export const LISTENING: ListeningItem[] = [
  {
    id: "l1",
    level: "A1",
    audio: "My name is Tom. I am ten years old and I live in London.",
    prompt: "How old is Tom?",
    options: ["Eight", "Ten", "Eleven", "Twelve"],
    correct: 1,
  },
  {
    id: "l2",
    level: "A2",
    audio: "The train to Manchester leaves at half past three from platform seven.",
    prompt: "What time does the train leave?",
    options: ["3:00", "3:15", "3:30", "3:45"],
    correct: 2,
  },
  {
    id: "l3",
    level: "B1",
    audio:
      "If you'd like a refund, please keep your receipt and return the item within fourteen days of purchase.",
    prompt: "To get a refund you must:",
    options: [
      "return the item after fourteen days",
      "keep the receipt and return it within fourteen days",
      "call customer service",
      "email the store",
    ],
    correct: 1,
  },
  {
    id: "l4",
    level: "B2",
    audio:
      "Despite the initial setbacks, the research team eventually managed to replicate the results, which strengthened the credibility of their earlier findings.",
    prompt: "What eventually happened?",
    options: [
      "The team gave up",
      "The findings were disproved",
      "The team replicated the results",
      "The setbacks continued",
    ],
    correct: 2,
  },
];

/* ---------------- Writing (2 prompts) ---------------- */
export const WRITING: WritingPrompt[] = [
  {
    id: "w1",
    level: "A2",
    prompt: "Describe your typical day in 3–5 sentences. Use the present simple tense.",
    minWords: 10,
  },
  {
    id: "w2",
    level: "B2",
    prompt:
      "In one short paragraph, argue whether people should learn a second language and why. Give at least two reasons.",
    minWords: 10,
  },
];

/* ---------------- Speaking (2 prompts) ---------------- */
export const SPEAKING: SpeakingPrompt[] = [
  {
    id: "s1",
    level: "A2",
    prompt: "Introduce yourself. Say your name, where you are from, and one hobby you enjoy.",
    minWords: 10,
  },
  {
    id: "s2",
    level: "B2",
    prompt:
      "Talk for 30–60 seconds about the last book, film, or trip you enjoyed and explain why you liked it.",
    minWords: 10,
  },
];

/* ---------------- Pronunciation (3 sentences to read aloud) ---------------- */
export const PRONUNCIATION: PronunciationItem[] = [
  { id: "p1", level: "A1", sentence: "The weather is beautiful today." },
  { id: "p2", level: "B1", sentence: "She thoroughly enjoyed the challenging thriller." },
  { id: "p3", level: "B2", sentence: "Entrepreneurs often navigate unpredictable circumstances." },
];

/* ---------------- Helpers ---------------- */

// Weight per CEFR level for computing weighted percentage per skill.
export const CEFR_WEIGHT: Record<Cefr, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };

export function scorePercentageToCefr(pct: number): Cefr {
  if (pct >= 90) return "C2";
  if (pct >= 78) return "C1";
  if (pct >= 65) return "B2";
  if (pct >= 50) return "B1";
  if (pct >= 30) return "A2";
  return "A1";
}
