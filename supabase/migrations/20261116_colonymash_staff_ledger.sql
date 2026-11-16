-- Colony Mash staff ledger. Phase 1 of the live backend.
--
-- Everything the brewery owns lives in the `colonymash` schema, which the API cannot reach.
-- The only way in is the `public.colonymash_*` functions below. Each checks a staff access
-- key (or a calendar token) itself, so no Supabase Auth users are created in this project.
-- To remove it all: drop schema colonymash cascade; then drop the public.colonymash_* functions.

create schema if not exists colonymash;
revoke all on schema colonymash from public;

create table colonymash.staff (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 60),
  key_hash text not null unique,
  feed_token text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

-- One row holds the whole staff ledger. `version` rises by one on every save.
create table colonymash.ledger (
  id text primary key default 'main' check (id = 'main'),
  data jsonb not null,
  version integer not null default 1,
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table colonymash.staff enable row level security;
alter table colonymash.ledger enable row level security;

-- The staff member a key belongs to, or no row.
create function colonymash.staff_by_key(p_key text) returns setof colonymash.staff
language sql stable security definer set search_path = '' as $$
  select s.* from colonymash.staff s
  where s.active and char_length(coalesce(p_key, '')) >= 20
    and s.key_hash = encode(sha256(convert_to(p_key, 'UTF8')), 'hex')
  limit 1
$$;

create function colonymash.new_key() returns text
language sql volatile set search_path = '' as $$
  select 'cm_' || replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
$$;

-- First-time setup. Works once, while there are no staff. Returns the first access key.
create function public.colonymash_setup(p_name text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v_key text := colonymash.new_key(); v_name text := btrim(coalesce(p_name, ''));
begin
  lock table colonymash.staff in exclusive mode;
  if exists (select 1 from colonymash.staff) then return jsonb_build_object('ok', false, 'reason', 'already_set_up'); end if;
  if char_length(v_name) < 2 or char_length(v_name) > 60 then return jsonb_build_object('ok', false, 'reason', 'name'); end if;
  insert into colonymash.staff (name, key_hash) values (v_name, encode(sha256(convert_to(v_key, 'UTF8')), 'hex'));
  return jsonb_build_object('ok', true, 'name', v_name, 'key', v_key);
end $$;

-- A signed-in staff member adds another. The new key is shown once.
create function public.colonymash_staff_add(p_key text, p_name text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v_me colonymash.staff; v_key text := colonymash.new_key(); v_name text := btrim(coalesce(p_name, ''));
begin
  select * into v_me from colonymash.staff_by_key(p_key);
  if not found then return jsonb_build_object('ok', false, 'reason', 'denied'); end if;
  if char_length(v_name) < 2 or char_length(v_name) > 60 then return jsonb_build_object('ok', false, 'reason', 'name'); end if;
  if (select count(*) from colonymash.staff where active) >= 20 then return jsonb_build_object('ok', false, 'reason', 'limit'); end if;
  insert into colonymash.staff (name, key_hash) values (v_name, encode(sha256(convert_to(v_key, 'UTF8')), 'hex'));
  return jsonb_build_object('ok', true, 'name', v_name, 'key', v_key);
end $$;

create function public.colonymash_staff_list(p_key text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_me colonymash.staff;
begin
  select * into v_me from colonymash.staff_by_key(p_key);
  if not found then return jsonb_build_object('ok', false, 'reason', 'denied'); end if;
  return jsonb_build_object('ok', true, 'staff', (
    select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'me', s.id = v_me.id,
      'lastSeen', to_char(s.last_seen_at at time zone 'America/Los_Angeles', 'YYYY-MM-DD')) order by s.created_at), '[]'::jsonb)
    from colonymash.staff s where s.active));
end $$;

-- Turn off someone else's key. You cannot remove yourself, so there is always one way in.
create function public.colonymash_staff_remove(p_key text, p_id uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v_me colonymash.staff;
begin
  select * into v_me from colonymash.staff_by_key(p_key);
  if not found then return jsonb_build_object('ok', false, 'reason', 'denied'); end if;
  if p_id = v_me.id then return jsonb_build_object('ok', false, 'reason', 'self'); end if;
  update colonymash.staff set active = false where id = p_id and active;
  return jsonb_build_object('ok', found);
end $$;

-- Read the ledger. `version` 0 and null data mean nothing has been saved yet.
create function public.colonymash_ledger_get(p_key text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v_me colonymash.staff; v_row colonymash.ledger;
begin
  select * into v_me from colonymash.staff_by_key(p_key);
  if not found then return jsonb_build_object('ok', false, 'reason', 'denied'); end if;
  update colonymash.staff set last_seen_at = now() where id = v_me.id and (last_seen_at is null or last_seen_at < now() - interval '10 minutes');
  select * into v_row from colonymash.ledger where id = 'main';
  return jsonb_build_object('ok', true, 'name', v_me.name, 'feedToken', v_me.feed_token,
    'version', coalesce(v_row.version, 0), 'data', v_row.data);
end $$;

-- Save the ledger if nobody else has saved since `p_version`. Otherwise hand back what is there now.
create function public.colonymash_ledger_save(p_key text, p_version integer, p_data jsonb) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v_me colonymash.staff; v_row colonymash.ledger;
begin
  select * into v_me from colonymash.staff_by_key(p_key);
  if not found then return jsonb_build_object('ok', false, 'reason', 'denied'); end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' or (p_data ->> 'version') is distinct from '4'
     or jsonb_typeof(p_data -> 'orders') is distinct from 'array' or octet_length(p_data::text) > 2000000 then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;
  select * into v_row from colonymash.ledger where id = 'main' for update;
  if not found then
    if coalesce(p_version, 0) <> 0 then return jsonb_build_object('ok', false, 'reason', 'conflict', 'version', 0, 'data', null); end if;
    begin
      insert into colonymash.ledger (id, data, version, updated_by) values ('main', p_data, 1, v_me.name);
    exception when unique_violation then
      select * into v_row from colonymash.ledger where id = 'main';
      return jsonb_build_object('ok', false, 'reason', 'conflict', 'version', v_row.version, 'data', v_row.data);
    end;
    return jsonb_build_object('ok', true, 'version', 1);
  end if;
  if v_row.version is distinct from p_version then
    return jsonb_build_object('ok', false, 'reason', 'conflict', 'version', v_row.version, 'data', v_row.data);
  end if;
  update colonymash.ledger set data = p_data, version = v_row.version + 1, updated_at = now(), updated_by = v_me.name where id = 'main';
  return jsonb_build_object('ok', true, 'version', v_row.version + 1);
end $$;

-- What the public site may read: changed weeks of hours, and listed events from today on. No key needed.
create function public.colonymash_public_site() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'weekHours', coalesce((select l.data -> 'weekHours' from colonymash.ledger l where l.id = 'main'), '{}'::jsonb),
    'events', coalesce((
      select jsonb_agg(jsonb_build_object('id', e ->> 'id', 'title', e ->> 'title', 'date', e ->> 'date',
          'start', e ->> 'start', 'end', e ->> 'end', 'note', e ->> 'note') order by e ->> 'date', e ->> 'start')
      from colonymash.ledger l, jsonb_array_elements(l.data -> 'events') e
      where l.id = 'main' and (e ->> 'listed') = 'true'
        and (e ->> 'date') >= to_char(now() at time zone 'America/Los_Angeles', 'YYYY-MM-DD')), '[]'::jsonb))
$$;

-- The ledger for a calendar feed. A feed token reads dates only: account notes are left out.
create function public.colonymash_calendar(p_token text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select l.data || jsonb_build_object('accountNotes', '[]'::jsonb)
  from colonymash.ledger l
  where l.id = 'main' and char_length(coalesce(p_token, '')) >= 32
    and exists (select 1 from colonymash.staff s where s.active and s.feed_token = p_token)
$$;

revoke all on all functions in schema colonymash from public;
revoke all on function public.colonymash_setup(text), public.colonymash_staff_add(text, text), public.colonymash_staff_list(text),
  public.colonymash_staff_remove(text, uuid), public.colonymash_ledger_get(text), public.colonymash_ledger_save(text, integer, jsonb),
  public.colonymash_public_site(), public.colonymash_calendar(text) from public;
grant execute on function public.colonymash_setup(text), public.colonymash_staff_add(text, text), public.colonymash_staff_list(text),
  public.colonymash_staff_remove(text, uuid), public.colonymash_ledger_get(text), public.colonymash_ledger_save(text, integer, jsonb),
  public.colonymash_public_site(), public.colonymash_calendar(text) to anon, authenticated;
