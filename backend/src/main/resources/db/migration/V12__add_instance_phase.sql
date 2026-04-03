ALTER TABLE workflow_instance
    ADD COLUMN IF NOT EXISTS phase varchar(64);