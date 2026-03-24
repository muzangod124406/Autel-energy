import { createClient } from "@supabase/supabase-js";
import { pool } from "./db";

function getSupabaseProjectUrl(): string {
  const dbUrl = process.env.SUPABASE_DATABASE_URL || "";
  const poolerMatch = dbUrl.match(/postgres\.([^:@]+)/);
  if (poolerMatch) return `https://${poolerMatch[1]}.supabase.co`;
  const directMatch = dbUrl.match(/@db\.([^.]+)\.supabase\.co/);
  if (directMatch) return `https://${directMatch[1]}.supabase.co`;
  throw new Error("Impossible de dériver l'URL Supabase depuis DATABASE_URL");
}

const supabaseUrl = getSupabaseProjectUrl();
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseKey);

export const BUCKETS = {
  BLOG: "blog-images",
  FILES: "user-files",
};

export async function initSupabaseStorage() {
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
  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, buffer, { contentType: mimeType, upsert: true });

  if (error) throw new Error(`Upload Supabase échoué: ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}
