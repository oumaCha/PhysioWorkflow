-- Adds high-level, privacy-safe field for reception intake
ALTER TABLE IF EXISTS patients
    ADD COLUMN IF NOT EXISTS treatment_area text;

-- Backfill existing rows to OTHER if null
UPDATE patients
SET treatment_area = 'OTHER'
WHERE treatment_area IS NULL;

-- Ensure not-null going forward (safe if column exists)
ALTER TABLE IF EXISTS patients
ALTER COLUMN treatment_area SET NOT NULL;
