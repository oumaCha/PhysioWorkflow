create table if not exists workflow_event (
    id bigserial primary key,
    instance_id bigint not null references workflow_instance(id) on delete cascade,
    type text not null,
    node_id text,
    data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
    );

create index if not exists idx_workflow_event_instance_id on workflow_event(instance_id);
