# TrustedCars - Security Documentation

## Table of Contents
1. [Secret Management](#secret-management)
2. [Credential Rotation](#credential-rotation)
3. [MinIO Security](#minio-security)
4. [Production Security Checklist](#production-security-checklist)
5. [Incident Response](#incident-response)

---

## Secret Management

### Overview
TrustedCars supports multiple secrets management solutions:
- **AWS Secrets Manager** (recommended for AWS deployments)
- **HashiCorp Vault** (recommended for on-premise/hybrid)
- **Doppler** (recommended for multi-cloud)
- **Environment Variables** (development only)

### Configuration

#### AWS Secrets Manager (Recommended)
```bash
# .env
SECRETS_MANAGER=aws
AWS_SECRETS_MANAGER_REGION=us-east-1
```

**Required secrets in AWS Secrets Manager:**
- `trustedcars/jwt-secret` - JWT signing key
- `trustedcars/mfa-encryption-key` - MFA secret encryption key
- `trustedcars/database-url` - PostgreSQL connection string
- `trustedcars/redis-url` - Redis connection string
- `trustedcars/resend-api-key` - Resend email API key

**IAM Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:*:secret:trustedcars/*"
      ]
    }
  ]
}
```

#### HashiCorp Vault
```bash
# .env
SECRETS_MANAGER=vault
VAULT_ADDR=https://vault.yourdomain.com:8200
VAULT_TOKEN=<service-token>
VAULT_NAMESPACE=trustedcars
```

**Vault paths:**
```
secret/trustedcars/jwt-secret
secret/trustedcars/mfa-encryption-key
secret/trustedcars/database-url
secret/trustedcars/redis-url
secret/trustedcars/resend-api-key
```

#### Doppler
```bash
# Install Doppler CLI
curl -Ls https://cli.doppler.com/install.sh | sh

# Login
doppler login

# Configure project
doppler setup --project trustedcars --config production

# Run application
doppler run -- uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

## Credential Rotation

### Rotation Schedule

| Secret | Frequency | Impact | Automation |
|--------|-----------|--------|------------|
| JWT_SECRET_KEY | 90 days | Users logged out | Can be automated |
| MFA_ENCRYPTION_KEY | 180 days | MFA re-enrollment | Manual |
| DATABASE_PASSWORD | 90 days | Service restart | Can be automated |
| REDIS_PASSWORD | 90 days | Service restart | Can be automated |
| AWS_ACCESS_KEY | 90 days | Service restart | Can be automated |
| METRICS_PASSWORD | 30 days | Monitoring impact only | Can be automated |
| SECRET_KEY | 180 days | Sessions invalidated | Manual |

### JWT Secret Rotation

**Impact:** All users will be logged out and need to re-authenticate.

**Procedure:**
1. **Schedule rotation during low-traffic hours**
2. **Generate new JWT secret:**
   ```bash
   openssl rand -hex 32
   ```
3. **Update secret in secrets manager:**
   ```bash
   # AWS Secrets Manager
   aws secretsmanager put-secret-value \
     --secret-id trustedcars/jwt-secret \
     --secret-string "new-secret-here"
   ```
4. **Rolling restart application pods/containers:**
   ```bash
   # Kubernetes
   kubectl rollout restart deployment trustedcars-api
   
   # Docker Compose
   docker-compose restart api
   ```
5. **Monitor error rates** for authentication failures
6. **Notify users** via email/banner about session invalidation

### Database Password Rotation

**Impact:** Service interruption during rotation (2-5 minutes).

**Procedure:**
1. **Create new database user with same privileges:**
   ```sql
   CREATE USER trustedcars_user_new WITH PASSWORD 'new-password';
   GRANT ALL PRIVILEGES ON DATABASE trustedcars_db TO trustedcars_user_new;
   GRANT ALL ON ALL TABLES IN SCHEMA public TO trustedcars_user_new;
   ```
2. **Update connection string in secrets manager**
3. **Rolling restart application** (old instances keep using old user)
4. **Verify all instances use new credentials**
5. **Revoke old user:**
   ```sql
   REVOKE ALL PRIVILEGES ON DATABASE trustedcars_db FROM trustedcars_user;
   DROP USER trustedcars_user;
   ```

### Redis Password Rotation

**Impact:** Minimal (Redis sessions regenerated on reconnect).

**Procedure:**
1. **Update Redis configuration:**
   ```bash
   redis-cli CONFIG SET requirepass "new-password"
   redis-cli CONFIG REWRITE
   ```
2. **Update connection string in secrets manager**
3. **Rolling restart application**
4. **Monitor Redis connection metrics**

---

## MinIO Security

### Initial Setup (Development)

**Default credentials:** `minioadmin` / `minioadmin`  
⚠️ **NEVER use default credentials in production!**

### Credential Rotation

#### Method 1: MinIO Console (Recommended)

1. **Access MinIO Console:**
   ```
   http://localhost:9001 (development)
   https://minio.yourdomain.com (production)
   ```

2. **Login with current credentials**

3. **Create new service account:**
   - Navigate to: `Identity` → `Service Accounts`
   - Click `Create Service Account`
   - Set description: `TrustedCars API - Rotated [DATE]`
   - Copy Access Key and Secret Key

4. **Update application configuration:**
   ```bash
   # Update .env or secrets manager
   AWS_ACCESS_KEY_ID=new-access-key
   AWS_SECRET_ACCESS_KEY=new-secret-key
   ```

5. **Test new credentials:**
   ```bash
   # Upload test file
   curl -X POST http://localhost:8000/api/v1/images/upload \
     -H "Authorization: Bearer $TOKEN" \
     -F "file=@test.jpg"
   
   # Verify upload in MinIO
   ```

6. **Restart application:**
   ```bash
   docker-compose restart api worker
   ```

7. **Verify operations** (upload, delete, presigned URL generation)

8. **Delete old service account** in MinIO Console

#### Method 2: MinIO CLI

```bash
# Install mc (MinIO Client)
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/

# Configure alias
mc alias set myminio http://localhost:9000 minioadmin minioadmin

# Create new service account
mc admin user add myminio trustedcars-new <strong-password>

# Set policy
mc admin policy attach myminio readwrite --user trustedcars-new

# Update application config with new credentials
# ... (restart application)

# Remove old user
mc admin user remove myminio trustedcars-old
```

### MinIO Security Best Practices

#### Production Deployment

1. **Change default credentials immediately:**
   ```bash
   # docker-compose.yml
   minio:
     environment:
       MINIO_ROOT_USER: <strong-random-username>
       MINIO_ROOT_PASSWORD: <strong-random-password-min-32-chars>
   ```

2. **Use TLS/HTTPS:**
   ```bash
   # Generate certificates
   mkdir -p /minio/certs
   openssl req -new -x509 -days 365 -nodes \
     -out /minio/certs/public.crt \
     -keyout /minio/certs/private.key
   ```

3. **Restrict network access:**
   - Run MinIO on internal network only
   - Use reverse proxy (Nginx, Traefik) for public access
   - Enable IP whitelisting

4. **Enable audit logging:**
   ```bash
   mc admin config set myminio audit webhook:trustedcars \
     endpoint="http://log-collector:8080" \
     auth_token="secret"
   ```

5. **Configure bucket policies:**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {"AWS": ["arn:aws:iam::user/trustedcars-api"]},
         "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
         "Resource": ["arn:aws:s3:::trustedcars-images/*"]
       }
     ]
   }
   ```

#### Access Control

- **Never** use root credentials in application
- **Always** use service accounts with minimal permissions
- **Enable** versioning for critical buckets
- **Implement** lifecycle policies for old objects
- **Monitor** access logs for anomalies

---

## Production Security Checklist

### Before Deployment

#### Secrets & Credentials
- [ ] All secrets rotated from defaults
- [ ] JWT_SECRET_KEY is random 32+ byte string
- [ ] MFA_ENCRYPTION_KEY is random 32-byte string
- [ ] Database password is strong (20+ chars, mixed case, numbers, symbols)
- [ ] Redis password configured
- [ ] MinIO/S3 uses IAM role or rotated access keys
- [ ] Metrics endpoint password changed
- [ ] `.env` file NOT committed to git
- [ ] Secrets stored in secrets manager (AWS/Vault/Doppler)

#### Network Security
- [ ] Database not exposed to public internet (no port mapping in docker-compose)
- [ ] Redis not exposed to public internet (no port mapping in docker-compose)
- [ ] MinIO console not publicly accessible
- [ ] Application behind load balancer with TLS termination
- [ ] Security groups restrict inbound traffic to necessary ports only
- [ ] VPC configured with public/private subnets
- [ ] NAT gateway configured for private subnet internet access

#### Application Security
- [ ] `ENVIRONMENT=production` set
- [ ] `CORS_ORIGINS` restricted to production domains only
- [ ] Sentry DSN configured for error tracking
- [ ] Security headers enabled (HSTS, CSP, X-Frame-Options)
- [ ] Rate limiting configured and tested
- [ ] Cookie SameSite=Strict for CSRF protection
- [ ] File upload limits enforced
- [ ] MIME type validation on uploads
- [ ] Presigned URLs have short expiration (5 minutes)

#### Database Security
- [ ] PostgreSQL SSL/TLS required
- [ ] Database backups automated (daily minimum)
- [ ] Point-in-time recovery enabled
- [ ] Connection pooling configured (PgBouncer)
- [ ] Database audit logging enabled
- [ ] Row-level security policies reviewed
- [ ] Partitioning configured for audit_logs and outbox_events

#### Monitoring & Logging
- [ ] CloudWatch/Datadog logs aggregation configured
- [ ] Application metrics exported to monitoring system
- [ ] Alerts configured for:
  - High error rate (>1% of requests)
  - Authentication failures (>50/minute)
  - Database connection pool exhaustion
  - Redis connection failures
  - S3 operation failures
  - Memory/CPU usage >80%
- [ ] Health check endpoints working (`/health/live`, `/health/ready`)
- [ ] Uptime monitoring configured (Pingdom, UptimeRobot, StatusCake)

#### Compliance & Audit
- [ ] Access logs enabled on S3/MinIO
- [ ] CloudTrail enabled (AWS) for API audit trail
- [ ] VPC Flow Logs enabled
- [ ] Database query logs enabled (for sensitive operations)
- [ ] Audit log retention policy configured (90 days minimum)
- [ ] GDPR compliance requirements met (data deletion, export)

---

## Incident Response

### Suspected Credential Compromise

**Severity: CRITICAL**

#### Immediate Actions (within 15 minutes)

1. **Isolate the system:**
   ```bash
   # Block all external traffic to application
   # AWS WAF / Security Group
   aws ec2 revoke-security-group-ingress --group-id sg-xxxxx --ip-permissions ...
   ```

2. **Rotate ALL secrets immediately:**
   ```bash
   # JWT secret
   aws secretsmanager put-secret-value --secret-id trustedcars/jwt-secret --secret-string "$(openssl rand -hex 32)"
   
   # Database password
   aws secretsmanager put-secret-value --secret-id trustedcars/database-url --secret-string "postgresql://..."
   
   # Redis password
   aws secretsmanager put-secret-value --secret-id trustedcars/redis-url --secret-string "redis://..."
   ```

3. **Revoke all user sessions:**
   ```sql
   -- Revoke all refresh tokens
   UPDATE refresh_tokens SET is_revoked = TRUE WHERE is_revoked = FALSE;
   ```

4. **Notify security team and stakeholders**

#### Investigation (within 1 hour)

1. **Review audit logs:**
   ```sql
   SELECT * FROM audit_logs
   WHERE created_at > NOW() - INTERVAL '48 hours'
   ORDER BY created_at DESC;
   ```

2. **Check CloudTrail / VPC Flow Logs** for unusual access patterns

3. **Review S3/MinIO access logs** for unauthorized operations

4. **Check application logs** for:
   - Failed authentication attempts
   - Privilege escalation attempts
   - Unusual API usage patterns

5. **Identify scope:**
   - Which secrets were compromised?
   - Which systems were accessed?
   - What data was exposed?

#### Remediation (within 24 hours)

1. **Patch vulnerabilities** identified during investigation

2. **Implement additional security controls:**
   - Enhanced monitoring
   - Stricter rate limiting
   - IP whitelisting (if applicable)

3. **User notification** (if user data compromised):
   - Email all affected users
   - Provide instructions for password reset
   - Offer credit monitoring (if PII exposed)

4. **Compliance reporting** (if required by regulation):
   - GDPR: 72 hours
   - CCPA: notify without undue delay
   - HIPAA: 60 days

#### Post-Incident (within 1 week)

1. **Root cause analysis**
2. **Update security procedures**
3. **Security training for team**
4. **Implement preventive measures**
5. **Document lessons learned**

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [MinIO Security Best Practices](https://docs.min.io/docs/minio-security-overview.html)
- [AWS Well-Architected Security Pillar](https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/)

---

## Contact

For security concerns or to report vulnerabilities:
- Email: security@trustedcars.com
- PGP Key: [link to public key]
- Responsible disclosure timeline: 90 days

**We appreciate responsible disclosure and will acknowledge all valid security reports.**
