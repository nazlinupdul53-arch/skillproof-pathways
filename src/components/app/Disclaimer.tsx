import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function Disclaimer({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex gap-3 rounded-xl border border-warning/30 bg-warning-soft p-4 text-sm", className)}>
      <ShieldAlert className="mt-0.5 size-5 shrink-0 text-warning" />
      <div className="text-foreground">
        <p className="font-semibold">Platform review is not official recognition</p>
        {!compact && (
          <p className="mt-1 text-muted-foreground">
            SkillProof reviewers check that your documents are complete, legible and well organised. We do not verify
            authenticity or grant recognition. Official qualification assessment is only made by the relevant
            government-approved assessing authority or professional regulator.
          </p>
        )}
      </div>
    </div>
  );
}
