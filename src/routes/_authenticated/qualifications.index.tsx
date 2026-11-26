import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/use-me";
import { PageHeader } from "@/components/app/AppShell";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/qualifications/")({
  head: () => ({ meta: [{ title: "Qualifications — SkillProof" }, { name: "description", content: "Your submitted qualifications." }, { property: "og:title", content: "Qualifications — SkillProof" }, { property: "og:description", content: "Your submitted qualifications." }] }),
  component: List,
});

function List() {
  const { data: me } = useMe();
  const { data = [], isLoading } = useQuery({
    queryKey: ["quals", me?.user.id],
    enabled: !!me,
    queryFn: async () => (await supabase.from("qualifications").select("*, qualification_documents(count)").eq("user_id", me!.user.id).order("created_at", { ascending: false })).data ?? [],
  });
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Qualifications" subtitle="Track every credential you've submitted for platform review." action={<Button asChild variant="teal"><Link to="/qualifications/new"><Plus /> Add qualification</Link></Button>} />
      {isLoading ? <p className="text-muted-foreground">Loading…</p> : data.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">No qualifications yet. Add your first one to start your file.</div>
      ) : (
        <div className="grid gap-4">
          {data.map((q) => (
            <Link key={q.id} to="/qualifications/$id" params={{ id: q.id }} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-5 shadow-card transition hover:border-teal">
              <div>
                <p className="font-semibold text-primary">{q.title}</p>
                <p className="text-sm text-muted-foreground">{q.level} · {q.institution}, {q.country}{q.year_completed ? ` · ${q.year_completed}` : ""}</p>
                <p className="mt-1 text-xs text-muted-foreground">Target: {q.target_occupation} in {q.target_country} · {(q.qualification_documents as unknown as { count: number }[])[0]?.count ?? 0} documents</p>
              </div>
              <StatusBadge status={q.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
