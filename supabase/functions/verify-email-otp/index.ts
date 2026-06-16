import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log('[verify-email-otp] Function invoked');
  if (req.method === 'OPTIONS') {
    console.log('[verify-email-otp] Handling OPTIONS request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('[verify-email-otp] Parsing request body');
    const { email, otp } = await req.json();
    console.log('[verify-email-otp] Received email:', email);
    console.log('[verify-email-otp] Received OTP:', otp);

    if (!email || !otp) {
      console.error('[verify-email-otp] Missing required fields');
      return new Response(JSON.stringify({ error: 'Email and OTP are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[verify-email-otp] Creating Supabase admin client');
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    console.log('[verify-email-otp] Querying OTP records');
    const { data: records, error: queryError } = await supabaseAdmin
      .from('otp_verifications')
      .select('*')
      .eq('email', email)
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

    if (record.otp !== otp) {
      console.error('[verify-email-otp] OTP mismatch');
      return new Response(JSON.stringify({ error: 'Incorrect code. Please try again.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[verify-email-otp] Marking OTP as used');
    await supabaseAdmin.from('otp_verifications').update({ used: true }).eq('id', record.id);

    console.log('[verify-email-otp] Creating/fetching user');
    const { error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { auth_method: 'email_otp' },
    });

    if (createUserError) {
      console.error('[verify-email-otp] Create user error (this is expected if user exists):', createUserError);
      console.error('[verify-email-otp] Create user error code:', createUserError.code);
      console.error('[verify-email-otp] Create user error message:', createUserError.message);
      
      // Check for multiple ways Supabase indicates user already exists
      const isAlreadyRegistered = 
        (createUserError.code === 'user_already_exists') ||
        (createUserError.message?.toLowerCase().includes('already registered')) || 
        (createUserError.message?.toLowerCase().includes('already exists')) ||
        (createUserError.message?.toLowerCase().includes('user already exists'));
      
      if (!isAlreadyRegistered) {
        console.error('[verify-email-otp] Not an "already exists" error, throwing...');
        throw createUserError;
      }
      console.log('[verify-email-otp] User already exists, continuing to generate magic link...');
    } else {
      console.log('[verify-email-otp] New user created successfully');
    }

    console.log('[verify-email-otp] Generating magic link');
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: 'shopx://auth' },
    });

    if (linkError) {
      console.error('[verify-email-otp] Generate link error:', linkError);
      throw linkError;
    }

    console.log('[verify-email-otp] Magic link generated successfully');
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
    console.error('[verify-email-otp] Error message:', error.message);
    console.error('[verify-email-otp] Error stack:', error.stack);
    // Never expose internal errors to client
    return new Response(JSON.stringify({ error: 'Service temporarily unavailable. Please check your admin configuration.' }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
