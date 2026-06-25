#!/bin/bash
# MinIO Setup Script for TrustedCars
# This script creates the required MinIO bucket and configures access policies
# for local development

set -e  # Exit on any error

# Configuration
MINIO_ENDPOINT="${MINIO_ENDPOINT:-http://localhost:9000}"
MINIO_ACCESS_KEY="${MINIO_ACCESS_KEY:-minioadmin}"
MINIO_SECRET_KEY="${MINIO_SECRET_KEY:-minioadmin}"
BUCKET_NAME="${BUCKET_NAME:-trustedcars-images}"
MC_ALIAS="${MC_ALIAS:-local}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
print_header() {
    echo -e "\n${BLUE}===================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===================================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if MinIO client (mc) is installed
check_mc_installed() {
    if ! command -v mc &> /dev/null; then
        print_error "MinIO client (mc) is not installed"
        echo ""
        print_info "Install mc with one of the following methods:"
        echo ""
        echo "  macOS (Homebrew):"
        echo "    brew install minio/stable/mc"
        echo ""
        echo "  Linux:"
        echo "    wget https://dl.min.io/client/mc/release/linux-amd64/mc"
        echo "    chmod +x mc"
        echo "    sudo mv mc /usr/local/bin/"
        echo ""
        echo "  Windows:"
        echo "    Download from: https://dl.min.io/client/mc/release/windows-amd64/mc.exe"
        echo ""
        exit 1
    fi
    print_success "MinIO client (mc) is installed"
}

# Check if MinIO server is running
check_minio_running() {
    print_info "Checking MinIO connectivity at ${MINIO_ENDPOINT}..."
    
    if ! curl -s -o /dev/null -w "%{http_code}" "${MINIO_ENDPOINT}/minio/health/live" | grep -q "200"; then
        print_error "MinIO server is not running at ${MINIO_ENDPOINT}"
        echo ""
        print_info "Start MinIO with one of the following methods:"
        echo ""
        echo "  macOS (Homebrew):"
        echo "    brew services start minio"
        echo "    # Or run manually:"
        echo "    mkdir -p ~/minio/data"
        echo "    minio server ~/minio/data --console-address :9001"
        echo ""
        echo "  Linux (systemd):"
        echo "    sudo systemctl start minio"
        echo "    # Or run manually:"
        echo "    mkdir -p ~/minio/data"
        echo "    minio server ~/minio/data --console-address :9001"
        echo ""
        echo "  Windows:"
        echo "    minio.exe server C:\\minio\\data --console-address :9001"
        echo ""
        exit 1
    fi
    print_success "MinIO server is running at ${MINIO_ENDPOINT}"
}

# Configure MinIO client alias
configure_mc_alias() {
    print_info "Configuring MinIO client alias '${MC_ALIAS}'..."
    
    # Remove existing alias if it exists
    mc alias remove "${MC_ALIAS}" &> /dev/null || true
    
    # Add new alias
    if mc alias set "${MC_ALIAS}" "${MINIO_ENDPOINT}" "${MINIO_ACCESS_KEY}" "${MINIO_SECRET_KEY}" &> /dev/null; then
        print_success "MinIO client alias configured"
    else
        print_error "Failed to configure MinIO client alias"
        echo ""
        print_info "Verify your credentials:"
        echo "  Endpoint: ${MINIO_ENDPOINT}"
        echo "  Access Key: ${MINIO_ACCESS_KEY}"
        echo "  Secret Key: ${MINIO_SECRET_KEY}"
        exit 1
    fi
}

# Create bucket if it doesn't exist
create_bucket() {
    print_info "Checking if bucket '${BUCKET_NAME}' exists..."
    
    if mc ls "${MC_ALIAS}/${BUCKET_NAME}" &> /dev/null; then
        print_warning "Bucket '${BUCKET_NAME}' already exists"
    else
        print_info "Creating bucket '${BUCKET_NAME}'..."
        if mc mb "${MC_ALIAS}/${BUCKET_NAME}"; then
            print_success "Bucket '${BUCKET_NAME}' created successfully"
        else
            print_error "Failed to create bucket '${BUCKET_NAME}'"
            exit 1
        fi
    fi
}

# Set public download policy for car images
set_bucket_policy() {
    print_info "Setting public download policy for bucket '${BUCKET_NAME}'..."
    
    # Set anonymous download policy (public read access)
    if mc anonymous set download "${MC_ALIAS}/${BUCKET_NAME}"; then
        print_success "Public download policy set for bucket '${BUCKET_NAME}'"
        print_info "Images in this bucket can now be accessed publicly via URL"
    else
        print_error "Failed to set bucket policy"
        exit 1
    fi
}

# Verify bucket access
verify_bucket_access() {
    print_info "Verifying bucket access..."
    
    # List bucket contents (should work even if empty)
    if mc ls "${MC_ALIAS}/${BUCKET_NAME}" &> /dev/null; then
        print_success "Bucket is accessible"
    else
        print_error "Failed to access bucket"
        exit 1
    fi
    
    # Check bucket policy
    print_info "Current bucket policy:"
    mc anonymous get "${MC_ALIAS}/${BUCKET_NAME}" || true
}

# Display bucket information
display_bucket_info() {
    echo ""
    print_header "Bucket Configuration Summary"
    echo "  Bucket Name:     ${BUCKET_NAME}"
    echo "  Endpoint:        ${MINIO_ENDPOINT}"
    echo "  Access Policy:   Public Download (Anonymous Read)"
    echo "  Console URL:     ${MINIO_ENDPOINT/9000/9001}"
    echo "  Console Login:   ${MINIO_ACCESS_KEY} / ${MINIO_SECRET_KEY}"
    echo ""
    print_success "MinIO setup completed successfully!"
    echo ""
    print_info "Next steps:"
    echo "  1. Update your backend/.env file with:"
    echo "     S3_BUCKET_NAME=${BUCKET_NAME}"
    echo "     S3_ENDPOINT_URL=${MINIO_ENDPOINT}"
    echo "     AWS_ACCESS_KEY_ID=${MINIO_ACCESS_KEY}"
    echo "     AWS_SECRET_ACCESS_KEY=${MINIO_SECRET_KEY}"
    echo ""
    echo "  2. Access MinIO Console at: ${MINIO_ENDPOINT/9000/9001}"
    echo ""
    echo "  3. Test file upload through your application"
    echo ""
}

# Main execution
main() {
    print_header "TrustedCars MinIO Setup Script"
    
    # Run setup steps
    check_mc_installed
    check_minio_running
    configure_mc_alias
    create_bucket
    set_bucket_policy
    verify_bucket_access
    display_bucket_info
}

# Run main function
main
