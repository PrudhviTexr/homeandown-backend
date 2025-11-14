-- Migration: Add support for new property types (new_property and lot)
-- This migration adds fields to support per-unit pricing and starting price displays

-- Add pricing_display_mode field
-- Values: 'starting_from' (for new_property showing "Starting from ₹X/sqft"), 
--         'per_unit' (for lot showing "₹X/sqyd - buy 1, 2, 3... sq yards"),
--         'fixed' (default - shows fixed price)
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS pricing_display_mode character varying(32) DEFAULT 'fixed'
CHECK (pricing_display_mode IN ('starting_from', 'per_unit', 'fixed'));

-- Add starting_price_per_unit field (e.g., 7000 INR per sqft for new_property)
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS starting_price_per_unit double precision;

-- Add pricing_unit_type field to indicate if pricing is per sqft or sqyd
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS pricing_unit_type character varying(10) 
CHECK (pricing_unit_type IN ('sqft', 'sqyd', NULL));

-- Add comments to explain the fields
COMMENT ON COLUMN public.properties.pricing_display_mode IS 'Pricing display mode: starting_from (e.g., "Starting from ₹7000/sqft"), per_unit (e.g., "₹X/sqyd - buy any quantity"), or fixed (standard price display)';
COMMENT ON COLUMN public.properties.starting_price_per_unit IS 'Starting price per unit (sqft or sqyd) for new_property and lot types. Used when pricing_display_mode is starting_from or per_unit.';
COMMENT ON COLUMN public.properties.pricing_unit_type IS 'Unit type for pricing: sqft or sqyd. Used with starting_price_per_unit to display pricing correctly.';

-- Set default pricing_display_mode based on existing property_type (if needed)
-- This is a one-time migration - new properties will set this explicitly
UPDATE public.properties 
SET pricing_display_mode = 'fixed'
WHERE pricing_display_mode IS NULL;

