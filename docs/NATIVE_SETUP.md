# Native Service Installation Guide

This guide provides step-by-step instructions for installing and configuring PostgreSQL 15, Redis 7, and MinIO natively on your local machine for TrustedCars development.

## Why Native Installation?

TrustedCars uses **native service installation** for local development instead of Docker. This approach provides:

✅ **Direct Access** — Use `psql`, `redis-cli`, and MinIO console directly without container exec  
✅ **Faster Iteration** — No container rebuilds or volume mounting overhead  
✅ **Easier Debugging** — Native profiling tools and debuggers work seamlessly  
✅ **Lower Resource Usage** — No Docker daemon overhead  
✅ **Simpler Troubleshooting** — Native tools and logs without container layers  

**Docker is still supported** for production deployments, CI/CD pipelines, and team members who prefer it. See `backend/docker-compose.yml` and `backend/Dockerfile` for production container configurations.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [PostgreSQL 15 Installation](#postgresql-15-installation)
  - [macOS](#postgresql-macos)
  - [Linux (Ubuntu/Debian)](#postgresql-linux)
  - [Windows](#postgresql-windows)
- [Redis 7 Installation](#redis-7-installation)
  - [macOS](#redis-macos)
  - [Linux (Ubuntu/Debian)](#redis-linux)
  - [Windows](#redis-windows)
- [MinIO Installation](#minio-installation)
  - [macOS](#minio-macos)
  - [Linux (Ubuntu/Debian)](#minio-linux)
  - [Windows](#minio-windows)
- [Service Verification](#service-verification)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before starting, ensure you have:
- Command line access (Terminal on macOS/Linux, PowerShell on Windows)
- Administrator/sudo privileges for service installation
- Basic familiarity with command line operations

## PostgreSQL 15 Installation

PostgreSQL is the primary database for TrustedCars. We use version 15 for optimal performance and feature support.

### PostgreSQL: macOS {#postgresql-macos}

**Installation using Homebrew:**

```bash
# Install PostgreSQL 15
brew install postgresql@15

# Add PostgreSQL to PATH (add to ~/.zshrc or ~/.bash_profile)
echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Start PostgreSQL service
brew services start postgresql@15
```

**Create Database User and Database:**

```bash
# Create the TrustedCars user
createuser -s trustedcars_user

# Set user password
psql postgres -c "ALTER USER trustedcars_user WITH PASSWORD 'trustedcars_password';"

# Create the database
createdb -O trustedcars_user trustedcars_db
```

**Verify Installation:**

```bash
# Test connection
psql -U trustedcars_user -d trustedcars_db -h localhost -c "SELECT version();"

# You should see PostgreSQL 15.x version information
```

**Service Management:**

```bash
# Start PostgreSQL
brew services start postgresql@15

# Stop PostgreSQL
brew services stop postgresql@15

# Restart PostgreSQL
brew services restart postgresql@15

# Check status
brew services list | grep postgresql
```

### PostgreSQL: Linux (Ubuntu/Debian) {#postgresql-linux}

**Installation using APT:**

```bash
# Update package list
sudo apt update

# Install PostgreSQL 15
sudo apt install -y postgresql-15 postgresql-contrib-15

# PostgreSQL service starts automatically after installation
```

**Create Database User and Database:**

```bash
# Switch to postgres user
sudo -i -u postgres

# Create the TrustedCars user
createuser -s trustedcars_user

# Set user password
psql -c "ALTER USER trustedcars_user WITH PASSWORD 'trustedcars_password';"

# Create the database
createdb -O trustedcars_user trustedcars_db

# Exit postgres user
exit
```

**Configure Authentication (if needed):**

```bash
# Edit pg_hba.conf to allow password authentication
sudo nano /etc/postgresql/15/main/pg_hba.conf

# Add or modify this line (should already exist for localhost):
# local   all             all                                     md5
# host    all             all             127.0.0.1/32            md5

# Restart PostgreSQL to apply changes
sudo systemctl restart postgresql
```

**Verify Installation:**

```bash
# Test connection
psql -U trustedcars_user -d trustedcars_db -h localhost -c "SELECT version();"

# Enter password when prompted: trustedcars_password
```

**Service Management:**

```bash
# Start PostgreSQL
sudo systemctl start postgresql

# Stop PostgreSQL
sudo systemctl stop postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Enable on boot
sudo systemctl enable postgresql

# Check status
sudo systemctl status postgresql
```

### PostgreSQL: Windows {#postgresql-windows}

**Installation using Installer:**

1. Download PostgreSQL 15 installer from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
2. Run the installer (postgresql-15.x-x-windows-x64.exe)
3. Follow the installation wizard:
   - Set installation directory (default: C:\Program Files\PostgreSQL\15)
   - Select components: PostgreSQL Server, pgAdmin 4, Command Line Tools
   - Set data directory (default: C:\Program Files\PostgreSQL\15\data)
   - Set password for postgres superuser (remember this!)
   - Set port: 5432 (default)
   - Set locale: Default locale

**Create Database User and Database using psql:**

```powershell
# Open Command Prompt or PowerShell as Administrator
# Navigate to PostgreSQL bin directory
cd "C:\Program Files\PostgreSQL\15\bin"

# Connect to PostgreSQL
.\psql.exe -U postgres

# In psql prompt, run:
CREATE USER trustedcars_user WITH PASSWORD 'trustedcars_password';
ALTER USER trustedcars_user CREATEDB;
CREATE DATABASE trustedcars_db OWNER trustedcars_user;

# Exit psql
\q
```

**Alternative: Create Database using pgAdmin 4:**

1. Open pgAdmin 4 from Start Menu
2. Connect to PostgreSQL 15 server (enter postgres password)
3. Right-click "Login/Group Roles" → Create → Login/Group Role
   - Name: trustedcars_user
   - Password tab: Set password to 'trustedcars_password'
   - Privileges tab: Check "Can login" and "Create databases"
4. Right-click "Databases" → Create → Database
   - Database: trustedcars_db
   - Owner: trustedcars_user

**Verify Installation:**

```powershell
# Test connection
cd "C:\Program Files\PostgreSQL\15\bin"
.\psql.exe -U trustedcars_user -d trustedcars_db -h localhost -c "SELECT version();"

# Enter password when prompted: trustedcars_password
```

**Service Management:**

```powershell
# Start PostgreSQL service
net start postgresql-x64-15

# Stop PostgreSQL service
net stop postgresql-x64-15

# Check service status
sc query postgresql-x64-15
```

**Add to PATH (optional but recommended):**

```powershell
# Add PostgreSQL bin to System PATH
# Open System Properties → Environment Variables
# Edit PATH variable, add: C:\Program Files\PostgreSQL\15\bin
```

## Redis 7 Installation

Redis is used for session storage, rate limiting, and caching in TrustedCars. We use version 7 for enhanced security and performance features.

### Redis: macOS {#redis-macos}

**Installation using Homebrew:**

```bash
# Install Redis 7
brew install redis

# Verify version (should be 7.x)
redis-server --version
```

**Configure Password Authentication:**

```bash
# Edit Redis configuration
nano /opt/homebrew/etc/redis.conf

# Find the line with "# requirepass" and change it to:
requirepass redis_password

# Save and exit (Ctrl+O, Enter, Ctrl+X)
```

**Start Redis Service:**

```bash
# Start Redis service
brew services start redis

# Redis will now start automatically on system boot
```

**Verify Installation:**

```bash
# Test connection with password
redis-cli -a redis_password ping

# Should return: PONG

# Test basic operations
redis-cli -a redis_password
> SET test "Hello TrustedCars"
> GET test
> DEL test
> EXIT
```

**Service Management:**

```bash
# Start Redis
brew services start redis

# Stop Redis
brew services stop redis

# Restart Redis
brew services restart redis

# Check status
brew services list | grep redis
```

### Redis: Linux (Ubuntu/Debian) {#redis-linux}

**Installation using APT:**

```bash
# Update package list
sudo apt update

# Install Redis 7
sudo apt install -y redis-server

# Verify version
redis-server --version
```

**Configure Password Authentication:**

```bash
# Edit Redis configuration
sudo nano /etc/redis/redis.conf

# Find the line with "# requirepass" and change it to:
requirepass redis_password

# Also ensure Redis is bound to localhost:
bind 127.0.0.1 ::1

# Save and exit (Ctrl+O, Enter, Ctrl+X)
```

**Configure as System Service:**

```bash
# Enable supervised mode in redis.conf
sudo nano /etc/redis/redis.conf

# Find "supervised no" and change to:
supervised systemd

# Save and exit
```

**Start Redis Service:**

```bash
# Restart Redis to apply configuration
sudo systemctl restart redis-server

# Enable Redis to start on boot
sudo systemctl enable redis-server
```

**Verify Installation:**

```bash
# Test connection with password
redis-cli -a redis_password ping

# Should return: PONG

# Check Redis is listening on correct port
sudo netstat -lntp | grep redis
# Should show: 127.0.0.1:6379
```

**Service Management:**

```bash
# Start Redis
sudo systemctl start redis-server

# Stop Redis
sudo systemctl stop redis-server

# Restart Redis
sudo systemctl restart redis-server

# Check status
sudo systemctl status redis-server
```

### Redis: Windows {#redis-windows}

**Note:** Redis does not officially support Windows. The recommended approach is to use Windows Subsystem for Linux (WSL) or use the archived Windows port.

**Option 1: Using WSL (Recommended):**

```powershell
# Install WSL if not already installed
wsl --install

# After WSL is installed, open WSL terminal and follow Linux installation instructions above
```

**Option 2: Using Legacy Windows Port:**

1. Download Redis for Windows from [GitHub Releases](https://github.com/microsoftarchive/redis/releases)
   - Latest version: Redis-x64-3.0.504.msi (Note: This is Redis 3.0, not 7.0)
2. Run the installer
3. Follow installation wizard, select "Add to PATH"

**Configure Password (Windows Port):**

```powershell
# Navigate to Redis installation directory
cd "C:\Program Files\Redis"

# Edit redis.windows.conf
notepad redis.windows.conf

# Find "# requirepass" and change to:
requirepass redis_password

# Save and close
```

**Restart Redis Service:**

```powershell
# Stop Redis service
net stop Redis

# Start Redis service
net start Redis
```

**Verify Installation:**

```powershell
# Test connection
redis-cli -a redis_password ping

# Should return: PONG
```

**Service Management:**

```powershell
# Start Redis
net start Redis

# Stop Redis
net stop Redis

# Check status
sc query Redis
```

**WSL Installation (Full Redis 7 Support):**

If using WSL, open WSL terminal and follow the Linux instructions exactly. Access Redis from Windows using `localhost:6379`.

## MinIO Installation

MinIO provides S3-compatible object storage for car images and attachments in TrustedCars development. For production, AWS S3 is recommended.

### MinIO: macOS {#minio-macos}

**Installation using Homebrew:**

```bash
# Install MinIO server
brew install minio/stable/minio

# Install MinIO client (mc) for bucket management
brew install minio/stable/mc

# Verify installation
minio --version
mc --version
```

**Create Data Directory:**

```bash
# Create directory for MinIO data
mkdir -p ~/minio/data
```

**Start MinIO Server:**

```bash
# Start MinIO server (run in a separate terminal or use screen/tmux)
minio server ~/minio/data --console-address :9001

# MinIO will output:
# API: http://192.168.x.x:9000  http://127.0.0.1:9000
# Console: http://192.168.x.x:9001  http://127.0.0.1:9001
# Root User: minioadmin
# Root Password: minioadmin
```

**Create MinIO System Service (optional):**

```bash
# Create LaunchAgent plist
nano ~/Library/LaunchAgents/com.minio.server.plist

# Add the following content:
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.minio.server</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/minio</string>
        <string>server</string>
        <string>/Users/YOUR_USERNAME/minio/data</string>
        <string>--console-address</string>
        <string>:9001</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>

# Replace YOUR_USERNAME with your actual username
# Load the service
launchctl load ~/Library/LaunchAgents/com.minio.server.plist
```

**Configure MinIO Client:**

```bash
# Set up local alias
mc alias set local http://localhost:9000 minioadmin minioadmin

# Test connection
mc admin info local
```

**Create TrustedCars Bucket:**

```bash
# Create bucket for car images
mc mb local/trustedcars-images

# Set public download policy (images need to be publicly accessible)
mc anonymous set download local/trustedcars-images

# Verify bucket created
mc ls local
```

**Verify Installation:**

```bash
# Test file upload
echo "Test file" > test.txt
mc cp test.txt local/trustedcars-images/
mc ls local/trustedcars-images/
rm test.txt

# Access MinIO Console in browser
open http://localhost:9001
# Login: minioadmin / minioadmin
```

### MinIO: Linux (Ubuntu/Debian) {#minio-linux}

**Installation using Binary:**

```bash
# Download MinIO server binary
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/

# Download MinIO client (mc)
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/

# Verify installation
minio --version
mc --version
```

**Create Data Directory:**

```bash
# Create directory for MinIO data
mkdir -p ~/minio/data
```

**Create MinIO System Service:**

```bash
# Create systemd service file
sudo tee /etc/systemd/system/minio.service > /dev/null <<EOF
[Unit]
Description=MinIO Object Storage
Documentation=https://min.io/docs/minio/linux/index.html
Wants=network-online.target
After=network-online.target

[Service]
User=$USER
WorkingDirectory=$HOME/minio
ExecStart=/usr/local/bin/minio server $HOME/minio/data --console-address :9001
Restart=always
LimitNOFILE=65536
Environment="MINIO_ROOT_USER=minioadmin"
Environment="MINIO_ROOT_PASSWORD=minioadmin"

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
sudo systemctl daemon-reload

# Start MinIO service
sudo systemctl start minio

# Enable MinIO to start on boot
sudo systemctl enable minio
```

**Configure MinIO Client:**

```bash
# Set up local alias
mc alias set local http://localhost:9000 minioadmin minioadmin

# Test connection
mc admin info local
```

**Create TrustedCars Bucket:**

```bash
# Create bucket
mc mb local/trustedcars-images

# Set public download policy
mc anonymous set download local/trustedcars-images

# Verify bucket created
mc ls local
```

**Verify Installation:**

```bash
# Check service status
sudo systemctl status minio

# Test file upload
echo "Test file" > test.txt
mc cp test.txt local/trustedcars-images/
mc ls local/trustedcars-images/
rm test.txt

# Access MinIO Console in browser
# Navigate to: http://localhost:9001
# Login: minioadmin / minioadmin
```

### MinIO: Windows {#minio-windows}

**Installation using Binary:**

1. Download MinIO for Windows from [MinIO Downloads](https://min.io/download#/windows)
2. Download `minio.exe` and `mc.exe`
3. Create directory: `C:\minio\`
4. Place `minio.exe` and `mc.exe` in `C:\minio\`
5. Create data directory: `C:\minio\data`

**Add MinIO to PATH:**

```powershell
# Add C:\minio to System PATH
# Open System Properties → Environment Variables
# Edit PATH variable, add: C:\minio
```

**Start MinIO Server:**

```powershell
# Open PowerShell or Command Prompt
cd C:\minio
.\minio.exe server C:\minio\data --console-address :9001

# MinIO will output access information
# API: http://127.0.0.1:9000
# Console: http://127.0.0.1:9001
# Root User: minioadmin
# Root Password: minioadmin
```

**Create MinIO Windows Service (optional):**

Using NSSM (Non-Sucking Service Manager):

```powershell
# Download NSSM from https://nssm.cc/download
# Extract nssm.exe to C:\minio\

# Install MinIO as service
cd C:\minio
.\nssm.exe install MinIO

# In the NSSM GUI:
# Path: C:\minio\minio.exe
# Startup directory: C:\minio
# Arguments: server C:\minio\data --console-address :9001

# Start service
net start MinIO
```

**Configure MinIO Client:**

```powershell
# Open PowerShell in C:\minio
cd C:\minio

# Set up local alias
.\mc.exe alias set local http://localhost:9000 minioadmin minioadmin

# Test connection
.\mc.exe admin info local
```

**Create TrustedCars Bucket:**

```powershell
# Create bucket
.\mc.exe mb local/trustedcars-images

# Set public download policy
.\mc.exe anonymous set download local/trustedcars-images

# Verify bucket
.\mc.exe ls local
```

**Verify Installation:**

```powershell
# Test file upload
echo "Test file" > test.txt
.\mc.exe cp test.txt local/trustedcars-images/
.\mc.exe ls local/trustedcars-images/
del test.txt

# Access MinIO Console in browser
# Navigate to: http://localhost:9001
# Login: minioadmin / minioadmin
```

## Service Verification

After installing all services, verify they are running correctly:

### Check All Services Status

**macOS:**
```bash
# PostgreSQL
brew services list | grep postgresql
psql -U trustedcars_user -d trustedcars_db -h localhost -c "SELECT 1;"

# Redis
brew services list | grep redis
redis-cli -a redis_password ping

# MinIO
ps aux | grep minio
curl http://localhost:9000/minio/health/live
```

**Linux:**
```bash
# PostgreSQL
sudo systemctl status postgresql
psql -U trustedcars_user -d trustedcars_db -h localhost -c "SELECT 1;"

# Redis
sudo systemctl status redis-server
redis-cli -a redis_password ping

# MinIO
sudo systemctl status minio
curl http://localhost:9000/minio/health/live
```

**Windows:**
```powershell
# PostgreSQL
sc query postgresql-x64-15
cd "C:\Program Files\PostgreSQL\15\bin"
.\psql.exe -U trustedcars_user -d trustedcars_db -h localhost -c "SELECT 1;"

# Redis
sc query Redis
redis-cli -a redis_password ping

# MinIO
sc query MinIO
curl http://localhost:9000/minio/health/live
```

### Test Backend Connectivity

Once services are running, test backend connectivity:

```bash
# Navigate to backend directory
cd backend

# Activate Python virtual environment
source .venv/bin/activate  # macOS/Linux
# or
.venv\Scripts\activate  # Windows

# Run Alembic migrations
alembic upgrade head

# Start backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# In another terminal, test backend health
curl http://localhost:8000/health/live
```

## Troubleshooting

### PostgreSQL Issues

**Issue: Connection refused**
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql  # macOS
sudo systemctl status postgresql      # Linux
sc query postgresql-x64-15            # Windows

# Check PostgreSQL port
sudo lsof -i :5432  # macOS/Linux
netstat -ano | findstr :5432  # Windows
```

**Issue: Authentication failed**
```bash
# Reset password
# macOS/Linux:
psql -U postgres -c "ALTER USER trustedcars_user WITH PASSWORD 'trustedcars_password';"

# Windows:
cd "C:\Program Files\PostgreSQL\15\bin"
.\psql.exe -U postgres -c "ALTER USER trustedcars_user WITH PASSWORD 'trustedcars_password';"
```

**Issue: Database does not exist**
```bash
# Recreate database
# macOS:
createdb -O trustedcars_user trustedcars_db

# Linux:
sudo -u postgres createdb -O trustedcars_user trustedcars_db

# Windows:
cd "C:\Program Files\PostgreSQL\15\bin"
.\psql.exe -U postgres -c "CREATE DATABASE trustedcars_db OWNER trustedcars_user;"
```

### Redis Issues

**Issue: Connection refused**
```bash
# Check if Redis is running
brew services list | grep redis       # macOS
sudo systemctl status redis-server    # Linux
sc query Redis                        # Windows

# Check Redis port
sudo lsof -i :6379  # macOS/Linux
netstat -ano | findstr :6379  # Windows
```

**Issue: NOAUTH Authentication required**
```bash
# Verify password in redis.conf
# macOS:
cat /opt/homebrew/etc/redis.conf | grep requirepass

# Linux:
sudo cat /etc/redis/redis.conf | grep requirepass

# Windows:
type "C:\Program Files\Redis\redis.windows.conf" | findstr requirepass

# Test with correct password
redis-cli -a redis_password ping
```

**Issue: Redis not accepting connections**
```bash
# Check bind address in redis.conf
# Should be: bind 127.0.0.1 ::1

# Restart Redis
brew services restart redis           # macOS
sudo systemctl restart redis-server   # Linux
net stop Redis && net start Redis     # Windows
```

### MinIO Issues

**Issue: Cannot connect to MinIO**
```bash
# Check if MinIO is running
ps aux | grep minio                   # macOS/Linux
tasklist | findstr minio              # Windows

# Check MinIO ports
sudo lsof -i :9000  # macOS/Linux (API)
sudo lsof -i :9001  # macOS/Linux (Console)
netstat -ano | findstr :9000  # Windows
netstat -ano | findstr :9001  # Windows
```

**Issue: Bucket not found**
```bash
# List all buckets
mc ls local

# Recreate bucket if missing
mc mb local/trustedcars-images
mc anonymous set download local/trustedcars-images
```

**Issue: Access denied on bucket**
```bash
# Check bucket policy
mc stat local/trustedcars-images

# Reset public download policy
mc anonymous set download local/trustedcars-images

# Verify policy
mc anonymous get local/trustedcars-images
```

**Issue: MinIO credentials not working**
```bash
# Remove and re-add alias
mc alias remove local
mc alias set local http://localhost:9000 minioadmin minioadmin

# Test connection
mc admin info local
```

### Port Conflicts

If any service fails to start due to port conflicts:

**PostgreSQL (port 5432):**
```bash
# Find process using port
sudo lsof -i :5432  # macOS/Linux
netstat -ano | findstr :5432  # Windows

# Kill conflicting process or change PostgreSQL port in postgresql.conf
```

**Redis (port 6379):**
```bash
# Find process using port
sudo lsof -i :6379  # macOS/Linux
netstat -ano | findstr :6379  # Windows

# Kill conflicting process or change Redis port in redis.conf
```

**MinIO (ports 9000, 9001):**
```bash
# Find process using ports
sudo lsof -i :9000  # macOS/Linux
sudo lsof -i :9001  # macOS/Linux
netstat -ano | findstr :9000  # Windows
netstat -ano | findstr :9001  # Windows

# Kill conflicting process or change MinIO ports:
minio server ~/minio/data --address :9002 --console-address :9003
```

### General Debugging

**Enable verbose logging:**
- PostgreSQL: Edit `postgresql.conf`, set `log_statement = 'all'`
- Redis: Start with `redis-server --loglevel debug`
- MinIO: Start with `MINIO_LOG_LEVEL=debug minio server ...`

**Check service logs:**
```bash
# PostgreSQL logs
# macOS:
tail -f /opt/homebrew/var/log/postgresql@15.log

# Linux:
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# Redis logs
# macOS:
tail -f /opt/homebrew/var/log/redis.log

# Linux:
sudo tail -f /var/log/redis/redis-server.log

# MinIO logs (stdout/stderr from terminal where it's running)
```

## Next Steps

After successfully installing and verifying all services:

1. **Update Backend Configuration**: Update `backend/.env` with native service connection strings
   - See [../backend/.env.example](../backend/.env.example) for configuration examples

2. **Run Database Migrations**: Apply all Alembic migrations
   ```bash
   cd backend
   source .venv/bin/activate
   alembic upgrade head
   ```

3. **Start Development**: Follow the development workflow guide
   - See [DEVELOPMENT.md](./DEVELOPMENT.md) for development mode instructions

4. **Test Integration**: Verify backend connects to all services
   ```bash
   cd backend
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/15/)
- [Redis Documentation](https://redis.io/docs/)
- [MinIO Documentation](https://min.io/docs/minio/linux/index.html)
- [TrustedCars Development Guide](./DEVELOPMENT.md)
- [TrustedCars Migration Guide](./MIGRATION.md)
- [TrustedCars Troubleshooting Guide](./TROUBLESHOOTING.md)

## Support

If you encounter issues not covered in this guide:
1. Check the [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) guide
2. Review service-specific documentation linked above
3. Check service logs for detailed error messages
4. Reach out to the development team for assistance
