import { supabase } from "@/integrations/supabase/client";

export const DOC_TYPES = ["Certificate", "Academic transcript", "Professional licence", "Employment reference", "Identity document", "English test result", "Other"];

export async function uploadDocument(userId: string, qualId: string, file: File, docType: string) {
  if (file.size > 10 * 1024 * 1024) throw new Error("File is larger than 10 MB");
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${userId}/${qualId}/${Date.now()}-${safe}`;
  const { error } = await supabase.storage.from("credentials").upload(path, file, { contentType: file.type });
  if (error) throw error;
  const { error: e2 } = await supabase.from("qualification_documents").insert({
    qualification_id: qualId, user_id: userId, doc_type: docType, file_name: file.name, file_path: path, file_size: file.size,
  });
  if (e2) throw e2;
}

export async function openDocument(path: string) {
  const { data, error } = await supabase.storage.from("credentials").createSignedUrl(path, 60);
  if (error) throw error;
  window.open(data.signedUrl, "_blank", "noopener");
}
