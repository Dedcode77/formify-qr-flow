import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  role: string;
  organizationId: string;
  organizationName: string;
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
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;

    const { email, role, organizationId, organizationName }: InvitationRequest = await req.json();

    if (!email || !organizationId || !organizationName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already exists in the organization
    const { data: existingMember } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (existingMember) {
      const { data: memberCheck } = await supabase
        .from("organization_members")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("user_id", existingMember.id)
        .single();

      if (memberCheck) {
        return new Response(
          JSON.stringify({ error: "Cet utilisateur est déjà membre de l'organisation" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Check for existing pending invitation
    const { data: existingInvitation } = await supabase
      .from("team_invitations")
      .select("id, expires_at")
      .eq("organization_id", organizationId)
      .eq("email", email)
      .is("accepted_at", null)
      .single();

    let invitationToken: string;

    if (existingInvitation) {
      // Update existing invitation
      const { data: updatedInvitation, error: updateError } = await supabase
        .from("team_invitations")
        .update({
          role,
          invited_by: userId,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          token: crypto.randomUUID(),
        })
        .eq("id", existingInvitation.id)
        .select("token")
        .single();

      if (updateError) throw updateError;
      invitationToken = updatedInvitation.token;
    } else {
      // Create new invitation
      const { data: newInvitation, error: insertError } = await supabase
        .from("team_invitations")
        .insert({
          organization_id: organizationId,
          email,
          role,
          invited_by: userId,
        })
        .select("token")
        .single();

      if (insertError) throw insertError;
      invitationToken = newInvitation.token;
    }

    // Get the app URL for the invitation link
    const appUrl = req.headers.get("origin") || "https://formify-qr-flow.lovable.app";
    const inviteLink = `${appUrl}/accept-invite?token=${invitationToken}`;

    // Send invitation email using Resend REST API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Formify <onboarding@resend.dev>",
        to: [email],
        subject: `Invitation à rejoindre ${organizationName} sur Formify`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <div style="text-align: center; margin-bottom: 32px;">
                  <h1 style="color: #3b82f6; margin: 0; font-size: 28px;">📋 Formify</h1>
                </div>
                
                <h2 style="color: #18181b; margin: 0 0 16px 0; font-size: 24px;">
                  Vous êtes invité(e) !
                </h2>
                
                <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                  Vous avez été invité(e) à rejoindre <strong>${organizationName}</strong> sur Formify 
                  en tant que <strong>${role === 'admin' ? 'Administrateur' : 'Membre'}</strong>.
                </p>
                
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${inviteLink}" 
                     style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Accepter l'invitation
                  </a>
                </div>
                
                <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                  Cette invitation expire dans 7 jours. Si vous n'avez pas demandé cette invitation, 
                  vous pouvez ignorer cet email.
                </p>
                
                <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">
                
                <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin: 0;">
                  Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
                  <a href="${inviteLink}" style="color: #3b82f6;">${inviteLink}</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailResult);
      throw new Error(emailResult.message || "Failed to send email");
    }

    console.log("Invitation email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Invitation envoyée avec succès",
        invitationId: invitationToken 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-team-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur lors de l'envoi de l'invitation" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
