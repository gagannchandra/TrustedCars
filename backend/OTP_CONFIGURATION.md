# OTP Authentication Configuration

## Overview

TrustedCarz uses OTP (One-Time Password) authentication via email for enhanced security. This document explains how to configure and disable OTP for development purposes.

## Environment Variable

### `DISABLE_OTP_AUTH`

**Type:** Boolean  
**Default:** `false`  
**Environment:** Development only

When set to `true`, this bypasses OTP verification and allows users to login/register with just email and password.

## Configuration

### Development Mode (OTP Disabled)

To disable OTP authentication for easier local testing:

1. Open `backend/.env`
2. Set `DISABLE_OTP_AUTH=true`
3. Restart the services:
   ```bash
   docker compose restart api worker
   ```

### Production Mode (OTP Enabled)

OTP authentication is enabled by default:

1. Ensure `DISABLE_OTP_AUTH=false` (or omit the variable)
2. Configure a valid Resend API key:
   ```env
   RESEND_API_KEY=your_real_api_key_here
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```
3. Restart the services

## Behavior Changes

### When `DISABLE_OTP_AUTH=true`:

#### Registration (`/api/v1/auth/register/user` or `/api/v1/auth/register/dealer`)
- ✅ User submits email, password, and details
- ✅ Account created immediately
- ✅ Returns access_token and refresh_token directly
- ❌ No OTP verification step
- ❌ No email sent

**Response:**
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "token_type": "bearer"
}
```

#### Login (`/api/v1/auth/login`)
- ✅ User submits email and password
- ✅ Returns access_token and refresh_token directly
- ❌ No OTP verification step
- ❌ No email sent

**Response:**
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "token_type": "bearer"
}
```

### When `DISABLE_OTP_AUTH=false` (Default):

#### Registration
1. User submits registration details
2. OTP sent to email
3. User verifies with OTP code via `/api/v1/auth/verify-registration`
4. Account created and tokens returned

#### Login
1. User submits email and password
2. OTP sent to email
3. User verifies with OTP code via `/api/v1/auth/verify-login`
4. Tokens returned

## Security Considerations

⚠️ **IMPORTANT SECURITY WARNINGS:**

1. **Never enable `DISABLE_OTP_AUTH=true` in production**
   - This significantly reduces security
   - Makes accounts vulnerable to brute force attacks
   - Bypasses email verification

2. **For Production:**
   - Always use `DISABLE_OTP_AUTH=false`
   - Configure a real Resend API key
   - Use a verified sending domain
   - Monitor OTP delivery rates

3. **For Development:**
   - Use `DISABLE_OTP_AUTH=true` for local testing
   - Or configure Resend test mode API key
   - Never commit `DISABLE_OTP_AUTH=true` to version control

## Testing

### With OTP Disabled

```bash
# Register a user
curl -X POST http://localhost:8000/api/v1/auth/register/user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@12345",
    "full_name": "Test User"
  }'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@12345"
  }'
```

### With OTP Enabled

```bash
# Step 1: Request registration
curl -X POST http://localhost:8000/api/v1/auth/register/user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@12345",
    "full_name": "Test User"
  }'
# Response: {"message": "Verification code sent to email"}

# Step 2: Verify with OTP (check email for code)
curl -X POST http://localhost:8000/api/v1/auth/verify-registration \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "code": "123456"
  }'
```

## Environment Variables Summary

```env
# OTP Configuration
OTP_EXPIRY_MINUTES=10                    # How long OTP codes are valid
OTP_RESEND_COOLDOWN_SECONDS=60           # Cooldown between OTP requests
OTP_MAX_ATTEMPTS=5                        # Max verification attempts per OTP
OTP_RATE_LIMIT_WINDOW_MINUTES=15         # Rate limit window
OTP_RATE_LIMIT_MAX_REQUESTS=10           # Max requests in rate limit window

# Development Only
DISABLE_OTP_AUTH=false                    # Set to true to bypass OTP
```

## Audit Logging

When OTP is disabled, different audit log entries are created:

- **Registration:** `REGISTER_USER (OTP disabled)` or `REGISTER_DEALER (OTP disabled)`
- **Login:** `LOGIN_DIRECT (OTP disabled)`

This helps track which accounts were created or accessed without OTP verification.

## Troubleshooting

### OTP emails not being sent
1. Check `RESEND_API_KEY` is valid
2. Verify `RESEND_FROM_EMAIL` is from a verified domain
3. Check application logs for email errors
4. Consider enabling `DISABLE_OTP_AUTH=true` for local development

### Can't login even with correct password
- If OTP is enabled, you need the verification code from email
- Check your email spam folder
- Use `DISABLE_OTP_AUTH=true` for easier local testing
- Or check OTP codes in the database `otp_codes` table

### Need to test in production-like mode locally
1. Sign up for Resend (free tier available)
2. Get API key and verify your domain
3. Set `DISABLE_OTP_AUTH=false`
4. Configure real `RESEND_API_KEY`
5. Test full OTP flow

## Related Files

- `backend/app/core/config.py` - Configuration definition
- `backend/app/modules/auth/service.py` - Authentication logic
- `backend/app/modules/auth/otp_service.py` - OTP generation and verification
- `backend/.env` - Environment configuration
- `backend/docker-compose.yml` - Docker environment variables
