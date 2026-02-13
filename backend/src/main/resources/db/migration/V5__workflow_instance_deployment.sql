alter table workflow_instance
    add column if not exists deployment_id bigint references workflow_deployment(id);

create index if not exists idx_workflow_instance_deployment_id
    on workflow_instance(deployment_id);
