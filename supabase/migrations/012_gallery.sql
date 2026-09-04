-- Photo gallery: admin-curated folders, each holding a set of images.
--
-- Folders are the unit the public gallery page lists; images live inside one
-- folder and are ordered by sort_order. Files themselves go to the
-- 'gallery-images' storage bucket (created at the bottom of this file) — the
-- rows here only hold the public URL plus the storage path we need in order to
-- delete the object again.

-- ============================================
-- is_admin() helper
-- ============================================
-- Earlier migrations already call is_admin(); it was created directly in the
-- database rather than in a migration file. Create it only when it is missing
-- so this migration also works on a freshly bootstrapped project, and never
-- clobber an existing definition.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'is_admin' AND p.pronargs = 0
  ) THEN
    EXECUTE $fn$
      CREATE FUNCTION public.is_admin()
      RETURNS BOOLEAN
      LANGUAGE sql
      STABLE
      SECURITY DEFINER
      SET search_path = public
      AS $body$
        SELECT EXISTS (
          SELECT 1 FROM members
          WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        );
      $body$;
    $fn$;
  END IF;
END
$$;

-- ============================================
-- GALLERY FOLDERS
-- ============================================
CREATE TABLE IF NOT EXISTS gallery_folders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  description  TEXT,

  -- Chosen cover. The FK is added after gallery_images exists; when the cover
  -- image is deleted this falls back to NULL and the UI shows the first image.
  cover_image_id UUID,

  -- Unpublished folders stay admin-only, so a folder can be filled with images
  -- before it appears on the public gallery page.
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order   INTEGER NOT NULL DEFAULT 0,

  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- GALLERY IMAGES
-- ============================================
CREATE TABLE IF NOT EXISTS gallery_images (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id    UUID NOT NULL REFERENCES gallery_folders(id) ON DELETE CASCADE,

  -- Public URL served to the browser, plus the bucket-relative path so the
  -- object can be removed from storage when the row goes away.
  image_url    TEXT NOT NULL,
  storage_path TEXT NOT NULL,

  caption      TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,

  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'gallery_folders_cover_image_fkey'
  ) THEN
    ALTER TABLE gallery_folders
      ADD CONSTRAINT gallery_folders_cover_image_fkey
      FOREIGN KEY (cover_image_id) REFERENCES gallery_images(id) ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_gallery_folders_published ON gallery_folders(is_published, sort_order);
CREATE INDEX IF NOT EXISTS idx_gallery_images_folder     ON gallery_images(folder_id, sort_order);

DROP TRIGGER IF EXISTS gallery_folders_updated_at ON gallery_folders;
CREATE TRIGGER gallery_folders_updated_at
  BEFORE UPDATE ON gallery_folders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE gallery_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published folders are viewable by everyone" ON gallery_folders;
CREATE POLICY "Published folders are viewable by everyone" ON gallery_folders
  FOR SELECT USING (is_published);

DROP POLICY IF EXISTS "Admins can manage all gallery folders" ON gallery_folders;
CREATE POLICY "Admins can manage all gallery folders" ON gallery_folders
  FOR ALL USING (is_admin());

-- An image is public exactly when its folder is.
DROP POLICY IF EXISTS "Images in published folders are viewable by everyone" ON gallery_images;
CREATE POLICY "Images in published folders are viewable by everyone" ON gallery_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM gallery_folders f
      WHERE f.id = gallery_images.folder_id AND f.is_published
    )
  );

DROP POLICY IF EXISTS "Admins can manage all gallery images" ON gallery_images;
CREATE POLICY "Admins can manage all gallery images" ON gallery_images
  FOR ALL USING (is_admin());

-- ============================================
-- STORAGE BUCKET
-- ============================================
-- Public bucket so gallery photos can be served straight from their public URL.
-- If your role cannot write to storage.* from the SQL editor, create a public
-- bucket named 'gallery-images' from the Storage dashboard instead — the
-- policies below are the only other thing this section does.
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery-images', 'gallery-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Gallery images are publicly readable" ON storage.objects;
CREATE POLICY "Gallery images are publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'gallery-images');

DROP POLICY IF EXISTS "Admins can upload gallery images" ON storage.objects;
CREATE POLICY "Admins can upload gallery images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'gallery-images' AND is_admin());

DROP POLICY IF EXISTS "Admins can update gallery images" ON storage.objects;
CREATE POLICY "Admins can update gallery images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'gallery-images' AND is_admin());

DROP POLICY IF EXISTS "Admins can delete gallery images" ON storage.objects;
CREATE POLICY "Admins can delete gallery images" ON storage.objects
  FOR DELETE USING (bucket_id = 'gallery-images' AND is_admin());
