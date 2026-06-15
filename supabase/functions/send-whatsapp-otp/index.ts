import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/**
 * Check if WhatsApp token is valid
 */
const validateWhatsAppToken = async (token: string, phoneNumberId: string): Promise<boolean> => {
  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}?access_token=${token}`, {
      method: 'GET',
    });
    return response.ok;
  } catch {
    return false;
  }
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
  // Send text message directly (skip the hello_world template for reliability)
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

  if (!textResponse.ok) {
    const errorText = await textResponse.text();
    console.error('WhatsApp API Error:', errorText);
    throw new Error('WhatsApp service unavailable');
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Validate required environment variables first
    const whatsappToken = Deno.env.get('WHATSAPP_TOKEN');
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!whatsappToken || !phoneNumberId || !supabaseUrl || !supabaseServiceKey) {
      console.error('Missing required environment variables');
      return new Response(JSON.stringify({ error: 'Service temporarily unavailable. Please check your admin configuration.' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { phone } = await req.json();
    if (!phone || !/^\+\d{7,15}$/.test(phone)) {
      return new Response(JSON.stringify({ error: 'Invalid phone number format.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!);

    const rawOtp = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
    const otp = rawOtp.toString().padStart(6, '0');
    
    // Log OTP to console
    console.log(`[OTP] Generated WhatsApp OTP for ${phone}: ${otp}`);

    await supabaseAdmin.from('otp_verifications').delete().eq('phone', phone).eq('used', false);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { error: insertError } = await supabaseAdmin
      .from('otp_verifications')
      .insert({ phone, otp, expires_at: expiresAt, channel: 'whatsapp' });

    if (insertError) {
      console.error('Database Insert Error:', insertError);
      throw new Error('Failed to store verification code');
    }

    const toPhone = phone.replace('+', '');
    await sendOtpWhatsApp(whatsappToken, phoneNumberId, toPhone, otp);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Send OTP Error:', error);
    // Never expose internal errors to client
    return new Response(JSON.stringify({ error: 'Service temporarily unavailable. Please check your admin configuration.' }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});