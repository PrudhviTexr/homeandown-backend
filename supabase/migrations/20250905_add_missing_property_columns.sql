-- Add missing columns to properties table
-- Migration to fix schema mismatch for corner_plot and water_source columns

-- Add corner_plot column (for land/plots)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS corner_plot BOOLEAN DEFAULT FALSE;

-- Add water_source column (for land/farm properties)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS water_source VARCHAR(100);

-- Add any other potentially missing columns that might be referenced in the code
ALTER TABLE properties ADD COLUMN IF NOT EXISTS room_images JSONB DEFAULT '[]'::jsonb;
