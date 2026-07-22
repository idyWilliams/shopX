import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  console.log('[verify-email-otp] Function invoked');
  if (req.method === 'OPTIONS') {
    console.log('[verify-email-otp] Handling OPTIONS request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('[verify-email-otp] Parsing request body');
    const body = await req.json() as { email?: string; otp?: string };
    const email = body.email?.trim().toLowerCase() ?? '';
    const otp = body.otp?.trim() ?? '';

    if (!email || !otp) {
      console.error('[verify-email-otp] Missing required fields');
      return new Response(JSON.stringify({ error: 'Email and OTP are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[verify-email-otp] Querying OTP records for email:', email);
    const { data: records, error: queryError } = await supabaseAdmin
      .from('otp_verifications')
      .select('*')
      .eq('email', email)
      .eq('channel', 'email')
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (queryError) {
      console.error('[verify-email-otp] Query error:', queryError);
      throw queryError;
    }

    if (!records || records.length === 0) {
      console.error('[verify-email-otp] No valid OTP found');
      return new Response(JSON.stringify({ error: 'Invalid or expired code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const record = records[0];
    console.log('[verify-email-otp] Found OTP record:', record);

    if (String(record.otp).trim() !== otp) {
      console.error('[verify-email-otp] OTP mismatch');
      return new Response(JSON.stringify({ error: 'Incorrect code. Please try again.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[verify-email-otp] Marking OTP as used');
    await supabaseAdmin.from('otp_verifications').update({ used: true }).eq('id', record.id);

    // Get or create user
    console.log('[verify-email-otp] Checking for existing user');
    let { data: { user }, error: getUserError } = await supabaseAdmin.auth.admin.getUserByEmail(email);

    if (getUserError || !user) {
      console.log('[verify-email-otp] Creating new user');
      const { data, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { auth_method: 'email_otp' },
      });

      if (createUserError) {
        console.error('[verify-email-otp] Failed to create user:', createUserError);
        const msg = createUserError.message?.toLowerCase() || '';
        const code = createUserError.code || '';
        const isAlreadyRegistered =
          code === 'user_already_exists' ||
          msg.includes('already registered') ||
          msg.includes('already exists');

        if (isAlreadyRegistered) {
          const { data: userData } = await supabaseAdmin.auth.admin.getUserByEmail(email);
          user = userData.user;
        } else {
          throw createUserError;
        }
      } else {
        user = data.user;
      }
    }

    if (!user) {
      throw new Error('Failed to get or create user');
    }

    console.log('[verify-email-otp] User found/created:', user.id);

    // Generate magic link token
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: 'shopx://auth' },
    });

    if (linkError) {
      console.error('[verify-email-otp] Failed to generate magic link:', linkError);
      throw linkError;
    }

    console.log('[verify-email-otp] Function completed successfully');
    return new Response(JSON.stringify({
      success: true,
      token_hash: linkData.properties.hashed_token,
      email,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[verify-email-otp] Full error:', error);
    return new Response(JSON.stringify({ error: 'Service temporarily unavailable. Please check your admin configuration.' }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
