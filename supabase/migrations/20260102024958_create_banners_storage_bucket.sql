/*
  # Create Storage Bucket for Banners

  1. Storage
    - Create 'banners' bucket for storing banner images
    - Set bucket as public for easy access
    - Configure MIME types allowed (images only)
    - Set 10MB file size limit for high-quality banners

  2. Security
    - Bucket is public for read access
    - RLS policies allow public SELECT
    - RLS policies allow all users to INSERT, UPDATE, DELETE
    
  Important Notes:
    - Files will be publicly accessible for display
    - All users can manage (upload/delete) files
    - MIME types restricted to images for security
    - File size limited to 10MB
*/

-- Create the storage bucket for banners
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'banners',
  'banners',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Public users can view banner images" ON storage.objects;
  DROP POLICY IF EXISTS "Allow all users to upload banners" ON storage.objects;
  DROP POLICY IF EXISTS "Allow all users to update banners" ON storage.objects;
  DROP POLICY IF EXISTS "Allow all users to delete banners" ON storage.objects;
END $$;

-- Allow public read access to banners bucket
CREATE POLICY "Public users can view banner images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banners');

-- Allow all users to upload banners
CREATE POLICY "Allow all users to upload banners"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'banners');

-- Allow all users to update banners
CREATE POLICY "Allow all users to update banners"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'banners')
  WITH CHECK (bucket_id = 'banners');

-- Allow all users to delete banners
CREATE POLICY "Allow all users to delete banners"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'banners');