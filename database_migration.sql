-- Add email column to otp_verifications
ALTER TABLE public.otp_verifications
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS idx_otp_email_active
  ON public.otp_verifications(email, used, expires_at);

-- Make phone nullable since email OTP won't have phone
ALTER TABLE public.otp_verifications
ALTER COLUMN phone DROP NOT NULL;
