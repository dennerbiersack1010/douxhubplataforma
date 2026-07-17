-- Permite resolver digest() no schema confiável da extensão pgcrypto.

alter function public.create_clinic_invitation(uuid, text, text, text, text, uuid, timestamptz)
  set search_path = pg_catalog, extensions;

alter function public.accept_clinic_invitation(text)
  set search_path = pg_catalog, extensions;

