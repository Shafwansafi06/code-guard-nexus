#!/bin/bash

# CodeGuard Nexus - Quick Setup Script
# This script sets up the complete development environment

set -e  # Exit on error

echo "🚀 CodeGuard Nexus Setup"
echo "========================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running from project root
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Step 1: Backend Setup
echo -e "${YELLOW}[1/5] Setting up Python backend...${NC}"
cd backend

# Check Python version
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
echo "Python version: $PYTHON_VERSION"

# Robust version check
PYTHON_MAJOR=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1)
PYTHON_MINOR=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f2)

if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 9 ]); then
    echo -e "${RED}Error: Python 3.9+ required (found $PYTHON_VERSION)${NC}"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install backend dependencies
echo "Installing backend dependencies..."
pip install -r requirements.txt

echo -e "${GREEN}✓ Backend setup complete${NC}"
echo ""

# Step 2: Frontend Setup
echo -e "${YELLOW}[2/5] Setting up React frontend...${NC}"
cd ..

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
echo "Node.js version: v$NODE_VERSION"

if (( $NODE_VERSION < 18 )); then
    echo -e "${RED}Error: Node.js 18+ required${NC}"
    exit 1
fi

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install

echo -e "${GREEN}✓ Frontend setup complete${NC}"
echo ""

# Step 3: Environment Configuration
echo -e "${YELLOW}[3/5] Configuring environment...${NC}"

# Backend .env
if [ ! -f "backend/.env" ]; then
    echo "Creating backend/.env from template..."
    cat > backend/.env << 'EOF'
# Supabase Configuration
SUPABASE_URL=https://hgbljrqmzynmqfhwnraq.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnYmxqcnFtenptbXFmaHducmFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NDYyMzQsImV4cCI6MjA1MzMyMjIzNH0.p6qETnL8cSC-DyvG0gWCkd_g78UdyS5_X7jEa2QQBaI

# JWT Configuration
SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# API Configuration
API_V1_STR=/api/v1
PROJECT_NAME="CodeGuard Nexus API"
BACKEND_CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]

# Environment
ENVIRONMENT=development
EOF
    echo -e "${GREEN}✓ Created backend/.env${NC}"
else
    echo "backend/.env already exists"
fi

# Frontend .env
if [ ! -f ".env" ]; then
    echo "Creating .env from template..."
    cat > .env << 'EOF'
# Supabase Configuration
VITE_SUPABASE_URL=https://hgbljrqmzynmqfhwnraq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnYmxqcnFtenptbXFmaHducmFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NDYyMzQsImV4cCI6MjA1MzMyMjIzNH0.p6qETnL8cSC-DyvG0gWCkd_g78UdyS5_X7jEa2QQBaI

# API Configuration
VITE_API_URL=http://localhost:8000
EOF
    echo -e "${GREEN}✓ Created .env${NC}"
else
    echo ".env already exists"
fi

echo -e "${GREEN}✓ Environment configured${NC}"
echo ""

# Step 4: ML Setup (Optional)
echo -e "${YELLOW}[4/5] ML dependencies (optional)...${NC}"
read -p "Install ML training dependencies? (y/N): " install_ml

if [[ $install_ml =~ ^[Yy]$ ]]; then
    cd backend
    source venv/bin/activate
    echo "Installing ML dependencies (this may take a while)..."
    pip install -r requirements-ml.txt
    echo -e "${GREEN}✓ ML dependencies installed${NC}"
    cd ..
else
    echo "Skipping ML dependencies (you can install later with: cd backend && pip install -r requirements-ml.txt)"
fi
echo ""

# Step 5: Verify Installation
echo -e "${YELLOW}[5/5] Verifying installation...${NC}"

# Check backend imports
cd backend
source venv/bin/activate
python3 << 'PYEOF'
try:
    import fastapi
    import supabase
    import pydantic
    from jose import jwt
    print("✓ All backend packages imported successfully")
except ImportError as e:
    print(f"✗ Import error: {e}")
    exit(1)
PYEOF

cd ..

# Check frontend packages
node -e "
try {
  require('axios');
  require('@supabase/supabase-js');
  console.log('✓ All frontend packages imported successfully');
} catch (e) {
  console.error('✗ Import error:', e.message);
  process.exit(1);
}
"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Start the backend:"
echo "   cd backend"
echo "   source venv/bin/activate  # On Windows: venv\\Scripts\\activate"
echo "   uvicorn app.main:app --reload"
echo ""
echo "2. In a new terminal, start the frontend:"
echo "   npm run dev"
echo ""
echo "3. Open http://localhost:5173 in your browser"
echo ""
echo "4. (Optional) Train ML model:"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   python -m app.services.train_detector"
echo ""
echo "📚 Documentation:"
echo "   - API Docs: http://localhost:8000/api/v1/docs"
echo "   - README: ./README.md"
echo "   - ML Training Guide: ./backend/ML_TRAINING_GUIDE.md"
echo ""
echo "Need help? Check the documentation or open an issue on GitHub."
echo ""
