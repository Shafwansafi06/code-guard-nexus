# Deploying to Fly.io - Quick Guide

## Step 1: Install Fly CLI

```bash
# Linux/Mac
curl -L https://fly.io/install.sh | sh

# Add to PATH
export FLYCTL_INSTALL="/home/$(whoami)/.fly"
export PATH="$FLYCTL_INSTALL/bin:$PATH"

# Add to your .bashrc or .zshrc to make permanent
echo 'export FLYCTL_INSTALL="/home/$(whoami)/.fly"' >> ~/.bashrc
echo 'export PATH="$FLYCTL_INSTALL/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

## Step 2: Login

```bash
flyctl auth login
```

## Step 3: Deploy

### Option A: Automated Script (Easiest)

```bash
cd backend
./deploy-fly.sh
```

### Option B: Manual Steps

```bash
cd backend

# 1. Create app (first time only)
flyctl launch --no-deploy

# 2. Set environment variables
flyctl secrets set \
  SUPABASE_URL="your_url" \
  SUPABASE_KEY="your_key" \
  SUPABASE_SERVICE_KEY="your_service_key" \
  SECRET_KEY="$(openssl rand -hex 32)" \
  ALLOWED_ORIGINS="https://your-frontend.vercel.app" \
  ENVIRONMENT="production"

# 3. Deploy
flyctl deploy
```

## Step 4: Verify Deployment

```bash
# Check status
flyctl status

# View logs
flyctl logs

# Test health endpoint
curl https://your-app.fly.dev/health

# Open in browser
flyctl open
```

## Important Notes

### Free Tier Limits
- ✅ 3 shared-cpu VMs (256MB RAM each)
- ✅ 3GB storage
- ✅ 160GB bandwidth
- ✅ Never sleeps!

### ML Model Considerations

With 256MB RAM, you need to optimize:

1. **Use quantized models (optional)**
2. **Lazy load models** - Only load when needed
3. **Consider caching** - Cache results for common comparisons

### Scaling

If you need more RAM:
```bash
# Upgrade to 512MB (paid)
flyctl scale memory 512

# Add more instances
flyctl scale count 2
```

## Useful Commands

```bash
# View app info
flyctl info

# SSH into machine
flyctl ssh console

# View secrets
flyctl secrets list

# Update secrets
flyctl secrets set KEY=value

# Scale
flyctl scale count 2
flyctl scale memory 512

# Restart
flyctl deploy --no-cache
```

## Troubleshooting

### Out of Memory
```bash
# Check logs
flyctl logs

# Scale up memory
flyctl scale memory 512
```

### Slow startup
- Models take time to load
- First request may be slow (cold start)
- Consider lazy loading

### Build fails
```bash
# Clear cache and rebuild
flyctl deploy --no-cache
```

## Cost

- **Free tier:** $0/month (enough for testing/small usage)
- **512MB RAM:** ~$3-5/month
- **1GB RAM:** ~$10-15/month

Always on, no sleep! 🎉
