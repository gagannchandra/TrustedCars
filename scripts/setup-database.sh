#!/usr/bin/env bash
#
# Database Setup Script for TrustedCars
# Creates PostgreSQL user, database, and verifies connection
# Supports macOS and Linux
#

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default database configuration
DB_USER="${DB_USER:-trustedcars_user}"
DB_PASSWORD="${DB_PASSWORD:-trustedcars_password}"
DB_NAME="${DB_NAME:-trustedcars_db}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Functions for colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Detect platform
detect_platform() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        PLATFORM="macos"
        print_info "Detected platform: macOS"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        PLATFORM="linux"
        print_info "Detected platform: Linux"
    else
        print_error "Unsupported platform: $OSTYPE"
        print_info "This script supports macOS and Linux only."
        exit 1
    fi
}

# Check if PostgreSQL is installed and running
check_postgresql() {
    print_info "Checking PostgreSQL installation..."
    
    if ! command -v psql &> /dev/null; then
        print_error "PostgreSQL client (psql) not found!"
        print_info "Please install PostgreSQL 15:"
        
        if [[ "$PLATFORM" == "macos" ]]; then
            echo "  brew install postgresql@15"
            echo "  brew services start postgresql@15"
        elif [[ "$PLATFORM" == "linux" ]]; then
            echo "  sudo apt update"
            echo "  sudo apt install postgresql-15 postgresql-contrib"
            echo "  sudo systemctl start postgresql"
        fi
        
        exit 1
    fi
    
    print_success "PostgreSQL client found"
    
    # Check if PostgreSQL service is running
    if [[ "$PLATFORM" == "macos" ]]; then
        if ! brew services list | grep -q "postgresql.*started"; then
            print_warning "PostgreSQL service is not running"
            print_info "Starting PostgreSQL service..."
            brew services start postgresql@15 || brew services start postgresql
        fi
    elif [[ "$PLATFORM" == "linux" ]]; then
        if ! sudo systemctl is-active --quiet postgresql; then
            print_warning "PostgreSQL service is not running"
            print_info "Starting PostgreSQL service..."
            sudo systemctl start postgresql
        fi
    fi
    
    print_success "PostgreSQL service is running"
}

# Create PostgreSQL user
create_user() {
    print_info "Creating PostgreSQL user: $DB_USER"
    
    # Check if user already exists
    local user_exists=0
    
    if [[ "$PLATFORM" == "macos" ]]; then
        # macOS: use current user or postgres
        if psql -U "$USER" postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" 2>/dev/null | grep -q 1; then
            user_exists=1
        fi
    elif [[ "$PLATFORM" == "linux" ]]; then
        # Linux: use sudo -u postgres
        if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" 2>/dev/null | grep -q 1; then
            user_exists=1
        fi
    fi
    
    if [[ $user_exists -eq 1 ]]; then
        print_warning "User '$DB_USER' already exists"
        
        # Update password for existing user
        print_info "Updating password for existing user..."
        if [[ "$PLATFORM" == "macos" ]]; then
            psql -U "$USER" postgres -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || {
                print_error "Failed to update user password"
                return 1
            }
        elif [[ "$PLATFORM" == "linux" ]]; then
            sudo -u postgres psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || {
                print_error "Failed to update user password"
                return 1
            }
        fi
        
        print_success "Password updated for user '$DB_USER'"
    else
        # Create new user
        if [[ "$PLATFORM" == "macos" ]]; then
            psql -U "$USER" postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD' CREATEDB;" 2>/dev/null || {
                print_error "Failed to create user"
                return 1
            }
        elif [[ "$PLATFORM" == "linux" ]]; then
            sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD' CREATEDB;" 2>/dev/null || {
                print_error "Failed to create user"
                return 1
            }
        fi
        
        print_success "User '$DB_USER' created successfully"
    fi
}

# Create PostgreSQL database
create_database() {
    print_info "Creating PostgreSQL database: $DB_NAME"
    
    # Check if database already exists
    local db_exists=0
    
    if [[ "$PLATFORM" == "macos" ]]; then
        if psql -U "$USER" postgres -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
            db_exists=1
        fi
    elif [[ "$PLATFORM" == "linux" ]]; then
        if sudo -u postgres psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
            db_exists=1
        fi
    fi
    
    if [[ $db_exists -eq 1 ]]; then
        print_warning "Database '$DB_NAME' already exists"
        
        # Change database owner to ensure correct ownership
        print_info "Ensuring correct database ownership..."
        if [[ "$PLATFORM" == "macos" ]]; then
            psql -U "$USER" postgres -c "ALTER DATABASE $DB_NAME OWNER TO $DB_USER;" 2>/dev/null || {
                print_warning "Could not change database owner (might not have permissions)"
            }
        elif [[ "$PLATFORM" == "linux" ]]; then
            sudo -u postgres psql -c "ALTER DATABASE $DB_NAME OWNER TO $DB_USER;" 2>/dev/null || {
                print_warning "Could not change database owner"
            }
        fi
    else
        # Create new database
        if [[ "$PLATFORM" == "macos" ]]; then
            psql -U "$USER" postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || {
                print_error "Failed to create database"
                return 1
            }
        elif [[ "$PLATFORM" == "linux" ]]; then
            sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || {
                print_error "Failed to create database"
                return 1
            }
        fi
        
        print_success "Database '$DB_NAME' created successfully"
    fi
}

# Verify database connection
verify_connection() {
    print_info "Verifying database connection..."
    
    # Set PGPASSWORD to avoid interactive password prompt
    export PGPASSWORD="$DB_PASSWORD"
    
    # Try to connect and run a simple query
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &> /dev/null; then
        print_success "Successfully connected to database!"
        
        # Show connection details
        echo ""
        print_info "Database connection details:"
        echo "  Host:     $DB_HOST"
        echo "  Port:     $DB_PORT"
        echo "  Database: $DB_NAME"
        echo "  User:     $DB_USER"
        echo ""
        print_info "Connection string for .env file:"
        echo "  DATABASE_URL=postgresql+asyncpg://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
        echo ""
    else
        print_error "Failed to connect to database!"
        print_info "Please check your PostgreSQL configuration and try again."
        unset PGPASSWORD
        return 1
    fi
    
    # Clean up password from environment
    unset PGPASSWORD
}

# Apply database migrations
apply_migrations() {
    print_info "Checking for Alembic migrations..."
    
    local backend_dir="$(dirname "$0")/../backend"
    
    if [[ ! -d "$backend_dir" ]]; then
        print_warning "Backend directory not found: $backend_dir"
        print_info "Skipping migration step. Run migrations manually with:"
        echo "  cd backend && alembic upgrade head"
        return 0
    fi
    
    if [[ ! -f "$backend_dir/alembic.ini" ]]; then
        print_warning "Alembic configuration not found"
        print_info "Skipping migration step. Run migrations manually if needed."
        return 0
    fi
    
    # Ask user if they want to apply migrations
    echo ""
    read -p "Do you want to apply database migrations now? (y/N) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Applying database migrations..."
        
        # Check if virtual environment exists
        if [[ -d "$backend_dir/.venv" ]]; then
            print_info "Activating Python virtual environment..."
            
            # Activate venv and run migrations
            (
                cd "$backend_dir"
                source .venv/bin/activate
                
                # Set DATABASE_URL for migration
                export DATABASE_URL="postgresql+asyncpg://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
                
                alembic upgrade head
            )
            
            if [[ $? -eq 0 ]]; then
                print_success "Database migrations applied successfully!"
            else
                print_error "Failed to apply migrations"
                print_info "You can apply them manually with:"
                echo "  cd backend && source .venv/bin/activate && alembic upgrade head"
                return 1
            fi
        else
            print_warning "Python virtual environment not found at $backend_dir/.venv"
            print_info "Please apply migrations manually with:"
            echo "  cd backend && source .venv/bin/activate && alembic upgrade head"
        fi
    else
        print_info "Skipping migrations. Apply them manually when ready with:"
        echo "  cd backend && source .venv/bin/activate && alembic upgrade head"
    fi
}

# Main execution
main() {
    echo ""
    echo "=========================================="
    echo "  TrustedCars Database Setup"
    echo "=========================================="
    echo ""
    
    # Allow custom configuration via environment variables
    if [[ -n "$DB_USER" ]] || [[ -n "$DB_PASSWORD" ]] || [[ -n "$DB_NAME" ]]; then
        print_info "Using custom database configuration from environment variables"
    fi
    
    print_info "Database configuration:"
    echo "  User:     $DB_USER"
    echo "  Database: $DB_NAME"
    echo "  Host:     $DB_HOST"
    echo "  Port:     $DB_PORT"
    echo ""
    
    # Detect platform
    detect_platform
    
    # Check PostgreSQL installation
    check_postgresql
    
    # Create user
    create_user || exit 1
    
    # Create database
    create_database || exit 1
    
    # Verify connection
    verify_connection || exit 1
    
    # Apply migrations (optional)
    apply_migrations
    
    echo ""
    print_success "Database setup complete!"
    echo ""
    print_info "Next steps:"
    echo "  1. Update backend/.env with the connection string shown above"
    echo "  2. Start the backend server: cd backend && uvicorn app.main:app --reload"
    echo "  3. Start the background worker: cd backend && python worker_main.py"
    echo ""
}

# Run main function
main "$@"
