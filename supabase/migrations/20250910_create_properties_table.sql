-- Create properties table to match Python API Property model
-- This table stores all property listings with comprehensive details

CREATE TABLE IF NOT EXISTS public.properties (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  
  -- Basic property information
  title text NOT NULL,
  description text,
  property_type text,
  listing_type text,
  
  -- Pricing information
  price numeric,
  monthly_rent numeric,
  security_deposit numeric,
  maintenance_charges numeric,
  rate_per_sqft numeric,
  rate_per_sqyd numeric,
  
  -- Location details
  address text,
  city text,
  state text,
  district text,
  mandal text,
  state_id text,
  district_id text,
  mandal_id text,
  zip_code text,
  latitude numeric,
  longitude numeric,
  
  -- Property specifications
  bedrooms integer,
  bathrooms integer,
  balconies integer,
  
  -- Area measurements
  area_sqft numeric,
  area_sqyd numeric,
  area_acres numeric,
  carpet_area_sqft numeric,
  built_up_area_sqft numeric,
  plot_area_sqft numeric,
  plot_area_sqyd numeric,
  
  -- Commercial property fields
  commercial_subtype text,
  total_floors integer,
  floor integer,
  parking_spaces integer,
  
  -- Villa/house specific fields
  bhk_config text,
  floor_count integer,
  facing text,
  private_garden boolean DEFAULT false,
  private_driveway boolean DEFAULT false,
  plot_dimensions text,
  
  -- Land/farm specific fields
  land_type text,
  soil_type text,
  road_access boolean DEFAULT true,
  boundary_fencing boolean DEFAULT false,
  water_availability boolean DEFAULT false,
  electricity_availability boolean DEFAULT false,
  corner_plot boolean DEFAULT false,
  water_source text,
  
  -- Apartment specific fields
  apartment_type text,
  
  -- Community and legal fields
  community_type text,
  gated_community_features text,
  visitor_parking boolean DEFAULT false,
  legal_status text,
  rera_status text,
  rera_number text,
  
  -- Business context fields
  nearby_business_hubs text,
  nearby_transport text,
  
  -- Ownership and management
  owner_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  agent_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_agent_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  added_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  added_by_role text,
  
  -- Status and visibility
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'sold', 'rented')),
  featured boolean DEFAULT false,
  verified boolean DEFAULT false,
  priority integer DEFAULT 0,
  
  -- Listing details
  available_from timestamptz,
  furnishing_status text,
  possession_date timestamptz,
  
  -- JSON fields for flexible data
  amenities_json text,
  images_json text,
  room_images jsonb DEFAULT '[]'::jsonb,
  
  -- Custom ID for external reference
  custom_id text UNIQUE,
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_agent_id ON public.properties(agent_id);
CREATE INDEX IF NOT EXISTS idx_properties_assigned_agent_id ON public.properties(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_state ON public.properties(state);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON public.properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON public.properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON public.properties(featured);
CREATE INDEX IF NOT EXISTS idx_properties_verified ON public.properties(verified);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON public.properties(created_at DESC);

-- RLS Policies (from 20250810_rls_policies_properties_inquiries_bookings.sql)
DO $$ BEGIN
  CREATE POLICY insert_own_properties ON public.properties FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY select_properties ON public.properties FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY update_own_properties ON public.properties FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY delete_own_properties ON public.properties FOR DELETE TO authenticated USING (owner_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_properties_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_properties_updated_at();

-- Add foreign key constraints to inquiries and bookings if not already present
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'inquiries_property_id_fkey' 
    AND table_name = 'inquiries'
  ) THEN
    ALTER TABLE public.inquiries ADD CONSTRAINT inquiries_property_id_fkey 
      FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'bookings_property_id_fkey' 
    AND table_name = 'bookings'
  ) THEN
    ALTER TABLE public.bookings ADD CONSTRAINT bookings_property_id_fkey 
      FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
