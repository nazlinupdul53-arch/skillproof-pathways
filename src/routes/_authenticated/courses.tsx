import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Clock, MapPin, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/use-me";
import { OCCUPATIONS } from "@/lib/status";
import { recommendCourses } from "@/lib/recommend";
import { PageHeader } from "@/components/app/AppShell";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/courses")({
  head: () => ({ meta: [{ title: "Course recommendations — SkillProof" }, { name: "description", content: "Bridging and re-certification courses matched to your skill gaps." }, { property: "og:title", content: "Courses — SkillProof" }, { property: "og:description", content: "Bridging and re-certification courses." }] }),
  component: Courses,
});

function Courses() {
  const { data: me } = useMe();
  const [tab, setTab] = useState("recommended");
  const { data } = useQuery({
    queryKey: ["courses", me?.user.id],
    enabled: !!me,
    queryFn: async () => {
      const [c, q, a] = await Promise.all([
        supabase.from("courses").select("*"),
        supabase.from("qualifications").select("target_occupation").eq("user_id", me!.user.id),
        supabase.from("skill_assessments").select("rating, competencies(occupation, area)").eq("user_id", me!.user.id),
      ]);
      return { courses: c.data ?? [], occs: (q.data ?? []).map((x) => x.target_occupation), ratings: (a.data ?? []).map((x) => ({ rating: x.rating, occupation: x.competencies?.occupation ?? "", area: x.competencies?.area ?? "" })) };
    },
  });
  const occs = [...new Set([...(data?.occs ?? []), ...(OCCUPATIONS.includes(me?.profile?.profession ?? "") ? [me!.profile!.profession!] : [])])];
  const recs = data ? recommendCourses(data.courses, occs, data.ratings) : [];
  const list = tab === "recommended" ? recs : (data?.courses ?? []).filter((c) => c.occupation === tab).map((course) => ({ course, score: 0, reasons: [] as string[] }));

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Bridging & re-certification courses" subtitle="Courses ranked by your target occupation and self-assessed skill gaps." />
      <Tabs value={tab} onValueChange={setTab} className="mb-6"><TabsList className="flex-wrap h-auto">
        <TabsTrigger value="recommended">Recommended for you</TabsTrigger>
        {OCCUPATIONS.map((o) => <TabsTrigger key={o} value={o}>{o}</TabsTrigger>)}
      </TabsList></Tabs>
      {tab === "recommended" && recs.length === 0 && (
        <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">Add a qualification or set your profession on your profile to get personalised recommendations.</div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {list.map(({ course: c, reasons }) => (
          <div key={c.id} className="flex flex-col rounded-2xl border bg-card p-5 shadow-card">
            <div className="flex flex-wrap gap-2"><Badge variant={c.course_type === "Bridging" ? "teal" : "info"}>{c.course_type}</Badge><Badge variant="muted">{c.occupation}</Badge></div>
            <h3 className="mt-3 font-semibold text-primary">{c.title}</h3>
            <p className="text-sm text-muted-foreground">{c.provider}</p>
            <p className="mt-2 text-sm">{c.description}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="size-3" /> {c.duration_weeks} weeks</span>
              <span className="flex items-center gap-1"><MapPin className="size-3" /> {c.delivery}</span>
              <span className="flex items-center gap-1"><Wallet className="size-3" /> {c.cost_estimate}</span>
            </div>
            {reasons.length > 0 && <ul className="mt-3 space-y-1 border-t pt-3 text-xs text-secondary-foreground">{reasons.map((r) => <li key={r}>• {r}</li>)}</ul>}
          </div>
        ))}
      </div>
      <p className="mt-6 text-xs text-muted-foreground">Course details are indicative demo listings. Always confirm with the provider and your assessing authority which courses they accept.</p>
    </div>
  );
}
