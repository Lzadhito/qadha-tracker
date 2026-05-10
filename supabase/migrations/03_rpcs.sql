-- RPC: delete_account
-- Hard-deletes the calling user from auth.users (cascades to all user data via FK).
create or replace function delete_account()
returns void
language plpgsql
security definer
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

-- Grant execute to authenticated users only
revoke execute on function delete_account() from public;
grant execute on function delete_account() to authenticated;
