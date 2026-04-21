-- 1. Restrict profiles SELECT to own profile only
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Security definer function to get poster contact info for an active item
CREATE OR REPLACE FUNCTION public.get_item_contact(_item_id uuid)
RETURNS TABLE (full_name text, email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.full_name, p.email
  FROM public.items i
  JOIN public.profiles p ON p.user_id = i.user_id
  WHERE i.id = _item_id
    AND i.status = 'active'
    AND auth.uid() IS NOT NULL;
$$;

GRANT EXECUTE ON FUNCTION public.get_item_contact(uuid) TO authenticated;

-- 3. Storage: allow public read of individual objects in item-photos, but not listing
DROP POLICY IF EXISTS "Public read access for item-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view item photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view item photos" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Allow read of specific files (by exact name) but block listing/enumeration
CREATE POLICY "Item photos readable by name"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'item-photos' AND name IS NOT NULL);

-- Authenticated users can upload to their own folder
DROP POLICY IF EXISTS "Users can upload item photos" ON storage.objects;
CREATE POLICY "Users can upload their own item photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'item-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can update their own item photos" ON storage.objects;
CREATE POLICY "Users can update their own item photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'item-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete their own item photos" ON storage.objects;
CREATE POLICY "Users can delete their own item photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'item-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);