import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RATE_LIMIT_WINDOW_MINUTES = 15;
const MAX_ATTEMPTS = 5;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Rate limit by IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('rate_limit_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('endpoint', 'update-password')
      .eq('identifier', clientIp)
      .gte('attempted_at', windowStart);

    if ((count ?? 0) >= MAX_ATTEMPTS) {
      return new Response(
        JSON.stringify({ error: 'Too many attempts. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await supabase.from('rate_limit_attempts').insert({
      endpoint: 'update-password',
      identifier: clientIp,
    });

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'Current password and new password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (newPassword.length < 8) {
      return new Response(
        JSON.stringify({ error: 'New password must be at least 8 characters long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current password hash
    const { data, error } = await supabase
      .from('access_credentials')
      .select('password_hash')
      .single();

    if (error || !data) {
      console.error('Error fetching credentials:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to verify current password' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, data.password_hash);

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Current password is incorrect' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword);

    // Update password
    const { error: updateError } = await supabase
      .from('access_credentials')
      .update({ password_hash: newPasswordHash, updated_at: new Date().toISOString() })
      .eq('id', data.id || (await supabase.from('access_credentials').select('id').single()).data?.id);

    if (updateError) {
      console.error('Error updating password:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update password' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Password updated successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Password updated successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in update-password function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
