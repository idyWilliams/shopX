import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { phone, otp } = await req.json();
    if (!phone || !otp) {
      return new Response(JSON.stringify({ error: 'Phone and OTP are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: records, error: queryError } = await supabaseAdmin
      .from('otp_verifications')
      .select('*')
      .eq('phone', phone)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (queryError) throw queryError;
    if (!records || records.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid or expired code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const record = records[0];
    if (record.otp !== otp) {
      return new Response(JSON.stringify({ error: 'Incorrect code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await supabaseAdmin.from('otp_verifications').update({ used: true }).eq('id', record.id);

    const internalEmail = `${phone.replace('+', '').replace(/\s/g, '')}@shopx-internal.app`;

    const { error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: internalEmail,
      email_confirm: true,
      phone: phone,
      phone_confirm: true,
      user_metadata: { phone, auth_method: 'whatsapp' },
    });

    if (createUserError && !createUserError.message.includes('already registered')) {
      throw createUserError;
    }

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: internalEmail,
      options: { redirectTo: 'shopx://auth' }
    });

    if (linkError) throw linkError;

    return new Response(JSON.stringify({
      success: true,
      token_hash: linkData.properties.hashed_token,
      email: internalEmail
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});