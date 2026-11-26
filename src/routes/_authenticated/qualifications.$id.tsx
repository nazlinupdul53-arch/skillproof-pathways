import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, Download, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/use-me";
import { STATUS_META, type QualStatus } from "@/lib/status";
import { DOC_TYPES, openDocument, uploadDocument } from "@/lib/documents";
import { PageHeader } from "@/components/app/AppShell";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Disclaimer } from "@/components/app/Disclaimer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/qualifications/$id")({
  head: () => ({ meta: [{ title: "Qualification details — SkillProof" }, { name: "description", content: "Status, documents and review notes." }, { property: "og:title", content: "Qualification — SkillProof" }, { property: "og:description", content: "Status, documents and review notes." }] }),
  component: Detail,
});

function Detail() {
  const { id } = Route.useParams();
  const { data: me } = useMe();
  const qc = useQueryClient();
  const key = ["qual", id];
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const [q, d, h] = await Promise.all([
        supabase.from("qualifications").select("*").eq("id", id).maybeSingle(),
        supabase.from("qualification_documents").select("*").eq("qualification_id", id).order("created_at"),
        supabase.from("status_history").select("*").eq("qualification_id", id).order("created_at", { ascending: false }),
      ]);
      const owner = q.data ? (await supabase.from("profiles").select("full_name,email,country_of_origin").eq("id", q.data.user_id).maybeSingle()).data : null;
      return { q: q.data, docs: d.data ?? [], history: h.data ?? [], owner };
    },
  });
  const [docType, setDocType] = useState("Certificate");
  const [status, setStatus] = useState<QualStatus | "">("");
  const [note, setNote] = useState("");
  const refresh = () => qc.invalidateQueries();

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  const q = data?.q;
  if (!q) return <p>Qualification not found.</p>;
  const isOwner = q.user_id === me?.user.id;

  const upload = async (files: FileList | null) => {
    if (!files) return;
    for (const f of Array.from(files)) {
      try { await uploadDocument(me!.user.id, q.id, f, docType); toast.success(`Uploaded ${f.name}`); } catch (e) { toast.error((e as Error).message); }
    }
    refresh();
  };
  const removeDoc = async (docId: string, path: string) => {
    await supabase.storage.from("credentials").remove([path]);
    await supabase.from("qualification_documents").delete().eq("id", docId);
    refresh();
  };
  const setOwnStatus = async (s: QualStatus) => {
    const { error } = await supabase.from("qualifications").update({ status: s }).eq("id", q.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Updated"); refresh();
  };
  const review = async () => {
    if (!status) { toast.error("Choose a status"); return; }
    const { error } = await supabase.from("qualifications").update({ status, reviewer_notes: note }).eq("id", q.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Status updated"); setNote(""); refresh();
  };

  return (
    <div className="mx-auto max-w-5xl">
      <Link to={me?.isAdmin && !isOwner ? "/admin" : "/qualifications"} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" /> Back</Link>
      <PageHeader title={q.title} subtitle={`${q.level} · ${q.institution}, ${q.country}${q.year_completed ? ` · ${q.year_completed}` : ""}`} action={<StatusBadge status={q.status} />} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border bg-card p-6 shadow-card">
            <p className="text-sm text-muted-foreground">{STATUS_META[q.status].help}</p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Field</dt><dd className="font-medium">{q.field || "—"}</dd></div>
              <div><dt className="text-muted-foreground">Target</dt><dd className="font-medium">{q.target_occupation}, {q.target_country}</dd></div>
              {data?.owner && !isOwner && <div><dt className="text-muted-foreground">Applicant</dt><dd className="font-medium">{data.owner.full_name} · {data.owner.email}</dd></div>}
              {q.notes && <div className="sm:col-span-2"><dt className="text-muted-foreground">Applicant notes</dt><dd>{q.notes}</dd></div>}
            </dl>
            {q.reviewer_notes && (
              <div className="mt-4 rounded-xl bg-teal-soft p-4 text-sm"><p className="font-semibold text-secondary-foreground">Reviewer note</p><p className="mt-1">{q.reviewer_notes}</p></div>
            )}
            {isOwner && (
              <div className="mt-4 flex flex-wrap gap-2">
                {q.status === "info_requested" && <Button size="sm" onClick={() => setOwnStatus("submitted")}>Resubmit for review</Button>}
                {q.status !== "withdrawn" && <Button size="sm" variant="outline" onClick={() => setOwnStatus("withdrawn")}>Withdraw</Button>}
              </div>
            )}
          </div>
          <div className="rounded-2xl border bg-card p-6 shadow-card">
            <h2 className="font-semibold text-primary">Documents</h2>
            {data!.docs.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No documents uploaded yet.</p> : (
              <ul className="mt-3 divide-y">
                {data!.docs.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 py-3 text-sm">
                    <FileText className="size-5 text-teal" />
                    <div className="min-w-0 flex-1"><p className="truncate font-medium">{d.file_name}</p><p className="text-xs text-muted-foreground">{d.doc_type} · {Math.round((d.file_size ?? 0) / 1024)} KB</p></div>
                    <Button size="icon" variant="ghost" aria-label="Open" onClick={() => openDocument(d.file_path).catch((e) => toast.error(e.message))}><Download /></Button>
                    {isOwner && <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => removeDoc(d.id, d.file_path)}><Trash2 /></Button>}
                  </li>
                ))}
              </ul>
            )}
            {isOwner && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Select value={docType} onValueChange={setDocType}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent>{DOC_TYPES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
                <Input type="file" multiple accept="application/pdf,image/*" className="max-w-xs" onChange={(e) => upload(e.target.files)} />
              </div>
            )}
          </div>
          {me?.isAdmin && (
            <div className="rounded-2xl border-2 border-teal bg-card p-6 shadow-card">
              <h2 className="font-semibold text-primary">Reviewer actions</h2>
              <p className="text-sm text-muted-foreground">Check completeness and legibility only. Do not mark anything as officially recognised.</p>
              <div className="mt-4 space-y-3">
                <Select value={status} onValueChange={(v) => setStatus(v as QualStatus)}>
                  <SelectTrigger><SelectValue placeholder="New status" /></SelectTrigger>
                  <SelectContent>{(Object.keys(STATUS_META) as QualStatus[]).map((s) => <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>)}</SelectContent>
                </Select>
                <Textarea placeholder="Note to the applicant (shown on their timeline)" value={note} onChange={(e) => setNote(e.target.value)} />
                <Button onClick={review}>Update status</Button>
              </div>
            </div>
          )}
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl border bg-card p-6 shadow-card">
            <h2 className="font-semibold text-primary">Timeline</h2>
            <ol className="mt-4 space-y-4 border-l-2 border-teal/30 pl-4">
              {data!.history.map((h) => (
                <li key={h.id} className="relative">
                  <span className="absolute -left-[23px] top-1 size-3 rounded-full bg-teal" />
                  <p className="text-sm font-medium">{STATUS_META[h.status].label}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(h.created_at), "d MMM yyyy, HH:mm")}</p>
                  {h.note && <p className="mt-1 text-sm text-muted-foreground">{h.note}</p>}
                </li>
              ))}
            </ol>
          </div>
          <Disclaimer />
        </div>
      </div>
    </div>
  );
}
