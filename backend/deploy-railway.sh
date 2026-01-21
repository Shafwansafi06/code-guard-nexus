#!/bin/bash

# Deploy Backend to Railway
# Prerequisites: Railway CLI installed (npm install -g @railway/cli)

set -e

echo "🚀 Deploying CodeGuard Nexus Backend to Railway..."

# Navigate to backend directory
cd "$(dirname "$0")"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Install it with: npm install -g @railway/cli"
    exit 1
fi

# Login check
echo "Checking Railway login status..."
railway whoami || {
    echo "Please login to Railway first:"
    railway login
}

# Deploy
echo "Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo "Check your deployment at: https://railway.app"
