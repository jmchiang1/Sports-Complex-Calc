-- The "Try without an account" demo now live-syncs from one showcase account's
-- saved properties instead of the static DEMO_PROPERTIES sample set. That means
-- signed-out visitors need read access to that ONE account's rows — but no one
-- else's. Add a public read policy scoped to a single user_id, on top of the
-- existing owner-only "own rows" policy (permissive policies are OR'd, so owners
-- keep full CRUD on their own rows and nothing else becomes publicly readable).
--
-- The showcase user_id is resolved from the account email at apply-time and
-- baked into the policy as a literal, so the compiled policy never reads
-- auth.users at query time (which anon can't) — it just compares user_id to a
-- constant. Re-point the demo by changing the email and re-running.
alter table properties enable row level security;

do $$
declare
  demo_uid uuid;
begin
  select id into demo_uid from auth.users where email = 'jonathanchiang7@gmail.com';
  if demo_uid is null then
    raise exception 'demo showcase user not found for the given email';
  end if;

  drop policy if exists "demo public read" on properties;
  execute format(
    'create policy "demo public read" on properties for select using (user_id = %L)',
    demo_uid
  );
end $$;
