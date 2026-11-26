import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { STATUS_META, type QualStatus } from "@/lib/status";
import { PageHeader } from "@/components/app/AppShell";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    const { data } = await supabase.rpc("has_role", { _user_id: u.user!.id, _role: "admin" });
    if (!data) throw redirect({ to: "/dashboard" });
  },
  head: () => ({ meta: [{ title: "Reviewer admin — SkillProof" }, { name: "description", content: "Review submissions and update statuses." }, { property: "og:title", content: "Admin — SkillProof" }, { property: "og:description", content: "Review submissions." }] }),
  component: Admin,
});

function Admin() {
  const [filter, setFilter] = useState<QualStatus | "all">("all");
  const [search, setSearch] = useState("");
  const { data = [] } = useQuery({
    queryKey: ["admin-quals"],
    queryFn: async () => {
      const [q, p] = await Promise.all([
        supabase.from("qualifications").select("*, qualification_documents(count)").order("updated_at", { ascending: false }),
        supabase.from("profiles").select("id, full_name, email"),
      ]);
      const pm = new Map((p.data ?? []).map((x) => [x.id, x]));
      return (q.data ?? []).map((x) => ({ ...x, owner: pm.get(x.user_id) }));
    },
  });
  const counts = Object.fromEntries((Object.keys(STATUS_META) as QualStatus[]).map((s) => [s, data.filter((d) => d.status === s).length]));
  const rows = data.filter((d) => (filter === "all" || d.status === filter) && `${d.title} ${d.owner?.full_name} ${d.owner?.email} ${d.country}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Reviewer dashboard" subtitle="Platform document review — completeness and organisation checks only." />
      <div className="mb-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {(Object.keys(STATUS_META) as QualStatus[]).map((s) => (
          <button key={s} onClick={() => setFilter(filter === s ? "all" : s)} className={`rounded-xl border bg-card p-4 text-left shadow-card transition ${filter === s ? "border-teal" : ""}`}>
            <p className="font-display text-2xl font-bold text-primary">{counts[s]}</p>
            <p className="text-xs text-muted-foreground">{STATUS_META[s].label}</p>
          </button>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap gap-3">
        <Input placeholder="Search applicant, title, country…" className="max-w-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={filter} onValueChange={(v) => setFilter(v as QualStatus | "all")}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All statuses</SelectItem>{(Object.keys(STATUS_META) as QualStatus[]).map((s) => <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="overflow-x-auto rounded-2xl border bg-card shadow-card">
        <Table>
          <TableHeader><TableRow><TableHead>Applicant</TableHead><TableHead>Qualification</TableHead><TableHead>Target</TableHead><TableHead>Docs</TableHead><TableHead>Updated</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No submissions match.</TableCell></TableRow>}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell><p className="font-medium">{r.owner?.full_name || "—"}</p><p className="text-xs text-muted-foreground">{r.owner?.email}</p></TableCell>
                <TableCell><Link to="/qualifications/$id" params={{ id: r.id }} className="font-medium text-teal hover:underline">{r.title}</Link><p className="text-xs text-muted-foreground">{r.institution}, {r.country}</p></TableCell>
                <TableCell className="text-sm">{r.target_occupation}</TableCell>
                <TableCell>{(r.qualification_documents as unknown as { count: number }[])[0]?.count ?? 0}</TableCell>
                <TableCell className="text-sm">{format(new Date(r.updated_at), "d MMM yyyy")}</TableCell>
                <TableCell><StatusBadge status={r.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
