-- Joey portfolio CMS (Neon project joey-portfolio)
create table if not exists jc_content (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text
);
create table if not exists jc_content_history (
  id bigserial primary key,
  data jsonb not null,
  saved_at timestamptz not null default now()
);
create table if not exists jc_messages (
  id bigserial primary key,
  name text not null,
  email text not null,
  topic text,
  message text not null,
  ip_hash text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists jc_messages_created on jc_messages (created_at desc);
create table if not exists jc_throttle (
  key text primary key,
  hits int not null default 0,
  window_start timestamptz not null default now()
);
