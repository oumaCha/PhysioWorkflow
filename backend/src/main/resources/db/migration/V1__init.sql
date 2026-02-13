create table if not exists workflow_definition (
  id bigserial primary key,
  name text not null,
  created_at timestamptz not null default now()
    );
