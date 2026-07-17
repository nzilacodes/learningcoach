import { createFileRoute, Link } from "@tanstack/react-router";
import { Wrench } from "lucide-react";

export const Route = createFileRoute("/maintenance")({
  component: MaintenancePage,
  head: () => ({
    meta: [
      { title: "Manutenção — Learning English with Coach" },
      { name: "description", content: "Estamos a fazer melhorias. Voltamos em breve." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function MaintenancePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-6">
      <div className="max-w-lg rounded-3xl border border-slate-100 bg-white p-12 text-center shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100 text-[#0EA5A4]">
          <Wrench className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-[#0F172A]">
          Estamos a fazer melhorias
        </h1>
        <p className="mt-3 text-slate-600">
          A plataforma <strong>Learning English with Coach</strong> está temporariamente em manutenção.
          Voltamos em alguns minutos.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center rounded-xl bg-[#0EA5A4] px-6 py-3 text-sm font-bold text-white hover:bg-[#14B8A6]"
        >
          Tentar novamente
        </Link>
      </div>
    </div>
  );
}
