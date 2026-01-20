/*
  # Create Storage Bucket for Logos

  1. Storage
    - Create 'logos' bucket for storing creator logos and other site images
    - Set bucket as public
    - Configure MIME types allowed (images only)

  Important Notes:
    - Files will be publicly accessible
    - Bucket policies are managed at the Supabase project level
    - MIME types restricted to images for security
*/

-- Create the storage bucket for logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
