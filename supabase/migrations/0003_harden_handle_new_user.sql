-- Security hardening (Supabase advisor lints 0028/0029): handle_new_user() is a SECURITY DEFINER
-- function that only ever runs as the on_auth_user_created trigger. Revoke EXECUTE from the API
-- roles so it can't be called directly via /rest/v1/rpc/handle_new_user. Triggers fire regardless
-- of EXECUTE grants, so the signup profile-creation still works.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
