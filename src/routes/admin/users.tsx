import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/i18n";
import { apiFetch } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { AdminDataTable, type AdminDataTableColumn } from "@/components/admin/admin-data-table";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPage,
  head: () => ({
    meta: [{ title: "Alunos — Admin" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

type AdminUser = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  age: number | null;
  cefr_level: string | null;
  created_at: string;
};

function roomFor(age: number | null) {
  if (age == null) return "—";
  return age < 13 ? "Kids" : age < 18 ? "Teens" : "Adults";
}

function AdminUsersPage() {
  const { locale } = useLocale();
  const { user, isAdmin } = useAuth();
  const { data: users = [] } = useQuery({
    queryKey: ["admin_users"],
    enabled: !!user && isAdmin,
    queryFn: async () =>
      (await apiFetch<{ items: AdminUser[] }>("/v1/admin/users?limit=200")).items,
  });

  const columns: AdminDataTableColumn<AdminUser>[] = [
    {
      key: "name",
      header: locale === "pt" ? "Nome" : "Name",
      sortable: true,
      sortValue: (u) => u.full_name ?? "",
      render: (u) => <span className="font-medium">{u.full_name || "—"}</span>,
    },
    { key: "email", header: "Email", render: (u) => <span className="text-xs">{u.email || "—"}</span> },
    {
      key: "phone",
      header: locale === "pt" ? "Telefone" : "Phone",
      render: (u) => <span className="text-xs">{u.phone || "—"}</span>,
    },
    {
      key: "country",
      header: locale === "pt" ? "País" : "Country",
      render: (u) => <span className="text-xs">{u.country || "—"}</span>,
    },
    {
      key: "age",
      header: locale === "pt" ? "Idade" : "Age",
      sortable: true,
      sortValue: (u) => u.age ?? -1,
      render: (u) => u.age ?? "—",
    },
    {
      key: "room",
      header: locale === "pt" ? "Sala" : "Room",
      render: (u) => <Badge variant="outline">{roomFor(u.age)}</Badge>,
    },
    {
      key: "cefr",
      header: "CEFR",
      sortable: true,
      sortValue: (u) => u.cefr_level ?? "",
      render: (u) => <Badge variant="outline">{u.cefr_level || "—"}</Badge>,
    },
    {
      key: "created_at",
      header: locale === "pt" ? "Registo" : "Joined",
      sortable: true,
      sortValue: (u) => u.created_at,
      render: (u) => (
        <span className="text-xs text-muted-foreground">
          {new Date(u.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-ink">
          {locale === "pt" ? "Alunos" : "Learners"}
        </h2>
        <span className="text-xs text-muted-foreground">
          {users.length} {locale === "pt" ? "registados" : "registered"}
        </span>
      </div>
      <AdminDataTable
        columns={columns}
        data={users}
        getRowId={(u) => u.id}
        getSearchText={(u) => `${u.full_name ?? ""} ${u.email ?? ""}`}
        searchPlaceholder={locale === "pt" ? "Pesquisar por nome ou email…" : "Search by name or email…"}
        emptyLabel={locale === "pt" ? "Sem alunos" : "No learners"}
      />
    </div>
  );
}
