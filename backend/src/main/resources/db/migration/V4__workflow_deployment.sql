create table if not exists workflow_deployment (
    id bigserial primary key,
    definition_id bigint not null references workflow_definition(id) on delete cascade,
    version int not null,
    active boolean not null default true,
    deployed_at timestamptz not null default now(),
    definition_json jsonb not null
    );

create unique index if not exists ux_workflow_deployment_def_version
    on workflow_deployment(definition_id, version);

create index if not exists idx_workflow_deployment_definition_id
    on workflow_deployment(definition_id);
