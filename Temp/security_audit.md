# Security Engineering Audit

This document reviews the TrustedCars backend architecture from a security perspective, identifying risks and required mitigations.

## 1. JWT & Refresh Token Strategy
**Risks:**
- **Token Theft / XSS:** If the frontend stores the `access_token` or `refresh_token` in `localStorage`, it is vulnerable to Cross-Site Scripting (XSS).
- **Token Reuse:** If a refresh token is stolen, an attacker can generate indefinite access tokens.
- **Algorithm Confusion:** Attackers might manipulate the `alg` header in the JWT.

**Mitigations:**
- Store the `refresh_token` in a **Secure, HttpOnly, SameSite=Strict cookie**. The `access_token` can be stored in memory.
- Implement **Refresh Token Rotation**: Upon issuing a new access token, issue a new refresh token and invalidate the old one in the `refresh_tokens` DB table. If an old token is reused, revoke *all* tokens for that user family (indicates compromise).
- Hardcode the expected algorithm (e.g., `HS256` or `RS256`) in the backend JWT decoding logic.

## 2. Role-Based Access Control (RBAC) & IDOR
**Risks:**
- **Insecure Direct Object Reference (IDOR):** An authenticated user might send `PUT /api/v1/cars/{id}` with a car ID belonging to another seller, or `GET /api/v1/inquiries/{id}` for someone else's inquiry.
- **Privilege Escalation:** A standard user passing `{"role": "admin"}` in their profile update request.

**Mitigations:**
- **Resource Ownership Validation**: The repository/service layer MUST verify `entity.seller_id == current_user.id` before allowing updates or deletes.
- **Strict Schema Filtering**: Use separate Pydantic schemas for input vs. output. `UserUpdate` schema MUST NOT include a `role` or `is_verified` field.

## 3. File Uploads (Car Images)
**Risks:**
- **Malicious Execution:** Uploading a `.php` or `.sh` script instead of an image.
- **Denial of Service (DoS):** Uploading multi-gigabyte files to exhaust disk space or memory.
- **Embedded Malware:** Valid image files with embedded malicious payloads.

**Mitigations:**
- **Size Limits**: Enforce strict limits (e.g., 5MB per image) via middleware/Nginx before the request reaches FastAPI.
- **Magic Bytes Validation**: Do not trust the file extension or `Content-Type` header. Read the first few bytes (magic bytes) to verify it is genuinely a JPEG, PNG, or WebP.
- **Sanitization**: Process images through a library like `Pillow` to strip EXIF data and re-encode the image, effectively neutralizing embedded payloads.
- **Cloud Storage**: Store files in an isolated S3 bucket, served through a CDN (CloudFront), completely off the application servers.

## 4. Rate Limiting & DoS
**Risks:**
- **Brute Force Attacks:** Automated password guessing on `/api/v1/auth/login`.
- **Resource Exhaustion:** Flooding the search endpoint `/api/v1/cars` with heavy query combinations.

**Mitigations:**
- Implement Redis-backed rate limiting (e.g., `slowapi`).
- **Auth Limits**: Max 5 failed login attempts per IP per minute.
- **Global API Limits**: Limit standard users to ~100 requests/minute.

## 5. Password Reset & Account Recovery
**Risks:**
- **Host Header Injection:** Manipulating the `Host` header to generate malicious password reset links.
- **Timing Attacks:** Determining if an email exists in the DB based on the response time of the password reset endpoint.

**Mitigations:**
- Return a generic `200 OK` message ("If the email exists, a reset link has been sent") instantly, without waiting for the email dispatch to finish (use background tasks).
- Hardcode the frontend domain URL in environment variables for generating reset links; ignore the incoming `Host` header.
- Reset tokens must be cryptographically secure (`secrets` module), hashed in the DB, and short-lived (e.g., 15 minutes).

## 6. Email Verification
**Risks:**
- Unverified users flooding the system with spam listings or inquiries.

**Mitigations:**
- Restrict write actions (creating cars, sending inquiries) until `is_verified == True`.
- Generate verification tokens similarly to password reset tokens.
