ALTER TABLE patients
    ADD COLUMN IF NOT EXISTS sessions_planned int;

ALTER TABLE patients
    ADD COLUMN IF NOT EXISTS sessions_done int;

-- Defaults
UPDATE patients SET sessions_planned = 6 WHERE sessions_planned IS NULL;
UPDATE patients SET sessions_done = 0 WHERE sessions_done IS NULL;

ALTER TABLE patients ALTER COLUMN sessions_planned SET NOT NULL;
ALTER TABLE patients ALTER COLUMN sessions_done SET NOT NULL;
