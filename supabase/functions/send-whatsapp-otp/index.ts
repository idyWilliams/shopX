import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/**
 * Send OTP via WhatsApp
 */
const sendOtpWhatsApp = async (
  token: string,
  phoneNumberId: string,
  toPhone: string,
  otp: string
): Promise<void> => {
  console.log('[send-whatsapp-otp] Sending WhatsApp message to:', toPhone);
  const textResponse = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: toPhone,
      type: 'text',
      text: { body: `Your ShopX verification code is: ${otp}. Valid for 10 minutes.` },
    }),
  });

  console.log('[send-whatsapp-otp] WhatsApp API response status:', textResponse.status);

  if (!textResponse.ok) {
    const errorText = await textResponse.text();
    console.error('[send-whatsapp-otp] WhatsApp API Error:', errorText);
    throw new Error('WhatsApp service unavailable');
  }

  const whatsappResult = await textResponse.json();
  console.log('[send-whatsapp-otp] WhatsApp API success response:', whatsappResult);
};

serve(async (req) => {
  console.log('[send-whatsapp-otp] Function invoked');
  if (req.method === 'OPTIONS') {
    console.log('[send-whatsapp-otp] Handling OPTIONS request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('[send-whatsapp-otp] Checking environment variables');
    const whatsappToken = Deno.env.get('WHATSAPP_TOKEN');
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('[send-whatsapp-otp] WHATSAPP_TOKEN present:', !!whatsappToken);
    console.log('[send-whatsapp-otp] WHATSAPP_PHONE_NUMBER_ID present:', !!phoneNumberId);
    console.log('[send-whatsapp-otp] SUPABASE_URL present:', !!supabaseUrl);
    console.log('[send-whatsapp-otp] SUPABASE_SERVICE_ROLE_KEY present:', !!supabaseServiceKey);

    if (!whatsappToken || !phoneNumberId || !supabaseUrl || !supabaseServiceKey) {
      console.error('[send-whatsapp-otp] Missing required environment variables');
      return new Response(JSON.stringify({ error: 'Service temporarily unavailable. Please check your admin configuration.' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[send-whatsapp-otp] Parsing request body');
    const { phone } = await req.json();
    console.log('[send-whatsapp-otp] Received phone:', phone);

    if (!phone || !/^\+\d{7,15}$/.test(phone)) {
      console.error('[send-whatsapp-otp] Invalid phone number format');
      return new Response(JSON.stringify({ error: 'Invalid phone number format.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[send-whatsapp-otp] Creating Supabase admin client');
    const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!);

    console.log('[send-whatsapp-otp] Generating OTP');
    const rawOtp = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
    const otp = rawOtp.toString().padStart(6, '0');
    console.log(`[OTP] Generated WhatsApp OTP for ${phone}: ${otp}`);

    console.log('[send-whatsapp-otp] Deleting old unused OTPs');
    await supabaseAdmin.from('otp_verifications').delete().eq('phone', phone).eq('used', false);

    console.log('[send-whatsapp-otp] Inserting new OTP into database');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { error: insertError } = await supabaseAdmin
      .from('otp_verifications')
      .insert({ phone, otp, expires_at: expiresAt, channel: 'whatsapp' });

    if (insertError) {
      console.error('[send-whatsapp-otp] Database Insert Error:', insertError);
      throw new Error('Failed to store verification code');
    }
    console.log('[send-whatsapp-otp] OTP stored successfully');

    const toPhone = phone.replace('+', '');
    await sendOtpWhatsApp(whatsappToken, phoneNumberId, toPhone, otp);

    console.log('[send-whatsapp-otp] Function completed successfully');
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[send-whatsapp-otp] Full error:', error);
    console.error('[send-whatsapp-otp] Error message:', error.message);
    console.error('[send-whatsapp-otp] Error stack:', error.stack);
    return new Response(JSON.stringify({ error: 'Service temporarily unavailable. Please check your admin configuration.' }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});