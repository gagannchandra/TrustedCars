# Secret Management Guide

## Overview

This document describes how to properly manage secrets and credentials in the TrustedCars application to prevent security vulnerabilities.

## ⚠️ Never Commit Secrets to Git

**CRITICAL:** Never commit secrets, API keys, passwords, or credentials directly to the Git repository.

### Why?
- Git history is permanent - even if you delete a file later, it remains in history
- Anyone with repository access (or if repo is public) can see the secrets
- Secrets in Git are considered compromised and must be rotated immediately

---

## Secret Scanning Protection

The repository has multiple layers of protection to prevent accidental secret commits:

### 1. Pre-commit Hook (Local)

A pre-commit hook automatically runs before each commit to:
- **Block `.env` file commits** - `.env` files contain sensitive configuration
- **Detect secret patterns** - Scans for hardcoded API keys, tokens, passwords
- **Provide warnings** - Alerts you to potential credential leaks

**Location:** `.git/hooks/pre-commit` (installed from `scripts/hooks/pre-commit`)

#### Installation

The hooks are tracked in the repository and need to be installed once per developer:

```bash
# From repository root
./scripts/install-hooks.sh
```

This script:
- Copies hook scripts from `scripts/hooks/` to `.git/hooks/`
- Makes them executable
- Prompts before overwriting existing hooks
- Shows confirmation of installed hooks

**First-time setup:**
```bash
# Clone repository
git clone <repo-url>
cd TrustedCars

# Install hooks (required for every developer)
./scripts/install-hooks.sh
```

**Note:** The `.git/hooks/` directory is not tracked by Git, so every developer must run the installation script after cloning the repository.

#### How to Use

Once installed, the hook runs automatically on `git commit`. If it detects secrets:

```bash
$ git commit -m "Add feature"
🔍 Running pre-commit secret scanning...
❌ BLOCKED: Attempting to commit .env files!
The following .env files are staged:
  - backend/.env
```

**To fix:**
```bash
# Unstage the .env file
git reset HEAD backend/.env

# Commit without it
git commit -m "Add feature"
```

#### Bypass (Emergency Only)

If you absolutely must bypass (NOT recommended):
```bash
git commit --no-verify -m "message"
```

⚠️ **WARNING:** Only use `--no-verify` if you are certain there are no secrets. Bypassing may trigger CI failures.

### 2. GitHub Actions CI/CD (Remote)

Every push and pull request triggers automated secret scanning using **TruffleHog**:
- Scans entire commit history for exposed secrets
- Checks for `.env` files in commits
- Uses pattern matching for common secret formats
- **Fails the build** if secrets are detected

**Location:** `.github/workflows/secret-scan.yml`

#### What Happens

1. Code is pushed to GitHub
2. Secret scan workflow runs automatically
3. If secrets found:
   - ❌ Build fails
   - Pull request cannot be merged
   - Email notification sent
4. If no secrets:
   - ✅ Build passes
   - Code can be merged

---

## How to Store Secrets Properly

### Development Environment

**Use `.env` files (already in `.gitignore`):**

```bash
# backend/.env (NEVER commit this file)
SECRET_KEY=your_secret_key_here
DATABASE_URL=postgresql://user:password@localhost/db
REDIS_URL=redis://localhost:6379
```

**Benefits:**
- Simple and convenient for local development
- Automatically ignored by Git (in `.gitignore`)
- Easy to configure per developer

**Setup:**
```bash
cd backend
cp .env.example .env  # If .env.example exists
# Edit .env with your local credentials
```

### Production Environment

**NEVER use `.env` files in production.** Use a secret management service:

#### Option 1: AWS Secrets Manager (Recommended for AWS)

```python
# Application fetches secrets at runtime
import boto3

client = boto3.client('secretsmanager', region_name='us-east-1')
secret = client.get_secret_value(SecretId='trustedcars/production/SECRET_KEY')
```

**Benefits:**
- Encrypted at rest
- Audit logging
- Automatic rotation
- Fine-grained access control

#### Option 2: Environment Variables (Deployment Platform)

Set secrets in your deployment platform's environment configuration:

- **Heroku:** `heroku config:set SECRET_KEY=xxx`
- **AWS Elastic Beanstalk:** Environment properties in EB console
- **Docker/K8s:** Kubernetes Secrets or Docker secrets
- **Vercel/Netlify:** Environment variables in dashboard

#### Option 3: HashiCorp Vault

Enterprise-grade secret management with:
- Dynamic secrets
- Encryption as a service
- Detailed audit logs

#### Option 4: Doppler

Developer-friendly secret management:
- Sync secrets across environments
- Team collaboration
- Change history

---

## Secret Types and Storage

### Application Secrets

Store in environment variables or secret manager:

```bash
SECRET_KEY=xxx                    # Application secret key
JWT_SECRET_KEY=xxx               # JWT signing key
MFA_ENCRYPTION_KEY=xxx           # MFA secret encryption key
```

### Database Credentials

```bash
DATABASE_URL=postgresql://user:password@host:port/database
```

**Production:** Use IAM authentication or AWS RDS IAM tokens where possible

### External Service Credentials

```bash
RESEND_API_KEY=re_xxxxx          # Email service
AWS_ACCESS_KEY_ID=AKIA...        # AWS services
AWS_SECRET_ACCESS_KEY=xxx
REDIS_TOKEN=xxx                   # Redis/Upstash
```

### Third-party API Keys

```bash
STRIPE_SECRET_KEY=sk_live_xxx    # Payment processing
SENTRY_DSN=https://xxx           # Error monitoring
```

---

## Detected Secret Patterns

The pre-commit hook and CI scans detect:

### High-Risk Patterns

- `SECRET_KEY = "xxx"` (20+ characters)
- `API_KEY = 'xxx'` (20+ characters)
- `PASSWORD = "xxx"` (8+ characters)
- `TOKEN = "xxx"` (20+ characters)
- `PRIVATE_KEY = "-----BEGIN"`
- `AWS_ACCESS_KEY = "AKIA..."`
- `JWT_SECRET = "xxx"`

### Variable Names to Avoid Hardcoding

- `password`, `passwd`, `pwd`
- `secret`, `secret_key`
- `api_key`, `apikey`
- `token`, `auth_token`
- `private_key`, `priv_key`
- `access_key`, `secret_access_key`

---

## What to Do If Secrets Are Committed

### If Caught by Pre-commit Hook

1. **Unstage the file:**
   ```bash
   git reset HEAD <file>
   ```

2. **Remove the secret from the file:**
   - Replace with environment variable reference
   - Or move to `.env` file

3. **Commit again:**
   ```bash
   git commit -m "message"
   ```

### If Pushed to GitHub (CI Fails)

1. **Remove secret from code immediately**

2. **DO NOT just delete and commit** - secret is still in Git history

3. **Rotate the compromised secret:**
   - Generate new API key/password
   - Update in secret manager or environment
   - Revoke old secret at provider (AWS, Stripe, etc.)

4. **Rewrite Git history (if possible):**
   ```bash
   # Use BFG Repo Cleaner or git filter-branch
   # See SEC-1.2 task for details
   ```

5. **Force push (coordinate with team):**
   ```bash
   git push --force
   ```

### If Secret is Already Public

1. **Immediately revoke/rotate** the compromised credential
2. **Audit access logs** for unauthorized usage
3. **Update application** with new credentials
4. **Rewrite Git history** to remove from repository
5. **Document incident** and lessons learned

---

## Best Practices

### ✅ Do

- Use `.env` files for local development (already in `.gitignore`)
- Use secret managers for production (AWS Secrets Manager, Vault, Doppler)
- Store secrets as environment variables in deployment platforms
- Rotate secrets regularly (every 90 days recommended)
- Use different secrets for dev/staging/production
- Audit who has access to production secrets
- Test pre-commit hooks locally before pushing

### ❌ Don't

- Never commit `.env` files to Git
- Never hardcode secrets in source code
- Never store secrets in comments
- Never share secrets via Slack/email/chat
- Never use the same secrets across environments
- Never bypass pre-commit hooks without review
- Never ignore CI secret scanning failures

---

## Testing Secret Scanning

### Test Pre-commit Hook

```bash
# Create a dummy secret file
echo 'SECRET_KEY="abc123def456ghi789jkl012mno345pqr678stu901vwx234yz"' > test_secret.py
git add test_secret.py
git commit -m "test"
# Should be BLOCKED

# Clean up
rm test_secret.py
```

### Test .env Blocking

```bash
# Try to commit .env
git add backend/.env
git commit -m "test"
# Should be BLOCKED

# Unstage
git reset HEAD backend/.env
```

---

## Troubleshooting

### Pre-commit Hook Not Running

```bash
# Make sure hook is executable
chmod +x .git/hooks/pre-commit

# Verify it exists
ls -la .git/hooks/pre-commit
```

### False Positives

If the hook blocks legitimate code:

```bash
# Review the file to ensure no secrets
cat <file>

# If safe, bypass once (carefully)
git commit --no-verify -m "message"
```

### CI Keeps Failing

1. Check the GitHub Actions logs
2. Identify which file triggered the failure
3. Review the file for hardcoded secrets
4. Remove secrets and use environment variables
5. Ensure `.env` files are not committed

---

## Security Incident Response

If secrets are compromised:

1. **Immediate Actions:**
   - Rotate compromised credentials
   - Revoke old credentials at provider
   - Update application with new credentials

2. **Investigation:**
   - Review access logs for unauthorized usage
   - Determine scope of exposure
   - Identify when secret was first committed

3. **Remediation:**
   - Remove secret from Git history
   - Update deployment environments
   - Test application with new credentials

4. **Prevention:**
   - Document incident
   - Review and improve secret management processes
   - Additional team training if needed

---

## Related Tasks

- **SEC-1.1:** Rotate Production Credentials
- **SEC-1.2:** Remove Credentials from Git History
- **SEC-1.3:** Implement Real Secret Management
- **SEC-1.4:** Add Secret Scanning Prevention (this document)

---

## Additional Resources

- [OWASP Secret Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [TruffleHog Documentation](https://github.com/trufflesecurity/trufflehog)
- [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)
- [HashiCorp Vault](https://www.vaultproject.io/)
- [Doppler](https://www.doppler.com/)

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Maintained By:** Security Team
