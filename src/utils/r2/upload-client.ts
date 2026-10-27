import { requestUpload } from "@/app/actions/upload";

export async function uploadMedia(
  file: File,
  kind: "image" | "video",
  folder: "recipes" | "avatars" | "tips" | "collections"
): Promise<{ url: string | null; error: string | null }> {
  const res = await requestUpload(kind, folder, file.type, file.size);
  if (res.error) return { url: null, error: res.error };

  const put = await fetch(res.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!put.ok) return { url: null, error: "Upload thất bại, thử lại." };

  return { url: res.publicUrl, error: null };
}