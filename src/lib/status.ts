import type { Database } from "@/integrations/supabase/types";

export type QualStatus = Database["public"]["Enums"]["qual_status"];

export const STATUS_META: Record<
  QualStatus,
  { label: string; variant: "info" | "teal" | "warning" | "success" | "muted"; help: string }
> = {
  submitted: { label: "Submitted", variant: "info", help: "Received by SkillProof and waiting for a reviewer." },
  under_review: { label: "Under platform review", variant: "teal", help: "A SkillProof reviewer is checking your documents for completeness." },
  info_requested: { label: "Information requested", variant: "warning", help: "The reviewer needs more information or documents from you." },
  review_complete: { label: "Platform review complete", variant: "success", help: "Your file is complete and organised. This is not official recognition." },
  referred: { label: "Ready for official assessment", variant: "success", help: "Prepared for you to lodge with the relevant official assessing authority." },
  withdrawn: { label: "Withdrawn", variant: "muted", help: "This submission was withdrawn." },
};

export const STATUS_ORDER: QualStatus[] = ["submitted", "under_review", "info_requested", "review_complete", "referred"];

export const OCCUPATIONS = ["Registered Nurse", "Civil Engineer", "Software Developer", "Accountant", "Teacher"];
