-- Create documents storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
-- Anyone authenticated can upload
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid() IS NOT NULL
);

-- Anyone can read documents (public bucket)
CREATE POLICY "Public read access for documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

-- Editors and admins can delete
CREATE POLICY "Editors can delete documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' 
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'editor')
  )
);

-- Editors and admins can update
CREATE POLICY "Editors can update documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents' 
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'editor')
  )
);