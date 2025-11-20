-- Migration: Add agent assignments and notifications tables
-- Date: 2025-01-27

-- Agent Assignments Table
CREATE TABLE IF NOT EXISTS public.agent_assignments (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  inquiry_id uuid REFERENCES public.inquiries(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assignment_type text NOT NULL CHECK (assignment_type IN ('inquiry', 'property')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Ensure only one of inquiry_id or property_id is set
  CONSTRAINT assignment_target_check CHECK (
    (inquiry_id IS NOT NULL AND property_id IS NULL) OR
    (inquiry_id IS NULL AND property_id IS NOT NULL)
  ),

  -- Ensure no duplicate assignments
  CONSTRAINT unique_inquiry_assignment UNIQUE (inquiry_id, assignment_type),
  CONSTRAINT unique_property_assignment UNIQUE (property_id, assignment_type)
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('info', 'warning', 'success', 'assignment', 'approval', 'system')),
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add assigned_agent_id columns to inquiries and properties if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inquiries' AND column_name = 'assigned_agent_id') THEN
    ALTER TABLE public.inquiries ADD COLUMN assigned_agent_id uuid REFERENCES public.users(id);
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'assigned_agent_id') THEN
    ALTER TABLE public.properties ADD COLUMN assigned_agent_id uuid REFERENCES public.users(id);
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Enable RLS
ALTER TABLE public.agent_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_assignments
DO $$ BEGIN
  CREATE POLICY agent_assignments_read ON public.agent_assignments FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY agent_assignments_insert ON public.agent_assignments FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY agent_assignments_update ON public.agent_assignments FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS Policies for notifications
DO $$ BEGIN
  CREATE POLICY notifications_read_own ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY notifications_insert ON public.notifications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY notifications_update_own ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_assignments_agent_id ON public.agent_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_inquiry_id ON public.agent_assignments(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_property_id ON public.agent_assignments(property_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_status ON public.agent_assignments(status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inquiries_assigned_agent ON public.inquiries(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_properties_assigned_agent ON public.properties(assigned_agent_id);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_agent_assignments_updated_at ON public.agent_assignments;
CREATE TRIGGER update_agent_assignments_updated_at
  BEFORE UPDATE ON public.agent_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
