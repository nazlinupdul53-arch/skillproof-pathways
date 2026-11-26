import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, FileCheck2, LineChart, ShieldCheck, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/app/Logo";
import { Disclaimer } from "@/components/app/Disclaimer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SkillProof — Get your overseas qualifications ready for recognition" },
      { name: "description", content: "Organise academic credentials, demonstrate practical skills and find bridging and re-certification courses." },
      { property: "og:title", content: "SkillProof — Credential & skills readiness for migrants" },
      { property: "og:description", content: "Organise credentials, prove skills, and plan your path to official recognition." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Upload, title: "Secure document vault", text: "Upload degrees, transcripts and licences to private, encrypted storage only you and reviewers can open." },
  { icon: Sparkles, title: "Competency profiles", text: "Self-assess against occupation frameworks and record evidence of practical experience." },
  { icon: LineChart, title: "Status tracking", text: "Follow every submission from upload to platform review with a full timeline." },
  { icon: BookOpen, title: "Bridging pathways", text: "Get bridging and re-certification courses ranked against your skill gaps." },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <section className="bg-hero text-navy-foreground">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <Logo light />
          <div className="flex gap-2">
            <Button asChild variant="heroOutline"><Link to="/auth">Sign in</Link></Button>
            <Button asChild variant="teal"><Link to="/auth" search={{ mode: "signup" }}>Get started</Link></Button>
          </div>
        </header>
        <div className="mx-auto grid max-w-6xl gap-12 px-6 pb-24 pt-12 md:grid-cols-2 md:pt-20">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-navy-foreground/20 px-3 py-1 text-xs font-medium">
              <ShieldCheck className="size-4 text-teal" /> Built for internationally qualified professionals
            </p>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              Your skills crossed the border. <span className="text-teal">Now prove them.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-navy-foreground/80">
              SkillProof helps you organise credentials, map your competencies and see exactly which bridging steps
              stand between you and official recognition.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="teal"><Link to="/auth" search={{ mode: "signup" }}>Create free account <ArrowRight /></Link></Button>
            </div>
          </div>
          <div className="rounded-2xl border border-navy-foreground/15 bg-navy-foreground/5 p-6 backdrop-blur">
            <p className="text-sm text-navy-foreground/70">Bachelor of Nursing · University of Manila</p>
            <div className="mt-4 space-y-3">
              {["Submitted", "Under platform review", "Information requested", "Platform review complete"].map((s, i) => (
                <div key={s} className="flex items-center gap-3">
                  <span className={`grid size-7 place-items-center rounded-full text-xs font-bold ${i < 3 ? "bg-teal text-accent-foreground" : "border border-navy-foreground/30"}`}>{i + 1}</span>
                  <span className={i < 3 ? "" : "text-navy-foreground/60"}>{s}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl bg-navy-foreground/10 p-4 text-sm">
              <p className="font-semibold">Recommended next step</p>
              <p className="text-navy-foreground/75">Bridging Program for Internationally Qualified Nurses · 12 weeks</p>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-6 shadow-card">
              <f.icon className="size-6 text-teal" />
              <h3 className="mt-4 font-semibold text-primary">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-16 grid items-center gap-8 md:grid-cols-2">
          <div>
            <FileCheck2 className="size-8 text-teal" />
            <h2 className="mt-3 text-2xl font-bold text-primary">Preparation, not certification</h2>
            <p className="mt-3 text-muted-foreground">
              We help you arrive at the official assessing authority with a complete, well-organised file — saving time
              and avoiding rejected applications. The decision itself always stays with the authority.
            </p>
          </div>
          <Disclaimer />
        </div>
      </section>
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">© 2026 SkillProof · Not affiliated with any government assessing authority</footer>
    </div>
  );
}
