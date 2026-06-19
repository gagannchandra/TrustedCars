# TrustedCars Disaster Recovery Plan

## Objectives
- **Recovery Point Objective (RPO):** 15 minutes. We can lose at most 15 minutes of data.
- **Recovery Time Objective (RTO):** 1 hour. The system must be back online within 1 hour of a disaster declaration.

## PostgreSQL PITR Strategy
We utilize Point-In-Time Recovery (PITR) using continuous Write-Ahead Log (WAL) archiving (e.g., via WAL-G or AWS RDS Automated Backups).
- **Base Backups:** Taken daily at 02:00 UTC.
- **WAL Archiving:** Shipped to S3 every 5 minutes.

## Daily Backup Strategy
In addition to WAL archiving, logical backups (pg_dump) are taken daily at 03:00 UTC and stored in a versioned S3 bucket for 30 days.

## Restore Verification Checklist
1. Identify the disaster scope (e.g., deleted table vs. region outage).
2. Provision a new PostgreSQL instance using Terraform.
3. Fetch the latest base backup.
4. Replay WAL logs up to the exact moment before the disaster.
5. Execute `scripts/verify_backup_restore.py` to validate data integrity.
6. Switch DNS/Traffic to the new instance.
