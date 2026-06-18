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
      return new Response(JSON.stringify({ error: 'Incorrect code. Please try again.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[verify-whatsapp-otp] Marking OTP as used');
    await supabaseAdmin.from('otp_verifications').update({ used: true }).eq('id', record.id);

    const internalEmail = `${phone.replace('+', '').replace(/\s/g, '')}@shopx-internal.app`;
    console.log('[verify-whatsapp-otp] Using internal email:', internalEmail);

    // Step 1: Get or create user
    console.log('[verify-whatsapp-otp] Checking for existing user');
    let { data: { user }, error: getUserError } = await supabaseAdmin.auth.admin.getUserByEmail(internalEmail);
    
    if (getUserError || !user) {
      console.log('[verify-whatsapp-otp] Creating new user');
      const { data, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: internalEmail,
        email_confirm: true,
        phone,
        phone_confirm: true,
        user_metadata: { phone, auth_method: 'whatsapp' },
      });
      
      if (createUserError) {
        console.error('[verify-whatsapp-otp] Failed to create user:', createUserError);
        // Check if user already exists
        const msg = createUserError.message?.toLowerCase() || '';
        const code = createUserError.code || '';
        const isAlreadyRegistered = 
          code === 'user_already_exists' || 
          msg.includes('already registered') || 
          msg.includes('already exists');
        
        if (isAlreadyRegistered) {
          // Try to get user again
          const { data: userData } = await supabaseAdmin.auth.admin.getUserByEmail(internalEmail);
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

    console.log('[verify-whatsapp-otp] User found/created:', user.id);

    // Step 2: Generate a magic link (to get a valid token_hash for verifyOtp)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: internalEmail,
      options: { redirectTo: 'shopx://auth' },
    });

    if (linkError) {
      console.error('[verify-whatsapp-otp] Failed to generate magic link:', linkError);
      throw linkError;
    }

    console.log('[verify-whatsapp-otp] Function completed successfully');
    return new Response(JSON.stringify({
      success: true,
      token_hash: linkData.properties.hashed_token,
      email: internalEmail,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[verify-whatsapp-otp] Full error:', error);
    console.error('[verify-whatsapp-otp] Error message:', error.message);
    console.error('[verify-whatsapp-otp] Error stack:', error.stack);
    return new Response(JSON.stringify({ error: 'Service temporarily unavailable. Please check your admin configuration.' }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});