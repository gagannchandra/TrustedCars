# Git History Rewrite Rollback Instructions

## What Was Done

On 2026-06-24, Git history was rewritten to remove the `.env` file and production credentials from all commits as part of SEC-1.2 task.

### Files Removed from History
- `backend/.env` 
- `frontend/.env`

### Credentials Sanitized
- DATABASE_URL with password `Trustedcarz@123`
- REDIS_TOKEN value
- SECRET_KEY, JWT_SECRET_KEY, MFA_ENCRYPTION_KEY values
- RESEND_API_KEY value

### Backup Reference
A backup tag was created before the rewrite: `backup-before-history-rewrite-20260624-173335`

## Rollback Procedure

If you need to restore the original history (NOT RECOMMENDED for security reasons):

```bash
# 1. Reset to the backup tag
git reset --hard backup-before-history-rewrite-20260624-173335

# 2. Force push to restore original history
git push --force origin main

# 3. Notify all team members to re-clone
```

## Post-Rewrite Actions Required

### For All Team Members

1. **Backup local work** (commit and push any branches)
2. **Delete local clone** and re-clone the repository:
   ```bash
   cd ~/Code
   mv TrustedCars TrustedCars.old
   git clone <repository-url>
   ```

3. **Re-create local branches** from the new history

### For CI/CD Pipelines

1. Clear any cached builds that reference old commit SHAs
2. Update any deployment scripts that hard-code commit references

### Production Credentials

⚠️ **CRITICAL**: All exposed credentials MUST be rotated:

- [ ] Rotate Supabase database password
- [ ] Rotate Upstash Redis token  
- [ ] Generate new SECRET_KEY
- [ ] Generate new JWT_SECRET_KEY
- [ ] Generate new MFA_ENCRYPTION_KEY
- [ ] Update RESEND_API_KEY
- [ ] Invalidate all user sessions
- [ ] Update production environment variables

## Verification

After force push, verify credentials are removed:

```bash
# Should return nothing
git log --all -- backend/.env

# Should return nothing
git log -S "Trustedcarz@123" --all
git log -S "AcrB-bM3cG" --all
git log -S "re_2FXy5X68" --all
git log -S "f9a8c5e7b2d4f6a1" --all
```

## Notes

- Old commit SHAs have changed - any references to specific commits in issues, PRs, or documentation are now invalid
- Pull requests based on the old history will need to be recreated
- Tags have been preserved and updated to point to equivalent commits in the new history
