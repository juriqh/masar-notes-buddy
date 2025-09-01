-- Fix storage bucket and policies for schedule uploads

-- Create the schedules bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'schedules',
  'schedules', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg']
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for public read access to schedules
CREATE POLICY "Public read access for schedules" ON storage.objects
FOR SELECT USING (bucket_id = 'schedules');

-- Policy for authenticated users to upload schedules
CREATE POLICY "Authenticated users can upload schedules" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'schedules' 
  AND auth.role() = 'authenticated'
);

-- Policy for users to delete their own schedule uploads
CREATE POLICY "Users can delete their own schedule uploads" ON storage.objects
FOR DELETE USING (
  bucket_id = 'schedules' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Alternative: Allow all authenticated users to delete from schedules bucket
-- (Use this if the above doesn't work)
-- CREATE POLICY "Authenticated users can delete schedules" ON storage.objects
-- FOR DELETE USING (
--   bucket_id = 'schedules' 
--   AND auth.role() = 'authenticated'
-- );
