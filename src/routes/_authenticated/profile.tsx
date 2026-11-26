import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/use-me";
import { OCCUPATIONS } from "@/lib/status";
import { PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — SkillProof" }, { name: "description", content: "Manage your personal profile." }, { property: "og:title", content: "Profile — SkillProof" }, { property: "og:description", content: "Manage your personal profile." }] }),
  component: Profile,
});

const fields = [
  ["full_name", "Full name"], ["phone", "Phone"], ["country_of_origin", "Country where you qualified"], ["current_country", "Country you live in now"], ["profession", "Profession"],
] as const;
type F = Record<(typeof fields)[number][0] | "bio", string>;

function Profile() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [form, setForm] = useState<F>({ full_name: "", phone: "", country_of_origin: "", current_country: "", profession: "", bio: "" });
  useEffect(() => {
    const p = me?.profile;
    if (p) setForm({ full_name: p.full_name ?? "", phone: p.phone ?? "", country_of_origin: p.country_of_origin ?? "", current_country: p.current_country ?? "", profession: p.profession ?? "", bio: p.bio ?? "" });
  }, [me?.profile]);
  const save = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("profiles").update({ ...form, updated_at: new Date().toISOString() }).eq("id", me!.user.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile saved");
    qc.invalidateQueries({ queryKey: ["me"] });
  };
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Your profile" subtitle={me?.user.email ?? ""} />
      <form onSubmit={save} className="grid gap-4 rounded-2xl border bg-card p-6 shadow-card sm:grid-cols-2">
        {fields.map(([k, l]) => (
          <div key={k} className="space-y-1.5">
            <Label htmlFor={k}>{l}</Label>
            <Input id={k} list={k === "profession" ? "occs" : undefined} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
          </div>
        ))}
        <datalist id="occs">{OCCUPATIONS.map((o) => <option key={o} value={o} />)}</datalist>
        <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="bio">Professional summary</Label><Textarea id="bio" rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
        <div className="sm:col-span-2"><Button type="submit">Save profile</Button></div>
      </form>
    </div>
  );
}
