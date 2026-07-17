export type AgeGroup = "kids" | "teens" | "adults";

export interface YoutubeResource {
  title: { pt: string; en: string };
  url: string;
  channel: string;
  level: string;
}

export const youtubeByAge: Record<AgeGroup, YoutubeResource[]> = {
  kids: [
    {
      title: { pt: "ABC Phonics Song", en: "ABC Phonics Song" },
      url: "https://www.youtube.com/watch?v=BELlZKpi1Zs",
      channel: "Super Simple Songs",
      level: "A1",
    },
    {
      title: { pt: "Cores e Números", en: "Colors & Numbers" },
      url: "https://www.youtube.com/watch?v=qhOTU8_1Af4",
      channel: "Cocomelon",
      level: "A1",
    },
    {
      title: { pt: "Animais da Fazenda", en: "Farm Animals" },
      url: "https://www.youtube.com/watch?v=EwIOkOibTgM",
      channel: "Super Simple Songs",
      level: "A1",
    },
  ],
  teens: [
    {
      title: { pt: "Inglês com músicas pop", en: "Learn English with Pop Songs" },
      url: "https://www.youtube.com/watch?v=juFZh8Y2NnI",
      channel: "Learn English with TV Series",
      level: "A2–B1",
    },
    {
      title: { pt: "Conversação para adolescentes", en: "Everyday Teen Conversations" },
      url: "https://www.youtube.com/watch?v=6q1lF2wYlgY",
      channel: "English Addict with Mr Duncan",
      level: "B1",
    },
    {
      title: { pt: "Gramática essencial (BBC)", en: "Essential Grammar (BBC)" },
      url: "https://www.youtube.com/watch?v=Y8Ge6r7bYQ0",
      channel: "BBC Learning English",
      level: "A2–B2",
    },
  ],
  adults: [
    {
      title: { pt: "Business English", en: "Business English" },
      url: "https://www.youtube.com/watch?v=Unzc731iCUY",
      channel: "Business English Pod",
      level: "B2–C1",
    },
    {
      title: { pt: "Preparação IELTS", en: "IELTS Preparation" },
      url: "https://www.youtube.com/watch?v=eHjB2hjBQ2Y",
      channel: "IELTS Liz",
      level: "B2–C1",
    },
    {
      title: { pt: "Pronúncia avançada (RP)", en: "Advanced Pronunciation (RP)" },
      url: "https://www.youtube.com/watch?v=n4Iv3vlANQ8",
      channel: "English with Lucy",
      level: "C1–C2",
    },
  ],
};
