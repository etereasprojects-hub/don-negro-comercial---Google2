
-- Ensure the storage bucket for banners exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'banners',
  'banners',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop potentially conflicting or restrictive policies
DROP POLICY IF EXISTS "Public users can view banner images" ON storage.objects;
DROP POLICY IF EXISTS "Allow all users to upload banners" ON storage.objects;
DROP POLICY IF EXISTS "Allow all users to update banners" ON storage.objects;
DROP POLICY IF EXISTS "Allow all users to delete banners" ON storage.objects;

-- Create permissive policies for the banners bucket
-- SELECT: Everyone can view
CREATE POLICY "Public users can view banner images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banners');

-- INSERT: Anyone can upload (secured by application logic/admin panel access)
CREATE POLICY "Allow all users to upload banners"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'banners');

-- UPDATE: Anyone can update
CREATE POLICY "Allow all users to update banners"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'banners')
  WITH CHECK (bucket_id = 'banners');

-- DELETE: Anyone can delete
CREATE POLICY "Allow all users to delete banners"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'banners');
