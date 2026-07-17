import type { AgeTheme } from "@/lib/age-theme";

export type AgeGroup = AgeTheme; // "kids" | "teens" | "adults"

export const ageFromYears = (age: number | null | undefined): AgeGroup => {
  if (age == null) return "adults";
  if (age <= 12) return "kids";
  if (age <= 17) return "teens";
  return "adults";
};

export const AGE_GROUP_LABEL: Record<AgeGroup, { pt: string; en: string; range: string }> = {
  kids: { pt: "Crianças", en: "Kids", range: "6–12 anos" },
  teens: { pt: "Adolescentes", en: "Teens", range: "13–17 anos" },
  adults: { pt: "Adultos", en: "Adults", range: "18+" },
};

export interface AgeTrack {
  hero: { pt: string; en: string };
  tagline: { pt: string; en: string };
  color: string; // tailwind gradient
  themes: Array<{ emoji: string; pt: string; en: string }>;
  vocabulary: Array<{ word: string; pt: string; emoji: string }>;
  examples: Array<{ en: string; pt: string }>;
  games: Array<{ pt: string; en: string; emoji: string; xp: number }>;
  exercises: Array<{ pt: string; en: string; icon: string }>;
  videos: Array<{ title: { pt: string; en: string }; url: string; channel: string; level: string }>;
  images: string[]; // emoji-based image tokens for lightweight visuals
}

export const AGE_TRACKS: Record<AgeGroup, AgeTrack> = {
  kids: {
    hero: { pt: "Aventura em Inglês", en: "English Adventure" },
    tagline: {
      pt: "Aprender inglês brincando com bichos, cores, música e histórias.",
      en: "Learn English by playing with animals, colors, music and stories.",
    },
    color: "from-amber-400 via-pink-400 to-violet-500",
    themes: [
      { emoji: "🐶", pt: "Animais", en: "Animals" },
      { emoji: "🎨", pt: "Cores & Formas", en: "Colors & Shapes" },
      { emoji: "🔢", pt: "Números 1–20", en: "Numbers 1–20" },
      { emoji: "🍎", pt: "Comidas", en: "Foods" },
      { emoji: "👨‍👩‍👧", pt: "Família", en: "Family" },
      { emoji: "🚗", pt: "Transportes", en: "Transport" },
      { emoji: "🌦️", pt: "Tempo", en: "Weather" },
      { emoji: "🎵", pt: "Canções", en: "Songs" },
    ],
    vocabulary: [
      { word: "dog", pt: "cachorro", emoji: "🐶" },
      { word: "cat", pt: "gato", emoji: "🐱" },
      { word: "apple", pt: "maçã", emoji: "🍎" },
      { word: "sun", pt: "sol", emoji: "☀️" },
      { word: "ball", pt: "bola", emoji: "⚽" },
      { word: "book", pt: "livro", emoji: "📚" },
      { word: "car", pt: "carro", emoji: "🚗" },
      { word: "star", pt: "estrela", emoji: "⭐" },
    ],
    examples: [
      { en: "The cat is on the mat.", pt: "O gato está no tapete." },
      { en: "I like red apples!", pt: "Eu gosto de maçãs vermelhas!" },
      { en: "Look at the big yellow sun.", pt: "Olha o grande sol amarelo." },
      { en: "One, two, three — let's count with me!", pt: "Um, dois, três — conta comigo!" },
    ],
    games: [
      { pt: "Jogo da Memória", en: "Memory Match", emoji: "🧠", xp: 30 },
      { pt: "Arrastar Animais", en: "Drag the Animals", emoji: "🐾", xp: 25 },
      { pt: "Colorir com Palavras", en: "Color the Word", emoji: "🎨", xp: 20 },
      { pt: "Karaokê ABC", en: "ABC Karaoke", emoji: "🎤", xp: 40 },
      { pt: "Encontra a Figura", en: "Find the Picture", emoji: "🔎", xp: 25 },
      { pt: "Puzzle das Frutas", en: "Fruit Puzzle", emoji: "🍓", xp: 30 },
    ],
    exercises: [
      { pt: "Ouvir e apontar a figura", en: "Listen and point", icon: "👂" },
      { pt: "Repetir a palavra", en: "Repeat the word", icon: "🗣️" },
      { pt: "Combinar palavra e imagem", en: "Match word to picture", icon: "🧩" },
      { pt: "Cantar a canção do abc", en: "Sing the ABC song", icon: "🎵" },
    ],
    videos: [
      {
        title: { pt: "Canção do ABC (Phonics)", en: "ABC Phonics Song" },
        url: "https://www.youtube.com/watch?v=BELlZKpi1Zs",
        channel: "Super Simple Songs",
        level: "A1",
      },
      {
        title: { pt: "Cores & Números", en: "Colors & Numbers" },
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
    images: ["🐶", "🐱", "🌈", "⭐", "🎈", "🍭", "🚂", "🎨"],
  },

  teens: {
    hero: { pt: "Inglês da Vida Real", en: "Real-Life English" },
    tagline: {
      pt: "Vocabulário de séries, música pop, redes sociais e escola.",
      en: "Vocabulary from series, pop music, social media and school.",
    },
    color: "from-sky-500 via-indigo-500 to-fuchsia-500",
    themes: [
      { emoji: "🎧", pt: "Música Pop & Séries", en: "Pop Music & Series" },
      { emoji: "📱", pt: "Redes Sociais", en: "Social Media" },
      { emoji: "🏫", pt: "Escola & Amigos", en: "School & Friends" },
      { emoji: "⚽", pt: "Esportes & Hobbies", en: "Sports & Hobbies" },
      { emoji: "🎮", pt: "Gaming", en: "Gaming" },
      { emoji: "✈️", pt: "Viagens", en: "Travel" },
      { emoji: "💬", pt: "Gírias & Slang", en: "Slang" },
      { emoji: "🎬", pt: "Cinema", en: "Movies" },
    ],
    vocabulary: [
      { word: "vibe", pt: "clima/energia", emoji: "✨" },
      { word: "crush", pt: "paixão", emoji: "💘" },
      { word: "playlist", pt: "playlist", emoji: "🎵" },
      { word: "stream", pt: "transmitir", emoji: "📺" },
      { word: "goals", pt: "objetivos", emoji: "🎯" },
      { word: "trend", pt: "tendência", emoji: "📈" },
      { word: "meme", pt: "meme", emoji: "😂" },
      { word: "post", pt: "publicação", emoji: "📸" },
    ],
    examples: [
      { en: "That song is such a vibe.", pt: "Aquela música tem uma energia incrível." },
      { en: "Did you see the latest meme?", pt: "Você viu o meme mais recente?" },
      { en: "I’m binge-watching a new series tonight.", pt: "Vou maratonar uma série nova hoje." },
      { en: "Let’s hang out after class.", pt: "Vamos sair depois da aula." },
    ],
    games: [
      { pt: "Lyric Challenge", en: "Lyric Challenge", emoji: "🎤", xp: 60 },
      { pt: "Escape da Escola", en: "School Escape", emoji: "🏫", xp: 70 },
      { pt: "Slang Duel", en: "Slang Duel", emoji: "⚔️", xp: 55 },
      { pt: "Chat Simulator", en: "Chat Simulator", emoji: "💬", xp: 45 },
      { pt: "Quiz Relâmpago", en: "Speed Quiz", emoji: "⚡", xp: 80 },
      { pt: "Reels Legendados", en: "Caption the Reel", emoji: "📱", xp: 50 },
    ],
    exercises: [
      { pt: "Legendar cenas de série", en: "Caption a scene", icon: "🎬" },
      { pt: "Responder em chat simulado", en: "Reply in chat sim", icon: "💬" },
      { pt: "Interpretar letras de música", en: "Interpret lyrics", icon: "🎵" },
      { pt: "Debate curto (2 min)", en: "Short 2-min debate", icon: "🎙️" },
    ],
    videos: [
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
    images: ["🎧", "📱", "🎮", "🏫", "✈️", "🎬", "⚽", "💬"],
  },

  adults: {
    hero: { pt: "Inglês Profissional & Global", en: "Professional & Global English" },
    tagline: {
      pt: "Business, viagens, entrevistas, IELTS/TOEFL e networking.",
      en: "Business, travel, interviews, IELTS/TOEFL and networking.",
    },
    color: "from-slate-700 via-emerald-600 to-teal-500",
    themes: [
      { emoji: "💼", pt: "Business English", en: "Business English" },
      { emoji: "🧑‍💻", pt: "Entrevistas de Emprego", en: "Job Interviews" },
      { emoji: "🌍", pt: "Viagens & Cultura", en: "Travel & Culture" },
      { emoji: "📊", pt: "Reuniões & Apresentações", en: "Meetings & Presentations" },
      { emoji: "🎓", pt: "Preparação IELTS/TOEFL", en: "IELTS/TOEFL Prep" },
      { emoji: "🤝", pt: "Networking", en: "Networking" },
      { emoji: "📧", pt: "E-mails & Escrita", en: "Emails & Writing" },
      { emoji: "🗞️", pt: "Notícias & Debate", en: "News & Debate" },
    ],
    vocabulary: [
      { word: "stakeholder", pt: "parte interessada", emoji: "🤝" },
      { word: "deadline", pt: "prazo", emoji: "⏰" },
      { word: "leverage", pt: "alavancar", emoji: "📈" },
      { word: "onboarding", pt: "integração", emoji: "🧭" },
      { word: "compliance", pt: "conformidade", emoji: "📋" },
      { word: "revenue", pt: "receita", emoji: "💰" },
      { word: "milestone", pt: "marco", emoji: "🏁" },
      { word: "outcome", pt: "resultado", emoji: "🎯" },
    ],
    examples: [
      { en: "Let’s circle back on this next week.", pt: "Vamos retomar isso na próxima semana." },
      { en: "I’d like to walk you through the proposal.", pt: "Gostaria de guiá-lo pela proposta." },
      { en: "We need alignment with all stakeholders.", pt: "Precisamos de alinhamento com todos os envolvidos." },
      { en: "Could you elaborate on that point?", pt: "Poderia elaborar mais sobre esse ponto?" },
    ],
    games: [
      { pt: "Simulador de Entrevista", en: "Interview Simulator", emoji: "🧑‍💻", xp: 100 },
      { pt: "Negociação de Contrato", en: "Contract Negotiation", emoji: "📝", xp: 90 },
      { pt: "Pitch de 60 segundos", en: "60-second Pitch", emoji: "🎤", xp: 80 },
      { pt: "E-mail Profissional", en: "Professional Email", emoji: "📧", xp: 60 },
      { pt: "Reunião Global", en: "Global Meeting", emoji: "🌍", xp: 85 },
      { pt: "IELTS Speaking Drills", en: "IELTS Speaking Drills", emoji: "🎓", xp: 95 },
    ],
    exercises: [
      { pt: "Escrever e-mail formal", en: "Write a formal email", icon: "📧" },
      { pt: "Apresentar em 2 minutos", en: "2-minute presentation", icon: "🎤" },
      { pt: "Debater notícia atual", en: "Debate a current article", icon: "🗞️" },
      { pt: "Simulação de reunião", en: "Meeting role-play", icon: "📊" },
    ],
    videos: [
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
    images: ["💼", "🌍", "📊", "🧑‍💻", "🎓", "📧", "🤝", "🗞️"],
  },
};
