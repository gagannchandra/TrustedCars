# TrustedCars Setup Scripts

This directory contains setup and utility scripts for the TrustedCars application.

## Available Scripts

### setup-minio.sh

Creates and configures the MinIO bucket required for the TrustedCars application.

**What it does:**
- Checks if MinIO client (mc) is installed
- Verifies MinIO server is running
- Creates the `trustedcars-images` bucket
- Sets public download policy for car images
- Verifies bucket connectivity and access

**Prerequisites:**
- MinIO server running on localhost:9000 (default)
- MinIO client (mc) installed

**Usage:**

```bash
# Basic usage (uses default values)
./scripts/setup-minio.sh

# Custom configuration
MINIO_ENDPOINT=http://localhost:9000 \
MINIO_ACCESS_KEY=minioadmin \
MINIO_SECRET_KEY=minioadmin \
BUCKET_NAME=trustedcars-images \
./scripts/setup-minio.sh
```

**Environment Variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `MINIO_ENDPOINT` | `http://localhost:9000` | MinIO server endpoint URL |
| `MINIO_ACCESS_KEY` | `minioadmin` | MinIO access key |
| `MINIO_SECRET_KEY` | `minioadmin` | MinIO secret key |
| `BUCKET_NAME` | `trustedcars-images` | Name of the bucket to create |
| `MC_ALIAS` | `local` | Alias name for MinIO client |

**Example Output:**

```
===================================================
TrustedCars MinIO Setup Script
===================================================

✓ MinIO client (mc) is installed
ℹ Checking MinIO connectivity at http://localhost:9000...
✓ MinIO server is running at http://localhost:9000
ℹ Configuring MinIO client alias 'local'...
✓ MinIO client alias configured
ℹ Checking if bucket 'trustedcars-images' exists...
ℹ Creating bucket 'trustedcars-images'...
✓ Bucket 'trustedcars-images' created successfully
ℹ Setting public download policy for bucket 'trustedcars-images'...
✓ Public download policy set for bucket 'trustedcars-images'
ℹ Images in this bucket can now be accessed publicly via URL
ℹ Verifying bucket access...
✓ Bucket is accessible
ℹ Current bucket policy:
Access permission for `local/trustedcars-images` is `download`

===================================================
Bucket Configuration Summary
===================================================

  Bucket Name:     trustedcars-images
  Endpoint:        http://localhost:9000
  Access Policy:   Public Download (Anonymous Read)
  Console URL:     http://localhost:9001
  Console Login:   minioadmin / minioadmin

✓ MinIO setup completed successfully!

ℹ Next steps:
  1. Update your backend/.env file with:
     S3_BUCKET_NAME=trustedcars-images
     S3_ENDPOINT_URL=http://localhost:9000
     AWS_ACCESS_KEY_ID=minioadmin
     AWS_SECRET_ACCESS_KEY=minioadmin

  2. Access MinIO Console at: http://localhost:9001

  3. Test file upload through your application
```

**Troubleshooting:**

**Error: MinIO client (mc) is not installed**
- Install mc using the instructions provided by the script

**Error: MinIO server is not running**
- Start MinIO server:
  - macOS: `brew services start minio`
  - Linux: `sudo systemctl start minio`
  - Or run manually: `minio server ~/minio/data --console-address :9001`

**Error: Failed to configure MinIO client alias**
- Verify MinIO server is running: `curl http://localhost:9000/minio/health/live`
- Check MinIO credentials in your environment or .env file

**Error: Failed to create bucket**
- Check MinIO logs for errors
- Verify you have write permissions
- Ensure the bucket name is valid (lowercase, no special characters)

### setup-database.sh

Creates and initializes the PostgreSQL database for TrustedCars.

**What it does:**
- Detects platform (macOS or Linux)
- Checks if PostgreSQL is installed and running
- Creates PostgreSQL user (with password)
- Creates database with correct ownership
- Verifies database connection
- Optionally applies Alembic migrations
- Provides connection string for .env file

**Prerequisites:**
- PostgreSQL 15 installed (or any compatible version)
- PostgreSQL service running
- Sufficient permissions to create users/databases

**Installation:**

**macOS (Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql-15 postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Usage:**

```bash
# Basic usage (uses default values)
./scripts/setup-database.sh

# Custom configuration
DB_USER=myuser \
DB_PASSWORD=mypassword \
DB_NAME=mydb \
./scripts/setup-database.sh
```

**Environment Variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_USER` | `trustedcars_user` | PostgreSQL username to create |
| `DB_PASSWORD` | `trustedcars_password` | Password for the PostgreSQL user |
| `DB_NAME` | `trustedcars_db` | Name of the database to create |
| `DB_HOST` | `localhost` | Database host (for connection verification) |
| `DB_PORT` | `5432` | Database port (for connection verification) |

**Example Output:**

```
==========================================
  TrustedCars Database Setup
==========================================

[INFO] Database configuration:
  User:     trustedcars_user
  Database: trustedcars_db
  Host:     localhost
  Port:     5432

[INFO] Detected platform: macOS
[INFO] Checking PostgreSQL installation...
[SUCCESS] PostgreSQL client found
[SUCCESS] PostgreSQL service is running
[INFO] Creating PostgreSQL user: trustedcars_user
[SUCCESS] User 'trustedcars_user' created successfully
[INFO] Creating PostgreSQL database: trustedcars_db
[SUCCESS] Database 'trustedcars_db' created successfully
[INFO] Verifying database connection...
[SUCCESS] Successfully connected to database!

[INFO] Database connection details:
  Host:     localhost
  Port:     5432
  Database: trustedcars_db
  User:     trustedcars_user

[INFO] Connection string for .env file:
  DATABASE_URL=postgresql+asyncpg://trustedcars_user:trustedcars_password@localhost:5432/trustedcars_db

Do you want to apply database migrations now? (y/N) y
[INFO] Applying database migrations...
[INFO] Activating Python virtual environment...
[SUCCESS] Database migrations applied successfully!

[SUCCESS] Database setup complete!

[INFO] Next steps:
  1. Update backend/.env with the connection string shown above
  2. Start the backend server: cd backend && uvicorn app.main:app --reload
  3. Start the background worker: cd backend && python worker_main.py
```

**Features:**

- **Platform Detection**: Automatically detects macOS or Linux and uses appropriate commands
- **Idempotent**: Safe to run multiple times - handles existing users/databases gracefully
- **Error Handling**: Clear error messages with troubleshooting steps
- **Connection Verification**: Tests actual database connectivity before completion
- **Migration Support**: Optionally runs Alembic migrations to initialize schema
- **Colored Output**: Uses color-coded messages for better readability

**Troubleshooting:**

**Error: PostgreSQL client (psql) not found**
- Install PostgreSQL using the platform-specific commands shown in the error message
- Ensure PostgreSQL binaries are in your PATH

**Error: PostgreSQL service is not running**
- macOS: `brew services start postgresql@15` or `brew services start postgresql`
- Linux: `sudo systemctl start postgresql`
- Check status: `brew services list` (macOS) or `sudo systemctl status postgresql` (Linux)

**Error: Failed to create user**
- Ensure you have sufficient permissions
- On Linux, the script uses `sudo -u postgres` to run commands as the postgres superuser
- On macOS, the script uses your current user (default on Homebrew installations)

**Error: Failed to connect to database**
- Verify PostgreSQL is listening on localhost:5432: `psql -h localhost -p 5432 -l`
- Check PostgreSQL configuration: `pg_hba.conf` should allow local connections
- Ensure password authentication is enabled for local connections

**Error: Failed to apply migrations**
- Ensure Python virtual environment exists: `cd backend && python -m venv .venv`
- Activate venv and install dependencies: `pip install -r requirements.txt`
- Run migrations manually: `cd backend && source .venv/bin/activate && alembic upgrade head`

**Existing User/Database:**
- The script detects existing users and databases
- For existing users: updates the password to the specified value
- For existing databases: ensures correct ownership and skips creation

### Git Hooks

The `hooks/` directory contains Git hooks for the project. Use `install-hooks.sh` to install them.

## Contributing

When adding new scripts:
1. Make them executable: `chmod +x scripts/your-script.sh`
2. Add comprehensive error handling
3. Provide clear error messages with troubleshooting steps
4. Support environment variable configuration
5. Document the script in this README
6. Test on multiple platforms (macOS, Linux, Windows/WSL)

## Platform Support

Scripts are primarily designed for:
- **macOS** (Homebrew-based installations)
- **Linux** (Ubuntu/Debian and systemd-based distributions)
- **Windows** (WSL or PowerShell where applicable)

Platform-specific notes are included in each script's error messages and help text.
