#!/bin/bash
# Install Git hooks from repository
# This script copies tracked hook scripts from scripts/hooks/ to .git/hooks/
# and makes them executable

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get repository root directory
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)

if [ -z "$REPO_ROOT" ]; then
    echo -e "${RED}❌ Error: Not in a Git repository${NC}"
    exit 1
fi

HOOKS_SOURCE="$REPO_ROOT/scripts/hooks"
HOOKS_TARGET="$REPO_ROOT/.git/hooks"

echo "🔧 Installing Git hooks from repository..."
echo ""

# Check if source hooks directory exists
if [ ! -d "$HOOKS_SOURCE" ]; then
    echo -e "${RED}❌ Error: Hooks source directory not found: $HOOKS_SOURCE${NC}"
    exit 1
fi

# Check if .git/hooks directory exists
if [ ! -d "$HOOKS_TARGET" ]; then
    echo -e "${RED}❌ Error: Git hooks directory not found: $HOOKS_TARGET${NC}"
    echo "Are you in a Git repository?"
    exit 1
fi

# Count hooks to install
HOOK_COUNT=0

# Install each hook from scripts/hooks/
for hook_file in "$HOOKS_SOURCE"/*; do
    if [ -f "$hook_file" ]; then
        hook_name=$(basename "$hook_file")
        target_file="$HOOKS_TARGET/$hook_name"
        
        # Check if hook already exists
        if [ -f "$target_file" ]; then
            echo -e "${YELLOW}⚠️  Hook already exists: $hook_name${NC}"
            echo -n "   Overwrite? [y/N] "
            read -r response
            if [[ ! "$response" =~ ^[Yy]$ ]]; then
                echo "   Skipped $hook_name"
                continue
            fi
        fi
        
        # Copy hook to .git/hooks/
        cp "$hook_file" "$target_file"
        
        # Make executable
        chmod +x "$target_file"
        
        echo -e "${GREEN}✓ Installed: $hook_name${NC}"
        HOOK_COUNT=$((HOOK_COUNT + 1))
    fi
done

echo ""

if [ $HOOK_COUNT -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No hooks were installed${NC}"
    exit 0
fi

echo -e "${GREEN}✅ Successfully installed $HOOK_COUNT hook(s)${NC}"
echo ""
echo "Installed hooks:"
ls -1 "$HOOKS_TARGET" | grep -v "\.sample$" | sed 's/^/  - /'
echo ""
echo "These hooks will run automatically on git operations."
echo "To bypass a hook, use: git <command> --no-verify"
echo ""
echo "For more information, see: docs/SECRET_MANAGEMENT.md"
