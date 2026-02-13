ALTER TABLE workflow_definition
    ADD COLUMN IF NOT EXISTS definition_json jsonb NOT NULL DEFAULT '{}'::jsonb;
