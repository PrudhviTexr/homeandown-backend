-- Add support tables for enhanced dashboard functionality
-- This migration adds tables for property views tracking and saved properties

-- Property Views Table (for tracking property views by users and visitors)
CREATE TABLE IF NOT EXISTS public.property_views (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  viewer_ip text,
  viewer_user_agent text,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Saved Properties Table (for buyers to save/favorite properties)
CREATE TABLE IF NOT EXISTS public.saved_properties (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  notes text,
  saved_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Ensure one save per user per property
  CONSTRAINT unique_user_property_save UNIQUE (user_id, property_id)
);

-- System Logs Table (for admin monitoring)
CREATE TABLE IF NOT EXISTS public.system_logs (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  severity text DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Performance Metrics Table (for agent performance tracking)
CREATE TABLE IF NOT EXISTS public.agent_performance_metrics (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  metric_date date NOT NULL DEFAULT CURRENT_DATE,
  total_assignments integer DEFAULT 0,
  completed_assignments integer DEFAULT 0,
  total_inquiries integer DEFAULT 0,
  responded_inquiries integer DEFAULT 0,
  total_bookings integer DEFAULT 0,
  confirmed_bookings integer DEFAULT 0,
  avg_response_time_hours numeric,
  conversion_rate numeric,
  customer_satisfaction_score numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Ensure one record per agent per date
  CONSTRAINT unique_agent_date_metrics UNIQUE (agent_id, metric_date)
);

-- Enable RLS
ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for property_views
DO $$ BEGIN
  CREATE POLICY property_views_insert ON public.property_views FOR INSERT TO anon, authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY property_views_select_all ON public.property_views FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS Policies for saved_properties
DO $$ BEGIN
  CREATE POLICY saved_properties_insert_own ON public.saved_properties FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY saved_properties_select_own ON public.saved_properties FOR SELECT TO authenticated USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY saved_properties_delete_own ON public.saved_properties FOR DELETE TO authenticated USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS Policies for system_logs (admin only)
DO $$ BEGIN
  CREATE POLICY system_logs_insert ON public.system_logs FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY system_logs_select ON public.system_logs FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND user_type = 'admin'
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS Policies for agent_performance_metrics
DO $$ BEGIN
  CREATE POLICY agent_metrics_select ON public.agent_performance_metrics FOR SELECT TO authenticated USING (
    agent_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND user_type = 'admin'
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_property_views_property_id ON public.property_views(property_id);
CREATE INDEX IF NOT EXISTS idx_property_views_user_id ON public.property_views(user_id);
CREATE INDEX IF NOT EXISTS idx_property_views_viewed_at ON public.property_views(viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_properties_user_id ON public.saved_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_properties_property_id ON public.saved_properties(property_id);
CREATE INDEX IF NOT EXISTS idx_saved_properties_saved_at ON public.saved_properties(saved_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON public.system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_action ON public.system_logs(action);
CREATE INDEX IF NOT EXISTS idx_system_logs_entity_type ON public.system_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_severity ON public.system_logs(severity);

CREATE INDEX IF NOT EXISTS idx_agent_metrics_agent_id ON public.agent_performance_metrics(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_metric_date ON public.agent_performance_metrics(metric_date DESC);

-- Update trigger for agent_performance_metrics
DROP TRIGGER IF EXISTS update_agent_metrics_updated_at ON public.agent_performance_metrics;
CREATE TRIGGER update_agent_metrics_updated_at
  BEFORE UPDATE ON public.agent_performance_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper function to increment property view count
CREATE OR REPLACE FUNCTION public.record_property_view(
  property_id_param uuid,
  user_id_param uuid DEFAULT NULL,
  viewer_ip_param text DEFAULT NULL,
  viewer_user_agent_param text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  view_id uuid;
BEGIN
  INSERT INTO public.property_views (property_id, user_id, viewer_ip, viewer_user_agent)
  VALUES (property_id_param, user_id_param, viewer_ip_param, viewer_user_agent_param)
  RETURNING id INTO view_id;
  
  RETURN view_id;
END;
$$;

-- Helper function to save/unsave property
CREATE OR REPLACE FUNCTION public.toggle_saved_property(
  property_id_param uuid,
  user_id_param uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_save record;
BEGIN
  -- Check if already saved
  SELECT * INTO existing_save 
  FROM public.saved_properties 
  WHERE user_id = user_id_param AND property_id = property_id_param;
  
  IF FOUND THEN
    -- Unsave
    DELETE FROM public.saved_properties 
    WHERE user_id = user_id_param AND property_id = property_id_param;
    RETURN json_build_object('success', true, 'saved', false, 'message', 'Property removed from saved list');
  ELSE
    -- Save
    INSERT INTO public.saved_properties (user_id, property_id)
    VALUES (user_id_param, property_id_param);
    RETURN json_build_object('success', true, 'saved', true, 'message', 'Property saved successfully');
  END IF;
END;
$$;

-- Helper function to get property view count
CREATE OR REPLACE FUNCTION public.get_property_view_count(property_id_param uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  view_count integer;
BEGIN
  SELECT COUNT(*) INTO view_count
  FROM public.property_views
  WHERE property_id = property_id_param;
  
  RETURN view_count;
END;
$$;

-- Grant execute permissions
DO $$ BEGIN
  GRANT EXECUTE ON FUNCTION public.record_property_view(uuid, uuid, text, text) TO anon, authenticated;
EXCEPTION WHEN insufficient_privilege THEN NULL; END $$;

DO $$ BEGIN
  GRANT EXECUTE ON FUNCTION public.toggle_saved_property(uuid, uuid) TO authenticated;
EXCEPTION WHEN insufficient_privilege THEN NULL; END $$;

DO $$ BEGIN
  GRANT EXECUTE ON FUNCTION public.get_property_view_count(uuid) TO anon, authenticated;
EXCEPTION WHEN insufficient_privilege THEN NULL; END $$;
