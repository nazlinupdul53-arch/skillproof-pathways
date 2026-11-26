import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/use-me";
import { OCCUPATIONS } from "@/lib/status";
import { uploadDocument, DOC_TYPES } from "@/lib/documents";
import { PageHeader } from "@/components/app/AppShell";
import { Disclaimer } from "@/components/app/Disclaimer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/qualifications/new")({
  head: () => ({ meta: [{ title: "Add qualification — SkillProof" }, { name: "description", content: "Submit a qualification with documents." }, { property: "og:title", content: "Add qualification — SkillProof" }, { property: "og:description", content: "Submit a qualification with documents." }] }),
  component: NewQual,
});

const LEVELS = ["Certificate", "Diploma", "Bachelor", "Master", "Doctorate", "Professional licence"];

function NewQual() {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ title: "", institution: "", country: "", field: "", level: "Bachelor", year_completed: "", target_country: "Australia", target_occupation: OCCUPATIONS[0]!, notes: "" });
  const [files, setFiles] = useState<{ file: File; type: string }[]>([]);
  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!me) return;
    setBusy(true);
    const { data: q, error } = await supabase.from("qualifications").insert({
      ...f, year_completed: f.year_completed ? Number(f.year_completed) : null, user_id: me.user.id,
    }).select().single();
    if (error || !q) { setBusy(false); { toast.error(error?.message ?? "Failed"); return; } }
    for (const x of files) {
      try { await uploadDocument(me.user.id, q.id, x.file, x.type); } catch (err) { toast.error(`${x.file.name}: ${(err as Error).message}`); }
    }
    qc.invalidateQueries();
    toast.success("Qualification submitted for platform review");
    navigate({ to: "/qualifications/$id", params: { id: q.id } });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Add a qualification" subtitle="Tell us about the credential and attach supporting documents." />
      <form onSubmit={submit} className="space-y-6">
        <div className="grid gap-4 rounded-2xl border bg-card p-6 shadow-card sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2"><Label>Qualification title</Label><Input required placeholder="e.g. Bachelor of Science in Nursing" value={f.title} onChange={(e) => set("title")(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Institution</Label><Input required value={f.institution} onChange={(e) => set("institution")(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Country of study</Label><Input required value={f.country} onChange={(e) => set("country")(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Field of study</Label><Input value={f.field} onChange={(e) => set("field")(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Level</Label>
            <Select value={f.level} onValueChange={set("level")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Year completed</Label><Input type="number" min={1950} max={2030} value={f.year_completed} onChange={(e) => set("year_completed")(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Target country</Label><Input value={f.target_country} onChange={(e) => set("target_country")(e.target.value)} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Target occupation</Label>
            <Select value={f.target_occupation} onValueChange={set("target_occupation")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{OCCUPATIONS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Notes for reviewer</Label><Textarea value={f.notes} onChange={(e) => set("notes")(e.target.value)} /></div>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-card">
          <h2 className="font-semibold text-primary">Supporting documents</h2>
          <p className="text-sm text-muted-foreground">PDF or image, up to 10 MB each. Stored privately.</p>
          <Input className="mt-4" type="file" multiple accept="application/pdf,image/*" onChange={(e) => setFiles([...files, ...Array.from(e.target.files ?? []).map((file) => ({ file, type: "Certificate" }))])} />
          <ul className="mt-4 space-y-2">
            {files.map((x, i) => (
              <li key={i} className="flex items-center gap-3 rounded-lg bg-muted p-2 text-sm">
                <span className="flex-1 truncate">{x.file.name}</span>
                <Select value={x.type} onValueChange={(v) => setFiles(files.map((y, j) => (j === i ? { ...y, type: v } : y)))}>
                  <SelectTrigger className="w-44 bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent>{DOC_TYPES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
                <button type="button" className="text-destructive" onClick={() => setFiles(files.filter((_, j) => j !== i))}>Remove</button>
              </li>
            ))}
          </ul>
        </div>
        <Disclaimer compact />
        <Button type="submit" size="lg" disabled={busy}>{busy ? "Submitting…" : "Submit for platform review"}</Button>
      </form>
    </div>
  );
}
