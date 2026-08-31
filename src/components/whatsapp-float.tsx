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
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.52 3.48A11.83 11.83 0 0 0 12.09.01C5.55.01.23 5.33.23 11.88c0 2.09.55 4.13 1.59 5.93L.13 23.99l6.32-1.66a11.85 11.85 0 0 0 5.64 1.43h.01c6.54 0 11.86-5.32 11.86-11.87 0-3.17-1.23-6.15-3.44-8.41Zm-8.43 18.2h-.01a9.83 9.83 0 0 1-5.01-1.37l-.36-.21-3.75.98 1-3.66-.23-.38a9.83 9.83 0 0 1-1.51-5.16c0-5.42 4.41-9.83 9.84-9.83 2.63 0 5.1 1.03 6.96 2.89a9.78 9.78 0 0 1 2.88 6.97c0 5.42-4.41 9.83-9.81 9.83Zm5.4-7.37c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.74-1.64-2.04-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.21 5.09 4.5.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.08-.13-.28-.2-.58-.35Z" />
      </svg>
      <span className="hidden sm:inline">WhatsApp</span>
    </a>
  );
}
