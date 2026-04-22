
-- 1) Server-side enforcement of allowed email domains on sign-up.
--    handle_new_user runs inside the auth.users insert transaction, so RAISE EXCEPTION
--    rolls back the user creation entirely.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.email IS NULL
     OR (lower(NEW.email) NOT LIKE '%@stu.vistula.edu.pl'
         AND lower(NEW.email) NOT LIKE '%@vistula.edu.pl') THEN
    RAISE EXCEPTION 'Sign-up is restricted to Vistula University emails (@stu.vistula.edu.pl or @vistula.edu.pl).'
      USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$function$;

-- 2) Defence-in-depth: only callers with a Vistula email can read poster contact info.
CREATE OR REPLACE FUNCTION public.get_item_contact(_item_id uuid)
RETURNS TABLE(full_name text, email text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT p.full_name, p.email
  FROM public.items i
  JOIN public.profiles p ON p.user_id = i.user_id
  WHERE i.id = _item_id
    AND i.status = 'active'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM auth.users u
      WHERE u.id = auth.uid()
        AND (lower(u.email) LIKE '%@stu.vistula.edu.pl'
             OR lower(u.email) LIKE '%@vistula.edu.pl')
    );
$function$;

-- 3) Remove the duplicate INSERT policy on item-photos. The owner-scoped one stays.
DROP POLICY IF EXISTS "Authenticated users can upload item photos" ON storage.objects;

-- 4) Remove the broad public listing policy. Direct URL access still works because
--    the bucket is public; only `list` calls are now blocked for non-owners.
DROP POLICY IF EXISTS "Item photos publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Item photos readable by name" ON storage.objects;
