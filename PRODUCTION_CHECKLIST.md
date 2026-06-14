# ShopX Production Readiness Checklist

## 1. API Key Rotation & Security

- [ ] Rotate all Supabase API keys (anon, service_role)
- [ ] Rotate OpenAI API key
- [ ] Rotate Firecrawl API key (if used)
- [ ] Store all keys in secure environment variables (never commit to repo)
- [ ] Use separate keys for development and production
- [ ] Enable IP whitelisting for Supabase service_role key if possible

## 2. App Configuration (app.json)

- [ ] Set production bundle identifier (iOS: com.shopx.app, Android: com.shopx.app)
- [ ] Update app version and build number
- [ ] Configure production push notifications (if applicable)
- [ ] Set appropriate privacy settings
- [ ] Configure app icons and splash screens for production

## 3. Pre-Commit Hook Setup (Husky + TruffleHog)

### Step-by-Step Setup:

1. Install Husky:
   ```bash
   npm install husky --save-dev
   ```

2. Enable Git hooks:
   ```bash
   npx husky install
   ```

3. Add prepare script to package.json:
   ```json
   {
     "scripts": {
       "prepare": "husky install"
     }
   }
   ```

4. Install TruffleHog:
   - macOS: `brew install trufflesecurity/tap/trufflehog`
   - Linux: Download from https://github.com/trufflesecurity/trufflehog/releases
   - Windows: Download from https://github.com/trufflesecurity/trufflehog/releases

5. Create pre-commit hook:
   ```bash
   npx husky add .husky/pre-commit "npx trufflehog filesystem --no-update --fail ."
   ```

6. Make the hook executable:
   ```bash
   chmod +x .husky/pre-commit
   ```

## 4. Database & Supabase Configuration

- [ ] Apply supabase_schema.sql to production database
- [ ] Enable RLS (Row Level Security) on all tables
- [ ] Create appropriate RLS policies for multi-tenant access
- [ ] Set up database backups
- [ ] Configure database monitoring and alerts
- [ ] Verify all foreign key constraints are in place
- [ ] Set up Supabase Edge Functions for production

## 5. Security Hardening

- [ ] Enable HTTPS everywhere
- [ ] Set secure cookies (if using web)
- [ ] Implement rate limiting on API endpoints
- [ ] Enable CORS restrictions
- [ ] Set up audit logging for all critical operations
- [ ] Review and test all operational anomaly detection

## 6. Testing & Quality Assurance

- [ ] Run security stress tests: `npm test -- src/tests/securityStressTest.ts`
- [ ] Test all onboarding flows
- [ ] Test multi-store functionality
- [ ] Test attendant PIN lock with 3 failed attempts
- [ ] Test store switching for attendants with multiple store access
- [ ] Test voice-to-ledger integrity
- [ ] Test device authorization

## 7. Deployment Preparation

- [ ] Clean up development-only code and comments
- [ ] Build production version of the app
- [ ] Test production build on actual devices
- [ ] Set up error tracking (Sentry, Bugsnag, etc.)
- [ ] Set up analytics (if applicable)
- [ ] Create deployment runbook
