import { Badge } from "@/components/ui/badge";
import { STATUS_META, type QualStatus } from "@/lib/status";

export function StatusBadge({ status }: { status: QualStatus }) {
  const m = STATUS_META[status];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}
