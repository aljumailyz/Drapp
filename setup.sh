#!/bin/bash
#
# Drapp CLI Setup Script
# One-command setup from git clone to ready-to-use
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Box drawing
print_header() {
    echo ""
    echo -e "${CYAN}╭──────────────────────────────────────────────────╮${NC}"
    echo -e "${CYAN}│${NC}  ${BOLD}Drapp CLI Setup${NC}                                 ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}  ${DIM}Video archival made simple${NC}                       ${CYAN}│${NC}"
    echo -e "${CYAN}╰──────────────────────────────────────────────────╯${NC}"
    echo ""
}

print_step() {
    echo -e "${BLUE}→${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}!${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

check_command() {
    if command -v "$1" &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# Main setup
print_header

# Step 1: Check Node.js
print_step "Checking Node.js installation..."
if check_command node; then
    NODE_VERSION=$(node -v)
    print_success "Node.js found: $NODE_VERSION"

    # Check version is >= 18
    MAJOR_VERSION=$(echo "$NODE_VERSION" | sed 's/v//' | cut -d. -f1)
    if [ "$MAJOR_VERSION" -lt 18 ]; then
        print_error "Node.js 18 or higher is required (found $NODE_VERSION)"
        echo ""
        echo "Please upgrade Node.js:"
        echo "  - Using nvm: nvm install 18"
        echo "  - Or download from: https://nodejs.org/"
        exit 1
    fi
else
    print_error "Node.js is not installed"
    echo ""
    echo "Please install Node.js 18 or higher:"
    echo "  - Using nvm (recommended):"
    echo "      curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    echo "      nvm install 18"
    echo "  - Or download from: https://nodejs.org/"
    exit 1
fi

# Step 2: Check npm
print_step "Checking npm..."
if check_command npm; then
    NPM_VERSION=$(npm -v)
    print_success "npm found: $NPM_VERSION"
else
    print_error "npm is not installed"
    exit 1
fi

# Step 3: Check FFmpeg
print_step "Checking FFmpeg installation..."
if check_command ffmpeg; then
    FFMPEG_VERSION=$(ffmpeg -version 2>&1 | head -n1 | awk '{print $3}')
    print_success "FFmpeg found: $FFMPEG_VERSION"

    # Check for AV1 support
    if ffmpeg -encoders 2>&1 | grep -q "libsvtav1\|libaom-av1"; then
        print_success "AV1 encoder support detected"
    else
        print_warning "AV1 encoder not found - H.265 will still work"
        echo -e "  ${DIM}For AV1 support, install ffmpeg with libsvtav1 or libaom-av1${NC}"
    fi
else
    print_warning "FFmpeg is not installed"
    echo ""
    echo "FFmpeg is required for video encoding. Install it:"
    echo ""
    echo "  Ubuntu/Debian:"
    echo "    sudo apt update && sudo apt install ffmpeg"
    echo ""
    echo "  Fedora:"
    echo "    sudo dnf install ffmpeg"
    echo ""
    echo "  Arch Linux:"
    echo "    sudo pacman -S ffmpeg"
    echo ""
    echo "  macOS:"
    echo "    brew install ffmpeg"
    echo ""
    read -p "Continue setup anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 4: Install dependencies
echo ""
print_step "Installing dependencies..."
npm install --silent 2>&1 | while read line; do
    echo -e "  ${DIM}$line${NC}"
done
print_success "Dependencies installed"

# Step 5: Build CLI
print_step "Building CLI..."
npm run build:cli --silent 2>&1
print_success "CLI built successfully"

# Step 6: Create convenient alias
echo ""
print_step "Setting up command alias..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_PATH="$SCRIPT_DIR/out/cli/index.cjs"

# Determine shell config file
if [ -n "$ZSH_VERSION" ] || [ -f "$HOME/.zshrc" ]; then
    SHELL_RC="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then
    SHELL_RC="$HOME/.bashrc"
else
    SHELL_RC="$HOME/.profile"
fi

# Check if alias already exists
if grep -q "alias drapp=" "$SHELL_RC" 2>/dev/null; then
    print_success "Alias 'drapp' already configured"
else
    echo "" >> "$SHELL_RC"
    echo "# Drapp CLI" >> "$SHELL_RC"
    echo "alias drapp='node $CLI_PATH'" >> "$SHELL_RC"
    print_success "Added 'drapp' alias to $SHELL_RC"
fi

# Final summary
echo ""
echo -e "${GREEN}╭──────────────────────────────────────────────────╮${NC}"
echo -e "${GREEN}│${NC}  ${GREEN}${BOLD}Setup Complete!${NC}                                 ${GREEN}│${NC}"
echo -e "${GREEN}╰──────────────────────────────────────────────────╯${NC}"
echo ""
echo "You can now use Drapp CLI in two ways:"
echo ""
echo -e "  ${BOLD}Option 1:${NC} Run directly (works now)"
echo -e "    ${CYAN}node $CLI_PATH${NC}"
echo ""
echo -e "  ${BOLD}Option 2:${NC} Use the alias (after restarting terminal)"
echo -e "    ${CYAN}drapp${NC}"
echo ""
echo -e "${BOLD}Quick Start:${NC}"
echo -e "  ${CYAN}drapp archive /path/to/videos /path/to/output${NC}"
echo ""
echo -e "${BOLD}Interactive Mode (browse and select files):${NC}"
echo -e "  ${CYAN}drapp archive --interactive${NC}"
echo ""
echo -e "${BOLD}Get Help:${NC}"
echo -e "  ${CYAN}drapp archive --help${NC}"
echo ""
