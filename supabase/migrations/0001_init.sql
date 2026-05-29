-- Insigtrade Supabase schema
-- Mirrors the shape of src/lib/cms/types.ts so the migration from JSON
-- content is a straight copy of fields. JSONB is used for nested
-- collections (blocks, faqs, seo, strategy, schema_overrides, etc.) so
-- the editor can keep its current flexible polymorphic block model.

-- ──────────────────────────────────────────────────────────
-- extensions
-- ──────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ──────────────────────────────────────────────────────────
-- authors
-- ──────────────────────────────────────────────────────────
create table if not exists authors (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  role        text,
  bio         text,
  avatar      text,
  twitter     text,
  linkedin    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────
-- categories  (slug is natural primary key)
-- ──────────────────────────────────────────────────────────
create table if not exists categories (
  slug              text primary key,
  name              text not null,
  description       text not null default '',
  seo_title         text,
  seo_description   text,
  faqs              jsonb not null default '[]'::jsonb,
  pillar_post_slug  text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────
-- tags  (slug is natural primary key)
-- ──────────────────────────────────────────────────────────
create table if not exists tags (
  slug         text primary key,
  name         text not null,
  description  text,
  created_at   timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────
-- tools
-- ──────────────────────────────────────────────────────────
create table if not exists tools (
  id             text primary key,         -- kept as text to match existing JSON ids
  slug           text not null unique,
  name           text not null,
  tagline        text not null default '',
  description    text not null default '',
  category       text not null default '',
  logo           text,
  website        text not null default '',
  affiliate_url  text,
  pricing        text not null default '',
  rating         numeric(3,2) not null default 0,  -- 0-5, two decimals
  features       jsonb not null default '[]'::jsonb,
  pros           jsonb not null default '[]'::jsonb,
  cons           jsonb not null default '[]'::jsonb,
  use_cases      jsonb not null default '[]'::jsonb,
  verdict        text,
  badge          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────
-- posts
-- ──────────────────────────────────────────────────────────
create table if not exists posts (
  id                   text primary key,    -- kept as text to match existing slugs/ids
  slug                 text not null unique,
  title                text not null,
  subtitle             text,
  excerpt              text not null default '',
  format               text not null,
  status               text not null check (status in ('draft','published','scheduled')),
  published_at         timestamptz,
  scheduled_for        timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  author_id            uuid references authors(id) on delete set null,
  category_slug        text references categories(slug) on delete set null,
  featured_image       text,
  featured_image_alt   text,
  read_time            text,
  blocks               jsonb not null default '[]'::jsonb,
  faqs                 jsonb not null default '[]'::jsonb,
  seo                  jsonb,
  strategy             jsonb,
  review_tool_id       text references tools(id) on delete set null,
  schema_overrides     jsonb
);

create index if not exists posts_status_idx       on posts(status);
create index if not exists posts_category_idx     on posts(category_slug);
create index if not exists posts_published_at_idx on posts(published_at desc);

-- post ↔ tag join
create table if not exists post_tags (
  post_id   text not null references posts(id) on delete cascade,
  tag_slug  text not null references tags(slug) on delete cascade,
  primary key (post_id, tag_slug)
);

create index if not exists post_tags_tag_idx on post_tags(tag_slug);

-- ──────────────────────────────────────────────────────────
-- keywords
-- ──────────────────────────────────────────────────────────
create table if not exists keywords (
  id                  uuid primary key default gen_random_uuid(),
  keyword             text not null,
  volume              integer,
  difficulty          integer check (difficulty between 0 and 100),
  intent              text,
  cluster             text,
  funnel_stage        text,
  priority            text check (priority in ('low','medium','high')),
  suggested_title     text,
  competitor_urls     jsonb not null default '[]'::jsonb,
  monetization        text,
  status              text not null check (status in ('idea','writing','published','update')),
  linked_post_slug    text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create unique index if not exists keywords_keyword_uniq on keywords (lower(keyword));

-- ──────────────────────────────────────────────────────────
-- testimonials / collaborations / cta blocks / affiliate links
-- ──────────────────────────────────────────────────────────
create table if not exists testimonials (
  id          text primary key,
  quote       text not null,
  author      text not null,
  role        text,
  avatar      text,
  created_at  timestamptz not null default now()
);

create table if not exists collaborations (
  id          text primary key,
  brand       text not null,
  logo        text,
  link        text,
  description text,
  created_at  timestamptz not null default now()
);

create table if not exists cta_blocks (
  id         text primary key,
  title      text not null,
  text       text not null default '',
  cta_label  text not null,
  cta_href   text not null,
  variant    text check (variant in ('primary','accent','dark'))
);

create table if not exists affiliate_links (
  id           text primary key,
  label        text not null,
  url          text not null,
  partner      text not null,
  notes        text,
  click_count  integer not null default 0,
  created_at   timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────
-- schema_config (singleton row, id = 'global')
-- ──────────────────────────────────────────────────────────
create table if not exists schema_config (
  id              text primary key,            -- always 'global'
  organization    jsonb not null,
  website         jsonb not null,
  default_author  jsonb,
  updated_at      timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────
-- updated_at triggers
-- ──────────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  for t in
    select unnest(array[
      'authors','categories','tools','posts','keywords','schema_config'
    ])
  loop
    execute format('drop trigger if exists trg_%I_updated on %I', t, t);
    execute format('create trigger trg_%I_updated before update on %I
                    for each row execute function set_updated_at()', t, t);
  end loop;
end$$;

-- ──────────────────────────────────────────────────────────
-- Row Level Security
-- Public site does read-only via the anon key.
-- Admin writes go through the service_role key (server actions only).
-- ──────────────────────────────────────────────────────────
alter table authors          enable row level security;
alter table categories       enable row level security;
alter table tags             enable row level security;
alter table tools            enable row level security;
alter table posts            enable row level security;
alter table post_tags        enable row level security;
alter table keywords         enable row level security;
alter table testimonials     enable row level security;
alter table collaborations   enable row level security;
alter table cta_blocks       enable row level security;
alter table affiliate_links  enable row level security;
alter table schema_config    enable row level security;

-- Public read policies (anon + authenticated). Posts: only published.
create policy "public read authors"        on authors        for select using (true);
create policy "public read categories"     on categories     for select using (true);
create policy "public read tags"           on tags           for select using (true);
create policy "public read tools"          on tools          for select using (true);
create policy "public read posts pub"      on posts          for select using (status = 'published');
create policy "public read post_tags"      on post_tags      for select using (true);
create policy "public read testimonials"   on testimonials   for select using (true);
create policy "public read collaborations" on collaborations for select using (true);
create policy "public read cta_blocks"     on cta_blocks     for select using (true);
create policy "public read schema_config"  on schema_config  for select using (true);

-- keywords and affiliate_links are admin-only (no public select policy).
-- All writes also go through service_role, which bypasses RLS by default.
