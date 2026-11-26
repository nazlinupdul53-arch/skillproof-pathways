import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/use-me";
import { OCCUPATIONS } from "@/lib/status";
import { PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/skills")({
  head: () => ({ meta: [{ title: "Skills profile — SkillProof" }, { name: "description", content: "Assess your competencies against occupation frameworks." }, { property: "og:title", content: "Skills profile — SkillProof" }, { property: "og:description", content: "Assess your competencies." }] }),
  component: Skills,
});

const LEVELS = ["", "Beginner", "Developing", "Competent", "Proficient", "Expert"];
type Row = { rating: number; years: string; evidence: string };

function Skills() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [occ, setOcc] = useState<string>("");
  useEffect(() => { if (!occ && me) setOcc(OCCUPATIONS.includes(me.profile?.profession ?? "") ? me.profile!.profession! : OCCUPATIONS[0]!); }, [me, occ]);
  const { data } = useQuery({
    queryKey: ["skills", me?.user.id],
    enabled: !!me,
    queryFn: async () => {
      const [c, a] = await Promise.all([
        supabase.from("competencies").select("*").order("sort"),
        supabase.from("skill_assessments").select("*").eq("user_id", me!.user.id),
      ]);
      return { comps: c.data ?? [], ass: a.data ?? [] };
    },
  });
  const comps = useMemo(() => data?.comps.filter((c) => c.occupation === occ) ?? [], [data, occ]);
  const [rows, setRows] = useState<Record<string, Row>>({});
  useEffect(() => {
    const r: Record<string, Row> = {};
    for (const c of comps) {
      const a = data?.ass.find((x) => x.competency_id === c.id);
      r[c.id] = { rating: a?.rating ?? 0, years: a ? String(a.years_experience) : "", evidence: a?.evidence ?? "" };
    }
    setRows(r);
  }, [comps, data]);

  const save = async () => {
    const payload = comps.filter((c) => (rows[c.id]?.rating ?? 0) > 0).map((c) => ({
      user_id: me!.user.id, competency_id: c.id, rating: rows[c.id]!.rating, years_experience: Number(rows[c.id]!.years || 0), evidence: rows[c.id]!.evidence, updated_at: new Date().toISOString(),
    }));
    if (!payload.length) { toast.error("Rate at least one competency"); return; }
    const { error } = await supabase.from("skill_assessments").upsert(payload, { onConflict: "user_id,competency_id" });
    if (error) { toast.error(error.message); return; }
    toast.success("Competency profile saved");
    qc.invalidateQueries();
  };

  const chart = comps.map((c) => ({ area: c.area, rating: rows[c.id]?.rating ?? 0 }));
  const rated = chart.filter((c) => c.rating > 0);
  const avg = rated.length ? rated.reduce((s, c) => s + c.rating, 0) / rated.length : 0;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Skills & competency profile" subtitle="Self-assess against the competency areas employers and assessing bodies typically look for." action={
        <Select value={occ} onValueChange={setOcc}><SelectTrigger className="w-56"><SelectValue /></SelectTrigger><SelectContent>{OCCUPATIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>
      } />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          {comps.map((c) => {
            const r = rows[c.id] ?? { rating: 0, years: "", evidence: "" };
            const upd = (p: Partial<Row>) => setRows({ ...rows, [c.id]: { ...r, ...p } });
            return (
              <div key={c.id} className="rounded-2xl border bg-card p-5 shadow-card">
                <p className="font-semibold text-primary">{c.area}</p>
                <p className="text-sm text-muted-foreground">{c.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => upd({ rating: n })} className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${r.rating === n ? "border-teal bg-teal text-accent-foreground" : "hover:border-teal"}`}>
                      {n} · {LEVELS[n]}
                    </button>
                  ))}
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-[120px_1fr]">
                  <Input type="number" min={0} step={0.5} placeholder="Years" value={r.years} onChange={(e) => upd({ years: e.target.value })} />
                  <Input placeholder="Evidence (e.g. 4 yrs ICU at St Luke's Hospital)" value={r.evidence} onChange={(e) => upd({ evidence: e.target.value })} />
                </div>
              </div>
            );
          })}
          <Button onClick={save} size="lg">Save assessment</Button>
        </div>
        <div className="lg:col-span-2">
          <div className="sticky top-6 rounded-2xl border bg-card p-6 shadow-card">
            <h2 className="font-semibold text-primary">Competency profile</h2>
            <p className="text-sm text-muted-foreground">{rated.length}/{comps.length} areas rated · average {avg.toFixed(1)}/5</p>
            <div className="h-72">
              <ResponsiveContainer>
                <RadarChart data={chart} outerRadius="70%">
                  <PolarGrid stroke="var(--color-border)" />
                  <PolarAngleAxis dataKey="area" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} />
                  <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
                  <Radar dataKey="rating" stroke="var(--color-teal)" fill="var(--color-teal)" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground">Self-assessment helps you plan. It is not a formal skills assessment.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
