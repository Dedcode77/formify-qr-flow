import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AcceptInvitationRequest {
  token: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Vous devez être connecté pour accepter une invitation" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // User client for auth
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Admin client for bypassing RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    const userEmail = user.email;

    const { token: inviteToken }: AcceptInvitationRequest = await req.json();

    if (!inviteToken) {
      return new Response(
        JSON.stringify({ error: "Token d'invitation manquant" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the invitation using admin client
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from("team_invitations")
      .select("*")
      .eq("token", inviteToken)
      .is("accepted_at", null)
      .single();

    if (invitationError || !invitation) {
      return new Response(
        JSON.stringify({ error: "Invitation non trouvée ou déjà utilisée" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Cette invitation a expiré" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if the email matches
    if (invitation.email.toLowerCase() !== userEmail?.toLowerCase()) {
      return new Response(
        JSON.stringify({ 
          error: `Cette invitation est destinée à ${invitation.email}. Veuillez vous connecter avec cette adresse.` 
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is already a member
    const { data: existingMember } = await supabaseAdmin
      .from("organization_members")
      .select("id")
      .eq("organization_id", invitation.organization_id)
      .eq("user_id", userId)
      .single();

    if (existingMember) {
      // Mark invitation as accepted anyway
      await supabaseAdmin
        .from("team_invitations")
        .update({ accepted_at: new Date().toISOString() })
        .eq("id", invitation.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Vous êtes déjà membre de cette organisation",
          organizationId: invitation.organization_id 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Add user to organization
    const { error: memberError } = await supabaseAdmin
      .from("organization_members")
      .insert({
        organization_id: invitation.organization_id,
        user_id: userId,
        role: invitation.role,
      });

    if (memberError) throw memberError;

    // Mark invitation as accepted
    await supabaseAdmin
      .from("team_invitations")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invitation.id);

    // Get organization name for response
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("name")
      .eq("id", invitation.organization_id)
      .single();

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Bienvenue dans ${org?.name || 'l\'organisation'} !`,
        organizationId: invitation.organization_id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in accept-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur lors de l'acceptation de l'invitation" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
