import { BadgeCheck } from "lucide-react";
export function Logo({ light }: { light?: boolean }) {
  return (
    <span className={`flex items-center gap-2 font-display text-lg font-bold ${light ? "text-navy-foreground" : "text-primary"}`}>
      <span className="grid size-8 place-items-center rounded-lg bg-teal text-accent-foreground">
        <BadgeCheck className="size-5" />
      </span>
      SkillProof
    </span>
  );
}
