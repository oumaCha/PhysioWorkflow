create table if not exists workflow_instance (
    id bigserial primary key,
    definition_id bigint not null references workflow_definition(id) on delete cascade,
    status text not null default 'RUNNING',
    current_node_id text,
    context_json jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
    );

create index if not exists idx_workflow_instance_definition_id
    on workflow_instance(definition_id);
