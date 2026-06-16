import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log('[verify-whatsapp-otp] Function invoked');
  if (req.method === 'OPTIONS') {
    console.log('[verify-whatsapp-otp] Handling OPTIONS request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('[verify-whatsapp-otp] Parsing request body');
    const { phone, otp } = await req.json();
    console.log('[verify-whatsapp-otp] Received phone:', phone);
    console.log('[verify-whatsapp-otp] Received OTP:', otp);

    if (!phone || !otp) {
      console.error('[verify-whatsapp-otp] Missing required fields');
      return new Response(JSON.stringify({ error: 'Phone and OTP are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[verify-whatsapp-otp] Creating Supabase admin client');
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    console.log('[verify-whatsapp-otp] Querying OTP records');
    const { data: records, error: queryError } = await supabaseAdmin
      .from('otp_verifications')
      .select('*')
      .eq('phone', phone)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (queryError) {
      console.error('[verify-whatsapp-otp] Query error:', queryError);
      throw queryError;
    }

    if (!records || records.length === 0) {
      console.error('[verify-whatsapp-otp] No valid OTP found');
      return new Response(JSON.stringify({ error: 'Invalid or expired code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const record = records[0];
    console.log('[verify-whatsapp-otp] Found OTP record:', record);

    if (record.otp !== otp) {
      console.error('[verify-whatsapp-otp] OTP mismatch');
      return new Response(JSON.stringify({ error: 'Incorrect code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[verify-whatsapp-otp] Marking OTP as used');
    await supabaseAdmin.from('otp_verifications').update({ used: true }).eq('id', record.id);

    const internalEmail = `${phone.replace('+', '').replace(/\s/g, '')}@shopx-internal.app`;

    console.log('[verify-whatsapp-otp] Creating/fetching user');
    const { error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: internalEmail,
      email_confirm: true,
      phone: phone,
      phone_confirm: true,
      user_metadata: { phone, auth_method: 'whatsapp' },
    });

    if (createUserError) {
      console.error('[verify-whatsapp-otp] Create user error (this is expected if user exists):', createUserError);
      console.error('[verify-whatsapp-otp] Create user error code:', createUserError.code);
      console.error('[verify-whatsapp-otp] Create user error message:', createUserError.message);

      const msg = createUserError.message?.toLowerCase() || '';
      const code = createUserError.code || '';
      const isAlreadyRegistered =
        code === 'user_already_exists' ||
        msg.includes('already registered') ||
        msg.includes('already exists');

      if (!isAlreadyRegistered) {
        console.error('[verify-whatsapp-otp] Not an "already exists" error, throwing...');
        throw createUserError;
      }
      console.log('[verify-whatsapp-otp] User already exists, proceeding to generate session link.');
    } else {
      console.log('[verify-whatsapp-otp] New user created successfully');
    }

    console.log('[verify-whatsapp-otp] Generating magic link');
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: internalEmail,
      options: { redirectTo: 'shopx://auth' }
    });

    if (linkError) {
      console.error('[verify-whatsapp-otp] Generate link error:', linkError);
      throw linkError;
    }

    console.log('[verify-whatsapp-otp] Magic link generated successfully');
    console.log('[verify-whatsapp-otp] Function completed successfully');

    return new Response(JSON.stringify({
      success: true,
      token_hash: linkData.properties.hashed_token,
      email: internalEmail
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[verify-whatsapp-otp] Full error:', error);
    console.error('[verify-whatsapp-otp] Error message:', error.message);
    console.error('[verify-whatsapp-otp] Error stack:', error.stack);
    // Never expose internal errors to client
    return new Response(JSON.stringify({ error: 'Service temporarily unavailable. Please check your admin configuration.' }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});