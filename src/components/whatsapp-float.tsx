import { MessageCircle } from "lucide-react";
import { useLocale } from "@/lib/i18n";

export const WHATSAPP_NUMBER = "244929193415";

export function whatsappUrl(message?: string) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function WhatsAppFloat() {
  const { locale } = useLocale();
  const msg =
    locale === "pt"
      ? "Olá Coach! Quero saber mais sobre as aulas de inglês."
      : "Hi Coach! I'd like to know more about your English lessons.";
  return (
    <a
      href={whatsappUrl(msg)}
      target="_blank"
      rel="noreferrer"
      aria-label="WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3 font-semibold text-white shadow-glow transition-transform hover:scale-105"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden sm:inline">WhatsApp</span>
    </a>
  );
}
