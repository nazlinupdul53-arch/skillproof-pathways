import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, FileText, Plus, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/use-me";
import { PageHeader } from "@/components/app/AppShell";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Disclaimer } from "@/components/app/Disclaimer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — SkillProof" }, { name: "description", content: "Your credential readiness overview." }, { property: "og:title", content: "Dashboard — SkillProof" }, { property: "og:description", content: "Your credential readiness overview." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: me } = useMe();
  const { data } = useQuery({
    queryKey: ["dashboard", me?.user.id],
    enabled: !!me,
    queryFn: async () => {
      const uid = me!.user.id;
      const [q, a, c, d] = await Promise.all([
        supabase.from("qualifications").select("*").eq("user_id", uid).order("updated_at", { ascending: false }),
        supabase.from("skill_assessments").select("rating").eq("user_id", uid),
        supabase.from("competencies").select("id, occupation"),
        supabase.from("qualification_documents").select("id").eq("user_id", uid),
      ]);
      return { quals: q.data ?? [], ratings: a.data ?? [], comps: c.data ?? [], docs: d.data?.length ?? 0 };
    },
  });
  const quals = data?.quals ?? [];
  const occs = new Set(quals.map((q) => q.target_occupation));
  const relevant = data?.comps.filter((c) => occs.has(c.occupation)).length ?? 0;
  const assessed = data?.ratings.length ?? 0;
  const avg = assessed ? (data!.ratings.reduce((s, r) => s + r.rating, 0) / assessed).toFixed(1) : "—";
  const profileFields = me?.profile ? [me.profile.full_name, me.profile.country_of_origin, me.profile.current_country, me.profile.profession, me.profile.phone] : [];
  const profilePct = Math.round((profileFields.filter(Boolean).length / 5) * 100);

  const stats = [
    { label: "Qualifications", value: quals.length, icon: FileText },
    { label: "Documents uploaded", value: data?.docs ?? 0, icon: FileText },
    { label: "Skills assessed", value: `${assessed}${relevant ? ` / ${relevant}` : ""}`, icon: Sparkles },
    { label: "Average self-rating", value: avg, icon: Sparkles },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={`Welcome${me?.profile?.full_name ? `, ${me.profile.full_name.split(" ")[0]}` : ""}`} subtitle="Here's where your recognition journey stands." action={<Button asChild variant="teal"><Link to="/qualifications/new"><Plus /> Add qualification</Link></Button>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-5 shadow-card">
            <s.icon className="size-5 text-teal" />
            <p className="mt-3 font-display text-2xl font-bold text-primary">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between"><h2 className="font-semibold text-primary">Recent submissions</h2><Link to="/qualifications" className="text-sm text-teal hover:underline">View all</Link></div>
          {quals.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <p>No qualifications yet.</p>
              <Button asChild className="mt-4" variant="outline"><Link to="/qualifications/new">Submit your first qualification</Link></Button>
            </div>
          ) : (
            <ul className="mt-4 divide-y">
              {quals.slice(0, 5).map((q) => (
                <li key={q.id}>
                  <Link to="/qualifications/$id" params={{ id: q.id }} className="flex items-center justify-between gap-4 py-3 hover:opacity-80">
                    <div className="min-w-0"><p className="truncate font-medium">{q.title}</p><p className="text-sm text-muted-foreground">{q.institution} · {q.country}</p></div>
                    <StatusBadge status={q.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl border bg-card p-6 shadow-card">
            <h2 className="font-semibold text-primary">Profile completeness</h2>
            <Progress value={profilePct} className="mt-4" />
            <p className="mt-2 text-sm text-muted-foreground">{profilePct}% complete</p>
            <Link to="/profile" className="mt-3 inline-flex items-center gap-1 text-sm text-teal hover:underline">Update profile <ArrowRight className="size-3" /></Link>
          </div>
          <div className="rounded-2xl bg-primary p-6 text-primary-foreground">
            <BookOpen className="size-5 text-teal" />
            <h2 className="mt-3 font-semibold">Find bridging courses</h2>
            <p className="mt-1 text-sm text-primary-foreground/75">Ranked against your skill gaps and target occupation.</p>
            <Button asChild variant="teal" size="sm" className="mt-4"><Link to="/courses">See recommendations</Link></Button>
          </div>
        </div>
      </div>
      <Disclaimer className="mt-6" />
    </div>
  );
}
