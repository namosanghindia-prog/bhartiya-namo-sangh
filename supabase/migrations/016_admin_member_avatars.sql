-- Let admins replace the profile photo of any member.
--
-- Avatars live in the public 'avatars' bucket under `<member id>/avatar-*.ext`,
-- and the existing policies only ever let a member write inside their own
-- folder. Admins need the same access across every folder so they can fix or
-- supply a photo for an approved member who cannot do it themselves.
--
-- These are additive: storage policies are OR'd, so a member's own upload
-- rights are untouched.

-- Idempotent, and harmless if the bucket was created from the dashboard.
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Listing a member's folder is what removeSupersededAvatars() needs in order
-- to clear out the photos a new upload replaced.
DROP POLICY IF EXISTS "Admins can read member avatars" ON storage.objects;
CREATE POLICY "Admins can read member avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars' AND is_admin());

DROP POLICY IF EXISTS "Admins can upload member avatars" ON storage.objects;
CREATE POLICY "Admins can upload member avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND is_admin());

DROP POLICY IF EXISTS "Admins can update member avatars" ON storage.objects;
CREATE POLICY "Admins can update member avatars" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND is_admin());

DROP POLICY IF EXISTS "Admins can delete member avatars" ON storage.objects;
CREATE POLICY "Admins can delete member avatars" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND is_admin());
