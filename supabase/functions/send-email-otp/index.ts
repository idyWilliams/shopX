import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log('[send-email-otp] Function invoked');
  if (req.method === 'OPTIONS') {
    console.log('[send-email-otp] Handling OPTIONS request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('[send-email-otp] Parsing request body');
    const body = await req.json() as { email?: string };
    const normalizedEmail = body.email?.trim().toLowerCase() ?? '';

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
      console.error('[send-email-otp] Invalid email format');
      return new Response(JSON.stringify({ error: 'Please enter a valid email address.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate required environment variables
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!resendApiKey || !supabaseUrl || !supabaseServiceKey) {
      console.error('[send-email-otp] Missing required environment variables');
      return new Response(JSON.stringify({ error: 'Service temporarily unavailable. Please check your admin configuration.' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Generate secure 6-digit OTP
    const rawOtp = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
    const otp = String(rawOtp).padStart(6, '0');
    console.log(`[OTP] Generated email OTP for ${normalizedEmail}: ${otp}`);

    // Delete existing unused OTPs for this email
    await supabaseAdmin.from('otp_verifications').delete().eq('email', normalizedEmail).eq('used', false);

    // Insert new OTP record
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { error: insertError } = await supabaseAdmin
      .from('otp_verifications')
      .insert({
        email: normalizedEmail,
        otp,
        channel: 'email',
        expires_at: expiresAt,
        used: false,
      });

    if (insertError) {
      console.error('[send-email-otp] Database insert error:', insertError);
      throw new Error('Failed to store verification code');
    }

    // Send email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ShopX <onboarding@resend.dev>',
        to: [normalizedEmail],
        subject: 'Your ShopX verification code',
        html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;"><h2 style="color:#0EA5E9;margin-bottom:8px;">ShopX</h2><p style="color:#666;margin-bottom:32px;">Your verification code</p><div style="background:#f4f4f4;border-radius:12px;padding:32px;text-align:center;"><p style="font-size:48px;font-weight:bold;letter-spacing:12px;color:#111;margin:0;">${otp}</p></div><p style="color:#666;margin-top:24px;font-size:14px;">This code expires in 10 minutes. Do not share it with anyone.</p><p style="color:#999;font-size:12px;margin-top:32px;">If you didn't request this, ignore this email.</p></div>`,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error('[send-email-otp] Resend API error:', errorText);
      throw new Error('Failed to send email');
    }

    console.log('[send-email-otp] Email sent successfully');
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[send-email-otp] Full error:', error);
    return new Response(JSON.stringify({ error: 'Service temporarily unavailable. Please check your admin configuration.' }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
