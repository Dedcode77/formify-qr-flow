-- Create team invitations table
CREATE TABLE public.team_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  invited_by UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, email)
);

-- Enable RLS
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Policies for team_invitations
CREATE POLICY "Admins can view organization invitations"
ON public.team_invitations
FOR SELECT
USING (is_org_admin(organization_id));

CREATE POLICY "Admins can create invitations"
ON public.team_invitations
FOR INSERT
WITH CHECK (is_org_admin(organization_id));

CREATE POLICY "Admins can delete invitations"
ON public.team_invitations
FOR DELETE
USING (is_org_admin(organization_id));

CREATE POLICY "Admins can update invitations"
ON public.team_invitations
FOR UPDATE
USING (is_org_admin(organization_id));

-- Create index for faster lookups
CREATE INDEX idx_team_invitations_token ON public.team_invitations(token);
CREATE INDEX idx_team_invitations_email ON public.team_invitations(email);