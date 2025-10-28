-- Create location tables for pincode auto-population
-- This migration creates the missing states, districts, mandals, and cities tables

-- States table
CREATE TABLE IF NOT EXISTS public.states (
  id text PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Districts table
CREATE TABLE IF NOT EXISTS public.districts (
  id text PRIMARY KEY,
  name text NOT NULL,
  state_id text NOT NULL REFERENCES public.states(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Mandals table
CREATE TABLE IF NOT EXISTS public.mandals (
  id text PRIMARY KEY,
  name text NOT NULL,
  district_id text NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
  state_id text NOT NULL REFERENCES public.states(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Cities table
CREATE TABLE IF NOT EXISTS public.cities (
  id text PRIMARY KEY,
  name text NOT NULL,
  mandal_id text REFERENCES public.mandals(id) ON DELETE CASCADE,
  district_id text NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
  state_id text NOT NULL REFERENCES public.states(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Pincodes table for storing coordinates
CREATE TABLE IF NOT EXISTS public.pincodes (
  pincode text PRIMARY KEY,
  latitude numeric,
  longitude numeric,
  city text,
  district text,
  state text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mandals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pincodes ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_districts_state_id ON public.districts(state_id);
CREATE INDEX IF NOT EXISTS idx_mandals_district_id ON public.mandals(district_id);
CREATE INDEX IF NOT EXISTS idx_mandals_state_id ON public.mandals(state_id);
CREATE INDEX IF NOT EXISTS idx_cities_mandal_id ON public.cities(mandal_id);
CREATE INDEX IF NOT EXISTS idx_cities_district_id ON public.cities(district_id);
CREATE INDEX IF NOT EXISTS idx_cities_state_id ON public.cities(state_id);

-- Insert default states data
INSERT INTO public.states (id, name) VALUES
('1', 'Andhra Pradesh'),
('2', 'Telangana'),
('3', 'Karnataka'),
('4', 'Tamil Nadu'),
('5', 'Maharashtra'),
('6', 'Delhi'),
('7', 'West Bengal')
ON CONFLICT (id) DO NOTHING;

-- Insert default districts for Telangana
INSERT INTO public.districts (id, name, state_id) VALUES
('TG001', 'Hyderabad', '2'),
('TG002', 'Rangareddy', '2'),
('TG003', 'Medchal-Malkajgiri', '2'),
('TG004', 'Sangareddy', '2'),
('TG005', 'Vikarabad', '2')
ON CONFLICT (id) DO NOTHING;

-- Insert default mandals for Hyderabad district
INSERT INTO public.mandals (id, name, district_id, state_id) VALUES
('TG001001', 'Secunderabad', 'TG001', '2'),
('TG001002', 'Charminar', 'TG001', '2'),
('TG001003', 'Malakpet', 'TG001', '2'),
('TG001004', 'Khairatabad', 'TG001', '2'),
('TG001005', 'Serilingampally', 'TG001', '2')
ON CONFLICT (id) DO NOTHING;

-- Insert default cities for Hyderabad mandals
INSERT INTO public.cities (id, name, mandal_id, district_id, state_id) VALUES
('TG001001001', 'Secunderabad', 'TG001001', 'TG001', '2'),
('TG001001002', 'Begumpet', 'TG001001', 'TG001', '2'),
('TG001002001', 'Charminar', 'TG001002', 'TG001', '2'),
('TG001002002', 'Mehdipatnam', 'TG001002', 'TG001', '2'),
('TG001003001', 'Malakpet', 'TG001003', 'TG001', '2'),
('TG001003002', 'Santosh Nagar', 'TG001003', 'TG001', '2'),
('TG001004001', 'Khairatabad', 'TG001004', 'TG001', '2'),
('TG001004002', 'Somajiguda', 'TG001004', 'TG001', '2'),
('TG001005001', 'Serilingampally', 'TG001005', 'TG001', '2'),
('TG001005002', 'Kondapur', 'TG001005', 'TG001', '2')
ON CONFLICT (id) DO NOTHING;

-- Insert some sample pincode data with coordinates
INSERT INTO public.pincodes (pincode, latitude, longitude, city, district, state) VALUES
('500033', 17.3850, 78.4867, 'Hyderabad', 'Hyderabad', 'Telangana'),
('500034', 17.3850, 78.4867, 'Hyderabad', 'Hyderabad', 'Telangana'),
('500045', 17.3850, 78.4867, 'Hyderabad', 'Hyderabad', 'Telangana'),
('500090', 17.3850, 78.4867, 'Hyderabad', 'Hyderabad', 'Telangana'),
('400050', 19.0760, 72.8777, 'Mumbai', 'Mumbai', 'Maharashtra'),
('110049', 28.6139, 77.2090, 'Delhi', 'Delhi', 'Delhi'),
('560001', 12.9716, 77.5946, 'Bangalore', 'Bangalore Urban', 'Karnataka'),
('600001', 13.0827, 80.2707, 'Chennai', 'Chennai', 'Tamil Nadu')
ON CONFLICT (pincode) DO NOTHING;
