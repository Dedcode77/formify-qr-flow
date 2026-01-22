import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token to verify identity
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the user's token
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID not found in token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client with service role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    });

    // Delete user's organization data first (forms, responses, etc.)
    // Get user's organizations where they are the owner
    const { data: orgs } = await adminClient
      .from('organizations')
      .select('id')
      .eq('owner_id', userId);

    if (orgs && orgs.length > 0) {
      for (const org of orgs) {
        // Delete form responses for forms in this organization
        const { data: forms } = await adminClient
          .from('forms')
          .select('id')
          .eq('organization_id', org.id);

        if (forms && forms.length > 0) {
          const formIds = forms.map(f => f.id);
          await adminClient
            .from('form_responses')
            .delete()
            .in('form_id', formIds);
        }

        // Delete forms
        await adminClient
          .from('forms')
          .delete()
          .eq('organization_id', org.id);

        // Delete attendance records
        await adminClient
          .from('attendance_records')
          .delete()
          .eq('organization_id', org.id);

        // Delete team invitations
        await adminClient
          .from('team_invitations')
          .delete()
          .eq('organization_id', org.id);

        // Delete organization members
        await adminClient
          .from('organization_members')
          .delete()
          .eq('organization_id', org.id);

        // Delete organization
        await adminClient
          .from('organizations')
          .delete()
          .eq('id', org.id);
      }
    }

    // Remove user from any organizations they're a member of (but not owner)
    await adminClient
      .from('organization_members')
      .delete()
      .eq('user_id', userId);

    // Delete user's profile
    await adminClient
      .from('profiles')
      .delete()
      .eq('id', userId);

    // Delete the user from auth.users using admin API
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete user account', details: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in delete-account function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
