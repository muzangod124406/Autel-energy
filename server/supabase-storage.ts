import path from "path";
import fs from "fs";

let supabase: any = null;

export const BUCKETS = {
  BLOG: "blog-images",
  FILES: "user-files",
};

function tryInitSupabaseClient() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_ANON_KEY || "";

    if (!supabaseUrl || !supabaseKey) return null;

    const { createClient } = require("@supabase/supabase-js");
    return createClient(supabaseUrl, supabaseKey);
  } catch {
    return null;
  }
}

supabase = tryInitSupabaseClient();

export { supabase };

export async function initSupabaseStorage() {
  if (!supabase) {
    console.log("[Storage] Supabase non configuré, utilisation du stockage local.");
    const uploadsDir = path.join(process.cwd(), "client", "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    return;
  }

  try {
    for (const bucket of Object.values(BUCKETS)) {
      const { error } = await supabase.storage.createBucket(bucket, { public: true });
      if (error && !error.message?.includes("already exists")) {
        console.error(`[Supabase Storage] Erreur création bucket ${bucket}:`, error.message);
      }
    }
    console.log("[Supabase Storage] Buckets initialisés:", Object.values(BUCKETS).join(", "));
  } catch (e: any) {
    console.error("[Supabase Storage] Erreur init:", e.message);
  }
}

export async function uploadToSupabase(
  bucket: string,
  filePath: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (!supabase) {
    const uploadsDir = path.join(process.cwd(), "client", "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const safeFileName = filePath.replace(/\//g, "_");
    const localPath = path.join(uploadsDir, safeFileName);
    fs.writeFileSync(localPath, buffer);
    return `/uploads/${safeFileName}`;
  }

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, buffer, { contentType: mimeType, upsert: true });

  if (error) throw new Error(`Upload Supabase échoué: ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}
