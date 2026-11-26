import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { BookOpen, FileText, Gauge, LogOut, Shield, Sparkles, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/use-me";
import { Logo } from "./Logo";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: Gauge },
  { to: "/qualifications", label: "Qualifications", icon: FileText },
  { to: "/skills", label: "Skills profile", icon: Sparkles },
  { to: "/courses", label: "Courses", icon: BookOpen },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
  const linkCls =
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
  const active = { className: "bg-sidebar-accent text-sidebar-accent-foreground" };
  return (
    <div className="min-h-screen md:flex">
      <aside className="bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 flex flex-col">
        <div className="flex items-center justify-between p-4 md:p-6">
          <Link to="/"><Logo light /></Link>
          <button onClick={signOut} className="md:hidden text-sidebar-foreground" aria-label="Sign out"><LogOut className="size-5" /></button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:pb-0">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className={linkCls} activeProps={active}>
              <n.icon className="size-4" /> <span className="whitespace-nowrap">{n.label}</span>
            </Link>
          ))}
          {me?.isAdmin && (
            <Link to="/admin" className={linkCls} activeProps={active}>
              <Shield className="size-4" /> <span className="whitespace-nowrap">Reviewer admin</span>
            </Link>
          )}
        </nav>
        <div className="mt-auto hidden border-t border-sidebar-border p-4 md:block">
          <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">{me?.profile?.full_name || "Your account"}</p>
          <p className="truncate text-xs text-sidebar-foreground/70">{me?.user.email}</p>
          <button onClick={signOut} className="mt-3 flex items-center gap-2 text-sm text-sidebar-foreground/80 hover:text-sidebar-accent-foreground">
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 px-4 py-6 md:px-10 md:py-10">{children}</main>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-primary md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
