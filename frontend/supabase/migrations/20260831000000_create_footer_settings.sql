create table if not exists public.footer_settings (
  id uuid primary key default gen_random_uuid(),
  brand_text text not null default 'Original artwork created to express ideas, emotion, identity and imagination.',
  instagram_url text not null default '',
  facebook_url text not null default '',
  x_url text not null default '',
  explore_links jsonb not null default '[]'::jsonb,
  customer_links jsonb not null default '[]'::jsonb,
  contact_email text not null default 'hello@tboyarts.com',
  location text not null default 'Lagos, Nigeria',
  copyright_text text not null default 'TboyArts. All rights reserved.',
  updated_at timestamptz not null default now()
);

alter table public.footer_settings enable row level security;

drop policy if exists "Public can read footer settings"
on public.footer_settings;

create policy "Public can read footer settings"
on public.footer_settings
for select
using (true);

drop policy if exists "Authenticated users can manage footer settings"
on public.footer_settings;

create policy "Authenticated users can manage footer settings"
on public.footer_settings
for all
to authenticated
using (true)
with check (true);

insert into public.footer_settings (
  brand_text,
  instagram_url,
  facebook_url,
  x_url,
  explore_links,
  customer_links,
  contact_email,
  location,
  copyright_text
)
select
  'Original artwork created to express ideas, emotion, identity and imagination.',
  '',
  '',
  '',
  '[
    {"label":"Home","href":"/"},
    {"label":"Shop","href":"/shop"},
    {"label":"About the Artist","href":"/artist"},
    {"label":"Track Order","href":"#track-order"}
  ]'::jsonb,
  '[
    {"label":"New Arrivals","href":"/shop"},
    {"label":"Shopping Cart","href":"/cart"},
    {"label":"Track an Order","href":"#track-order"}
  ]'::jsonb,
  'hello@tboyarts.com',
  'Lagos, Nigeria',
  'TboyArts. All rights reserved.'
where not exists (
  select 1 from public.footer_settings
);
