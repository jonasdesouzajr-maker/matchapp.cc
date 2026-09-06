-- ============================================================
-- 005_match_together.sql
-- MATCH TOGETHER — two (or more) people, one agreed pick.
--
-- Design notes that matter:
--
-- * Guests join ANONYMOUSLY. Requiring signup to join would kill the whole
--   point: the feature only spreads if the person receiving the link can
--   participate in one tap. Sessions are therefore reachable by code alone.
--
-- * Because the code IS the credential, it must be unguessable enough that
--   nobody can enumerate other people's sessions. Codes are 8 chars from a
--   32-char alphabet (~10^12 combinations) and sessions expire in 24h.
--
-- * No direct table access is granted to anon/authenticated. Everything goes
--   through SECURITY DEFINER functions that require the code, so there is no
--   "list all sessions" surface at all.
--
-- * Nothing personal is stored. Participants are a display name (which the
--   user types, and may be anything) plus their filter choices. No emails,
--   no ids for anonymous joiners.
--
-- Idempotent: safe to run repeatedly.
-- ============================================================

create table if not exists public.match_sessions (
    code          text primary key,
    host_id       uuid,                                   -- null for anonymous hosts
    created_at    timestamptz not null default now(),
    expires_at    timestamptz not null default now() + interval '24 hours',
    status        text        not null default 'waiting', -- waiting | matched
    participants  jsonb       not null default '[]'::jsonb,
    result        jsonb
);

comment on table public.match_sessions is
    'Short-lived shared match sessions for Match Together. Reachable by code only; expires in 24h.';

create index if not exists match_sessions_expires_idx on public.match_sessions (expires_at);

-- ------------------------------------------------------------
-- Code generation: unambiguous alphabet (no 0/O/1/I/L) because
-- these get read aloud and typed by hand.
-- ------------------------------------------------------------
create or replace function public.gen_session_code()
returns text
language plpgsql
volatile
as $$
declare
    alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    result   text := '';
    i        integer;
begin
    for i in 1..8 loop
        result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    return result;
end;
$$;

-- ------------------------------------------------------------
-- Create a session. Host's own preferences are the first participant.
-- ------------------------------------------------------------
create or replace function public.create_match_session(
    p_name  text,
    p_prefs jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_code    text;
    v_tries   integer := 0;
    v_partic  jsonb;
begin
    if p_prefs is null or jsonb_typeof(p_prefs) <> 'object' then
        return jsonb_build_object('ok', false, 'error', 'invalid_prefs');
    end if;

    -- Retry on the astronomically unlikely collision rather than failing.
    loop
        v_code  := public.gen_session_code();
        v_tries := v_tries + 1;
        exit when not exists (select 1 from public.match_sessions where code = v_code);
        if v_tries > 8 then
            return jsonb_build_object('ok', false, 'error', 'code_generation_failed');
        end if;
    end loop;

    v_partic := jsonb_build_array(jsonb_build_object(
        'name',      coalesce(nullif(trim(p_name), ''), 'Host'),
        'prefs',     p_prefs,
        'is_host',   true,
        'joined_at', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SSZ')
    ));

    insert into public.match_sessions (code, host_id, participants)
    values (v_code, auth.uid(), v_partic);

    return jsonb_build_object('ok', true, 'code', v_code, 'participants', v_partic);
end;
$$;

-- ------------------------------------------------------------
-- Join an existing session. Anonymous callers allowed by design.
-- ------------------------------------------------------------
create or replace function public.join_match_session(
    p_code  text,
    p_name  text,
    p_prefs jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_row public.match_sessions%rowtype;
begin
    if p_prefs is null or jsonb_typeof(p_prefs) <> 'object' then
        return jsonb_build_object('ok', false, 'error', 'invalid_prefs');
    end if;

    select * into v_row from public.match_sessions
     where code = upper(trim(p_code)) for update;

    if not found then
        return jsonb_build_object('ok', false, 'error', 'not_found');
    end if;
    if v_row.expires_at < now() then
        return jsonb_build_object('ok', false, 'error', 'expired');
    end if;
    -- Keep sessions small: this is "what should WE watch", not a broadcast.
    if jsonb_array_length(v_row.participants) >= 6 then
        return jsonb_build_object('ok', false, 'error', 'session_full');
    end if;

    update public.match_sessions
       set participants = participants || jsonb_build_object(
               'name',      coalesce(nullif(trim(p_name), ''), 'Guest'),
               'prefs',     p_prefs,
               'is_host',   false,
               'joined_at', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SSZ')
           )
     where code = v_row.code
     returning * into v_row;

    return jsonb_build_object('ok', true, 'code', v_row.code,
                              'participants', v_row.participants,
                              'status', v_row.status,
                              'result', v_row.result);
end;
$$;

-- ------------------------------------------------------------
-- Read session state. Used for polling by both devices.
-- ------------------------------------------------------------
create or replace function public.get_match_session(p_code text)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
    v_row public.match_sessions%rowtype;
begin
    select * into v_row from public.match_sessions where code = upper(trim(p_code));
    if not found then
        return jsonb_build_object('ok', false, 'error', 'not_found');
    end if;
    if v_row.expires_at < now() then
        return jsonb_build_object('ok', false, 'error', 'expired');
    end if;

    return jsonb_build_object('ok', true, 'code', v_row.code,
                              'participants', v_row.participants,
                              'status', v_row.status,
                              'result', v_row.result,
                              'expires_at', v_row.expires_at);
end;
$$;

-- ------------------------------------------------------------
-- Publish the agreed result. First write wins, so two devices racing
-- to compute cannot show each other different titles.
-- ------------------------------------------------------------
create or replace function public.set_match_session_result(
    p_code   text,
    p_result jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_row public.match_sessions%rowtype;
begin
    select * into v_row from public.match_sessions
     where code = upper(trim(p_code)) for update;

    if not found then
        return jsonb_build_object('ok', false, 'error', 'not_found');
    end if;
    if v_row.expires_at < now() then
        return jsonb_build_object('ok', false, 'error', 'expired');
    end if;

    -- Already decided: return the existing result rather than overwrite it.
    -- Both participants must see the SAME title, always.
    if v_row.status = 'matched' and v_row.result is not null then
        return jsonb_build_object('ok', true, 'code', v_row.code,
                                  'status', v_row.status, 'result', v_row.result,
                                  'already', true);
    end if;

    update public.match_sessions
       set result = p_result, status = 'matched'
     where code = v_row.code
     returning * into v_row;

    return jsonb_build_object('ok', true, 'code', v_row.code,
                              'status', v_row.status, 'result', v_row.result,
                              'already', false);
end;
$$;

-- ------------------------------------------------------------
-- Housekeeping. Called opportunistically from create_match_session
-- callers; also safe to schedule.
-- ------------------------------------------------------------
create or replace function public.purge_expired_match_sessions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
    v_count integer;
begin
    delete from public.match_sessions where expires_at < now() - interval '1 hour';
    get diagnostics v_count = row_count;
    return v_count;
end;
$$;

-- ------------------------------------------------------------
-- Permissions. The table itself stays sealed: all access is through
-- the code-gated functions above, so there is no way to list or scrape
-- sessions belonging to other people.
-- ------------------------------------------------------------
alter table public.match_sessions enable row level security;
revoke all on table public.match_sessions from anon, authenticated;

grant execute on function public.create_match_session(text, jsonb)     to anon, authenticated;
grant execute on function public.join_match_session(text, text, jsonb)  to anon, authenticated;
grant execute on function public.get_match_session(text)                to anon, authenticated;
grant execute on function public.set_match_session_result(text, jsonb)  to anon, authenticated;
grant execute on function public.purge_expired_match_sessions()         to authenticated;
