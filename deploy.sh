#!/bin/bash

# Complete Production Deployment Script for CodeGuard Nexus
# This script deploys Backend to Railway and Frontend to Vercel

set -e

echo "🚀 CodeGuard Nexus - Production Deployment"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

# Check Railway CLI
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found${NC}"
    echo "Install with: npm install -g @railway/cli"
    exit 1
fi

# Check Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found${NC}"
    echo "Install with: npm install -g vercel"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"

# Deploy Backend
echo -e "\n${YELLOW}Step 1: Deploying Backend to Railway...${NC}"
cd backend

echo "Logging into Railway..."
railway whoami || railway login

echo "Initializing Railway project..."
railway init || true

echo "Deploying backend..."
railway up

echo -e "${GREEN}✅ Backend deployed successfully!${NC}"

# Get backend URL
BACKEND_URL=$(railway domain)
echo -e "Backend URL: ${GREEN}${BACKEND_URL}${NC}"

cd ..

# Deploy Frontend
echo -e "\n${YELLOW}Step 2: Deploying Frontend to Vercel...${NC}"

echo "Building frontend with production backend URL..."
export VITE_API_URL="https://${BACKEND_URL}/api/v1"

echo "Deploying to Vercel..."
vercel --prod

echo -e "${GREEN}✅ Frontend deployed successfully!${NC}"

# Summary
echo -e "\n${GREEN}==========================================="
echo "🎉 Deployment Complete!"
echo "==========================================="
echo -e "Backend: ${GREEN}https://${BACKEND_URL}${NC}"
echo -e "Frontend: Check Vercel output above"
echo ""
echo "Next steps:"
echo "1. Set environment variables in Railway dashboard"
echo "2. Set environment variables in Vercel dashboard"
echo "3. Update Google OAuth redirect URIs"
echo "4. Test the deployment"
echo -e "===========================================${NC}"
