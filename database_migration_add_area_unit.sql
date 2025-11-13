-- Migration: Add area_unit field to properties table
-- This field stores which unit (sqft, sqyd, acres) was selected when the property was created/edited
-- This helps preserve the user's preference for displaying the area

-- Add the new column
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS area_unit character varying(10) DEFAULT 'sqft' 
CHECK (area_unit IN ('sqft', 'sqyd', 'acres'));

-- Add a comment to explain the field
COMMENT ON COLUMN public.properties.area_unit IS 'The area unit selected by the user when creating/editing the property (sqft, sqyd, or acres). Used for display purposes.';

-- Update existing properties to infer the unit from their data
-- If area_sqyd is significantly larger than area_sqft, likely sqyd was used
-- If area_acres exists and is > 0, likely acres was used
-- Otherwise, default to sqft
UPDATE public.properties 
SET area_unit = CASE
  WHEN area_acres IS NOT NULL AND area_acres > 0 THEN 'acres'
  WHEN area_sqyd IS NOT NULL AND area_sqyd > 0 AND (area_sqft IS NULL OR area_sqyd > area_sqft * 0.5) THEN 'sqyd'
  ELSE 'sqft'
END
WHERE area_unit IS NULL OR area_unit = 'sqft';

