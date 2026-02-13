create table if not exists task (
   id bigserial primary key,
   instance_id bigint not null references workflow_instance(id) on delete cascade,
    node_id text not null,
    name text not null,
    actor_role text not null,
    context_key text,
    form_schema jsonb not null,
    form_data jsonb,
    status text not null default 'OPEN',
    created_at timestamptz not null default now(),
    completed_at timestamptz
    );

create index if not exists idx_task_instance_id on task(instance_id);
create index if not exists idx_task_status on task(status);
