import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, MessageSquare, Phone, MapPin, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site-url";
import { apiFetch, ApiError } from "@/lib/api/client";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: "Contacto — Learning English with Coach" },
      {
        name: "description",
        content:
          "Fale com a equipa da LEWC. Suporte, parcerias e dúvidas sobre planos de inglês do A1 ao C2.",
      },
      { property: "og:title", content: "Contacto — Learning English with Coach" },
      {
        property: "og:description",
        content: "Envie a sua mensagem. Respondemos em menos de 24h.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/contact` }],
  }),
});

function ContactPage() {
  const { locale } = useLocale();
  const pt = locale === "pt";
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error(
        pt ? "Preencha todos os campos obrigatórios." : "Please fill all required fields.",
      );
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/v1/contact", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: form.subject || undefined,
          message: form.message,
        }),
      });
      setForm({ name: "", email: "", subject: "", message: "" });
      toast.success(
        pt ? "Mensagem enviada! Respondemos em breve." : "Message sent! We'll reply soon.",
      );
    } catch (err) {
      const msg =
        err instanceof ApiError && err.status === 429
          ? pt
            ? "Muitas tentativas. Tente novamente em alguns minutos."
            : "Too many attempts. Please try again in a few minutes."
          : pt
            ? "Não foi possível enviar. Tente novamente."
            : "Couldn't send your message. Please try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const channels = [
    {
      icon: Mail,
      title: "E-mail",
      value: "silvinogomes1992@gmail.com",
      href: "mailto:silvinogomes1992@gmail.com",
    },
    {
      icon: Phone,
      title: pt ? "Telefone / WhatsApp" : "Phone / WhatsApp",
      value: "+244 900 000 000",
      href: "tel:+244900000000",
    },
    {
      icon: MapPin,
      title: pt ? "Localização" : "Location",
      value: "Luanda, Angola",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl pt-28 pb-28 px-6 py-16">
        <section className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" /> {pt ? "Fale connosco" : "Get in touch"}
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            {pt ? "Como podemos ajudar?" : "How can we help?"}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            {pt
              ? "Suporte, parcerias, dúvidas sobre planos ou feedback — respondemos em menos de 24 horas."
              : "Support, partnerships, plan questions or feedback — we reply within 24 hours."}
          </p>
        </section>

        <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-4">
            {channels.map((c) => (
              <div key={c.title} className="glass rounded-2xl p-5 shadow-card">
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-sunset flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-soft">
                    <c.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {c.title}
                    </div>
                    {c.href ? (
                      <a href={c.href} className="text-lg font-semibold hover:underline">
                        {c.value}
                      </a>
                    ) : (
                      <div className="text-lg font-semibold">{c.value}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">{pt ? "Nome" : "Name"} *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="subject">{pt ? "Assunto" : "Subject"}</Label>
              <Input
                id="subject"
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              />
            </div>
            <div className="mt-4">
              <Label htmlFor="message">{pt ? "Mensagem" : "Message"} *</Label>
              <Textarea
                id="message"
                rows={6}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-gradient-sunset mt-6 w-full text-white shadow-soft hover:opacity-90"
              size="lg"
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {pt ? "Enviar mensagem" : "Send message"}
            </Button>
          </form>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
