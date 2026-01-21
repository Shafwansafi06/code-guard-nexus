#!/bin/bash

# Fly.io Deployment Script for CodeGuard Nexus

set -e

echo "🚀 Deploying CodeGuard Nexus Backend to Fly.io..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo -e "${RED}❌ Fly CLI not found${NC}"
    echo "Install with: curl -L https://fly.io/install.sh | sh"
    echo "Or on Linux: curl -L https://fly.io/install.sh | sh"
    echo "Then add to PATH: export FLYCTL_INSTALL=\"/home/$(whoami)/.fly\""
    exit 1
fi

echo -e "${GREEN}✅ Fly CLI found${NC}"

# Check if logged in
echo -e "\n${YELLOW}Checking Fly.io login status...${NC}"
if ! flyctl auth whoami &> /dev/null; then
    echo "Please login to Fly.io:"
    flyctl auth login
fi

echo -e "${GREEN}✅ Logged in to Fly.io${NC}"

# Navigate to backend directory
cd "$(dirname "$0")"

# Check if app exists
echo -e "\n${YELLOW}Checking if app exists...${NC}"
if ! flyctl status &> /dev/null; then
    echo -e "${YELLOW}App doesn't exist. Creating new app...${NC}"
    flyctl launch --no-deploy
    
    echo -e "\n${YELLOW}Setting secrets (environment variables)...${NC}"
    echo "Please enter your environment variables:"
    
    read -p "SUPABASE_URL: " SUPABASE_URL
    read -p "SUPABASE_KEY: " SUPABASE_KEY
    read -p "SUPABASE_SERVICE_KEY: " SUPABASE_SERVICE_KEY
    read -p "SECRET_KEY (or press Enter to generate): " SECRET_KEY
    
    if [ -z "$SECRET_KEY" ]; then
        SECRET_KEY=$(openssl rand -hex 32)
        echo "Generated SECRET_KEY: $SECRET_KEY"
    fi
    
    read -p "ALLOWED_ORIGINS (e.g., https://yourapp.vercel.app): " ALLOWED_ORIGINS
    
    flyctl secrets set \
        SUPABASE_URL="$SUPABASE_URL" \
        SUPABASE_KEY="$SUPABASE_KEY" \
        SUPABASE_SERVICE_KEY="$SUPABASE_SERVICE_KEY" \
        SECRET_KEY="$SECRET_KEY" \
        ALLOWED_ORIGINS="$ALLOWED_ORIGINS" \
        ENVIRONMENT="production"
fi

# Deploy
echo -e "\n${YELLOW}Deploying to Fly.io...${NC}"
flyctl deploy

# Get app info
echo -e "\n${GREEN}✅ Deployment complete!${NC}"
echo -e "\n${GREEN}=========================================${NC}"
echo -e "${GREEN}🎉 Your app is deployed!${NC}"
echo -e "${GREEN}=========================================${NC}"
flyctl status
echo ""
echo "View your app: https://$(flyctl info --name | grep Hostname | awk '{print $2}')"
echo "View logs: flyctl logs"
echo "Check health: curl https://$(flyctl info --name | grep Hostname | awk '{print $2}')/health"
echo -e "${GREEN}=========================================${NC}"
