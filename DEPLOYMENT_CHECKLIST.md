# ShopX Email OTP Deployment Checklist

## 1. Database Migration
Run the following SQL in Supabase SQL Editor:
- File: `database_migration.sql`

## 2. Environment Variables
### Add to `supabase/functions/.env`:
```
RESEND_API_KEY=your_resend_api_key
```

### Set Supabase Secret:
```bash
supabase secrets set RESEND_API_KEY=your_resend_api_key --project-ref iskqyvqbfpblcglrxizn
```

## 3. Deploy Edge Functions
```bash
supabase functions deploy send-email-otp --project-ref iskqyvqbfpblcglrxizn
supabase functions deploy verify-email-otp --project-ref iskqyvqbfpblcglrxizn
supabase functions deploy send-whatsapp-otp --project-ref iskqyvqbfpblcglrxizn
supabase functions deploy verify-whatsapp-otp --project-ref iskqyvqbfpblcglrxizn
```

## 4. Run the App
```bash
npx expo start --clear
```
