-- Adds agency_name to the public agent_directory view — the "Managed By"
-- card on a property's detail page (entities/property/AgentCard.tsx) shows
-- an agent's name/title/bio but never their agency, and neither does the
-- agent's own dashboard (a separate gap, fixed in the frontend via
-- entities/agent's own AGENT_COLUMNS join, not this view). Found from a
-- developer question ("does the Agent page show their agency?") — it
-- didn't, on either the public or the agent-facing side.
--
-- `create or replace view`, forward-only per this project's established
-- convention for altering existing views/functions (mirrors ADR-029's
-- `enforce_verification_authority()` precedent) — same `security_invoker`/
-- `security_barrier` options as the original (property_discovery.sql), just
-- with `agencies` joined in and `ag.name as agency_name` added to the
-- select. `agencies` is already guest-`SELECT`-able for active rows
-- (database.md §9's Policy Summary), so this adds no new data exposure —
-- purely surfacing a column guests could already read elsewhere.
create or replace view public.agent_directory
with (security_invoker = false) as
  select
    a.id as agent_id,
    a.agency_id,
    p.full_name,
    p.avatar_url,
    a.job_title,
    a.bio,
    ag.name as agency_name
  from public.agents a
  join public.profiles p on p.id = a.profile_id
  join public.agencies ag on ag.id = a.agency_id
  where a.is_active = true and a.deleted_at is null;

alter view public.agent_directory set (security_barrier = true);
