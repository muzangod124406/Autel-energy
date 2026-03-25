import { pool } from "./db";

let supabase: any = null;

export const BUCKETS = {
  BLOG: "blog-images",
  FILES: "user-files",
};

function tryInitSupabaseClient() {
  try {
    const dbUrl = process.env.SUPABASE_DATABASE_URL || "";
    let supabaseUrl = "";

    const poolerMatch = dbUrl.match(/postgres\.([^:@]+)/);
    if (poolerMatch) supabaseUrl = `https://${poolerMatch[1]}.supabase.co`;

    const directMatch = dbUrl.match(/@db\.([^.]+)\.supabase\.co/);
    if (directMatch) supabaseUrl = `https://${directMatch[1]}.supabase.co`;

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
    console.log("[Supabase Storage] Variables non configurées, stockage Supabase désactivé.");
    return;
  }

  try {
    for (const bucket of Object.values(BUCKETS)) {
      await pool.query(`
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES ($1, $1, true, 10485760, '{image/jpeg,image/png,image/webp,image/gif}')
        ON CONFLICT (id) DO UPDATE SET public = true
      `, [bucket]);
    }

    const bucketList = Object.values(BUCKETS).map(b => `'${b}'`).join(", ");

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'app_allow_insert'
        ) THEN
          CREATE POLICY "app_allow_insert" ON storage.objects
          FOR INSERT WITH CHECK (bucket_id IN (${bucketList}));
        END IF;
      END $$;
    `);

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'app_allow_select'
        ) THEN
          CREATE POLICY "app_allow_select" ON storage.objects
          FOR SELECT USING (bucket_id IN (${bucketList}));
        END IF;
      END $$;
    `);

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'app_allow_delete'
        ) THEN
          CREATE POLICY "app_allow_delete" ON storage.objects
          FOR DELETE USING (bucket_id IN (${bucketList}));
        END IF;
      END $$;
    `);

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
  if (!supabase) throw new Error("Supabase non configuré");

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, buffer, { contentType: mimeType, upsert: true });

  if (error) throw new Error(`Upload Supabase échoué: ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}
