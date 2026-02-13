-- Adds free-text intake field for receptionist (privacy-sensitive)
ALTER TABLE patients
    ADD COLUMN IF NOT EXISTS intake_text varchar(255);
