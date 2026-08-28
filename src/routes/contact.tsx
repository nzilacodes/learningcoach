import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LandingSiteHeader } from "@/components/landing-site-header";
import { SiteFooter } from "@/components/site-footer";
import { useLocale } from "@/lib/i18n";
import { useNotification } from "@/lib/notifications/notification-provider";
import { apiFetch } from "@/lib/api/client";
import { SITE_URL } from "@/lib/site-url";
import "@/styles/contact-page.css";

function contactSchema(pt: boolean) {
  return z.object({
    name: z.string().min(1, pt ? "Nome obrigatório" : "Name is required"),
    email: z
      .string()
      .min(1, pt ? "Email obrigatório" : "Email is required")
      .email(pt ? "Email inválido" : "Invalid email"),
    subject: z.string(),
    message: z.string().min(1, pt ? "Mensagem obrigatória" : "Message is required"),
  });
}

type ContactValues = z.infer<ReturnType<typeof contactSchema>>;

type FaqItem = { question: string; answer: string };

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: "Contacto — Learning English with Coach" },
      {
        name: "description",
        content: "Fale com a equipa da LEWC. Suporte, parcerias e dúvidas sobre planos de inglês do A1 ao C2.",
      },
      { property: "og:title", content: "Contacto — Learning English with Coach" },
      { property: "og:description", content: "Envie a sua mensagem. Respondemos em menos de 24h." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/contact` }],
  }),
});

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        fill="currentColor"
        d="M20.52 3.48A11.83 11.83 0 0 0 12.09.01C5.55.01.23 5.33.23 11.88c0 2.09.55 4.13 1.59 5.93L.13 23.99l6.32-1.66a11.85 11.85 0 0 0 5.64 1.43h.01c6.54 0 11.86-5.32 11.86-11.87 0-3.17-1.23-6.15-3.44-8.41Zm-8.43 18.2h-.01a9.83 9.83 0 0 1-5.01-1.37l-.36-.21-3.75.98 1-3.66-.23-.38a9.83 9.83 0 0 1-1.51-5.16c0-5.42 4.41-9.83 9.84-9.83 2.63 0 5.1 1.03 6.96 2.89a9.78 9.78 0 0 1 2.88 6.97c0 5.42-4.41 9.83-9.81 9.83Zm5.4-7.37c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.74-1.64-2.04-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.21 5.09 4.5.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.08-.13-.28-.2-.58-.35Z"
      />
    </svg>
  );
}

function ContactPage() {
  const { locale } = useLocale();
  const notify = useNotification();
  const pt = locale === "pt";
  const [submitting, setSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema(pt)),
    defaultValues: { name: "", email: "", subject: "", message: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await apiFetch("/v1/contact", {
        method: "POST",
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          subject: values.subject || undefined,
          message: values.message,
        }),
      });
      form.reset();
      notify.success(pt ? "Mensagem enviada! Respondemos em breve." : "Message sent! We'll reply soon.");
    } catch (err) {
      const normalized = notify.fromError(err, { dedupeKey: "contact:submit" });
      normalized.fieldPaths?.forEach((path) => {
        if (path === "name" || path === "email" || path === "subject" || path === "message") {
          form.setError(path, { type: "server", message: normalized.description });
        }
      });
    } finally {
      setSubmitting(false);
    }
  });

  const faqItems: FaqItem[] = pt
    ? [
        {
          question: "O LEWC serve para qualquer nível?",
          answer:
            "Sim. A jornada está alinhada ao CEFR, do A1 ao C2. O teste de colocação adapta aulas, vocabulário, listening e speaking ao teu nível.",
        },
        {
          question: "A IA substitui um professor?",
          answer:
            "Não. A AI Coach dá feedback imediato, enquanto professores conduzem aulas ao vivo, sessões 1:1 e feedback humano mais profundo.",
        },
        {
          question: "Posso aprender só pelo telemóvel?",
          answer:
            "Sim. Podes praticar pronúncia, listening, reading, speaking e rever aulas gravadas em qualquer dispositivo.",
        },
        {
          question: "Como funcionam os certificados?",
          answer:
            "Ao concluir um nível e cumprir os critérios de progresso, recebes um certificado LEWC alinhado ao CEFR com QR de validação.",
        },
        {
          question: "Há aulas ao vivo e gravadas?",
          answer:
            "Há as duas opções: grupos pequenos, sessões 1:1 e uma biblioteca gravada para estudar no teu ritmo.",
        },
      ]
    : [
        {
          question: "Is LEWC suitable for every level?",
          answer:
            "Yes. The journey follows CEFR from A1 to C2. The placement test adapts lessons, vocabulary, listening and speaking to your level.",
        },
        {
          question: "Does AI replace a teacher?",
          answer:
            "No. AI Coach gives instant feedback while teachers lead live classes, 1:1 sessions and deeper human feedback.",
        },
        {
          question: "Can I learn using only my phone?",
          answer:
            "Yes. You can practise pronunciation, listening, reading and speaking and review recorded lessons on any device.",
        },
        {
          question: "How do certificates work?",
          answer:
            "After completing a level and meeting the progress criteria, you receive a CEFR-aligned LEWC certificate with a validation QR code.",
        },
        {
          question: "Are there live and recorded lessons?",
          answer:
            "Both options are available: small groups, 1:1 sessions and a recorded library to study at your own pace.",
        },
      ];

  return (
    <div className="lewc-contact-shell">
      <LandingSiteHeader />
      <main className="lewc-contact-page">
        <section className="lewc-contact-hero">
          <div className="lewc-contact-eyebrow">{pt ? "Contacto" : "Contact"}</div>
          <h1>
            {pt ? "Como podemos " : "How can we "}
            <span>{pt ? "ajudar?" : "help?"}</span>
          </h1>
          <p>
            {pt
              ? "Suporte, parcerias, dúvidas sobre planos ou feedback respondemos em menos de 24 horas."
              : "Support, partnerships, plan questions or feedback we reply within 24 hours."}
          </p>
        </section>

        <section className="lewc-contact-zone">
          <aside className="lewc-contact-info">
            <h2>{pt ? "Fale connosco" : "Talk to us"}</h2>
            <p>
              {pt
                ? "Suporte, parcerias e dúvidas sobre planos estamos aqui para ajudar."
                : "Support, partnerships and plan questions we are here to help."}
            </p>
            <div className="lewc-contact-channels">
              <div className="lewc-contact-channel">
                <div className="lewc-contact-channel-label">E-mail</div>
                <a className="lewc-contact-channel-value" href="mailto:silvinogomes1992@gmail.com">
                  silvinogomes1992@gmail.com
                </a>
              </div>
              <div className="lewc-contact-channel">
                <div className="lewc-contact-channel-label">{pt ? "Telefone / WhatsApp" : "Phone / WhatsApp"}</div>
                <a className="lewc-contact-channel-value" href="https://wa.me/244929193415">
                  +244 929 193 415
                </a>
              </div>
              <div className="lewc-contact-channel">
                <div className="lewc-contact-channel-label">{pt ? "Localização" : "Location"}</div>
                <div className="lewc-contact-channel-value">Luanda, Angola</div>
              </div>
            </div>
            <a className="lewc-contact-whatsapp" href="https://wa.me/244929193415">
              <WhatsAppIcon />
              <span>WhatsApp</span>
            </a>
          </aside>

          <section className="lewc-contact-form">
            <div className="lewc-contact-form-head">
              <div>
                <h2>{pt ? "Envie uma mensagem" : "Send a message"}</h2>
              </div>
              <div className="lewc-contact-form-timing">
                {pt ? "Resposta em menos de 24h" : "Reply within 24h"}
              </div>
            </div>
            <Form {...form}>
              <form onSubmit={onSubmit} className="lewc-contact-form-grid">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="lewc-contact-field">
                      <FormLabel>{pt ? "Nome" : "Name"} *</FormLabel>
                      <FormControl>
                        <Input className="lewc-contact-input" autoComplete="name" placeholder={pt ? "O seu nome" : "Your name"} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="lewc-contact-field">
                      <FormLabel>E-mail *</FormLabel>
                      <FormControl>
                        <Input className="lewc-contact-input" type="email" autoComplete="email" placeholder="o.seu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem className="lewc-contact-field full">
                      <FormLabel>{pt ? "Assunto" : "Subject"}</FormLabel>
                      <FormControl>
                        <Input className="lewc-contact-input" placeholder={pt ? "Como podemos ajudar?" : "How can we help?"} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem className="lewc-contact-field full">
                      <FormLabel>{pt ? "Mensagem" : "Message"} *</FormLabel>
                      <FormControl>
                        <Textarea className="lewc-contact-textarea" rows={6} placeholder={pt ? "Escreva a sua mensagem..." : "Write your message..."} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="lewc-contact-submit-wrap full">
                  <button type="submit" className="lewc-contact-submit" disabled={submitting}>
                    {submitting && <Loader2 className="lewc-contact-spinner" aria-hidden="true" />}
                    {pt ? "Enviar mensagem" : "Send message"}
                  </button>
                  <p className="lewc-contact-help">
                    {pt ? "Os campos com * são obrigatórios. Respondemos em menos de 24 horas." : "Fields marked * are required. We reply within 24 hours."}
                  </p>
                </div>
              </form>
            </Form>
          </section>
        </section>

        <section className="lewc-contact-faq" aria-labelledby="contact-faq-heading">
          <div className="lewc-contact-faq-head">
            <div className="lewc-contact-eyebrow">FAQ</div>
            <h2 id="contact-faq-heading">
              {pt ? "Tens alguma dúvida? " : "Have a question? "}
              <span>{pt ? "Estamos aqui para ajudar." : "We are here to help."}</span>
            </h2>
          </div>
          <div className="lewc-contact-faq-list">
            {faqItems.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <article className={`lewc-contact-faq-item${isOpen ? " is-open" : ""}`} key={item.question}>
                  <button
                    type="button"
                    className="lewc-contact-faq-question lewc-contact-focus"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                  >
                    <span>{item.question}</span>
                    <span aria-hidden="true">+</span>
                  </button>
                  <div className="lewc-contact-faq-answer">{item.answer}</div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="lewc-contact-cta">
          <div className="lewc-contact-cta-panel">
            <h2>{pt ? "Começa a tua jornada hoje." : "Start your journey today."}</h2>
            <Link to="/auth">{pt ? "Começar grátis" : "Start for free"}&nbsp; →</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
