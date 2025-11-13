# Production Deployment Guide

This guide walks you through deploying the multi-tenant newsletter system to production.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Security Configuration](#security-configuration)
5. [Deployment Steps](#deployment-steps)
6. [Post-Deployment](#post-deployment)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Services
- **PostgreSQL Database** (v14+)
  - Recommended: AWS RDS, Neon, Supabase, or similar managed service
  - Minimum specs: 2 CPU, 4GB RAM for production
- **Redis** (v6+)
  - For distributed rate limiting
  - Recommended: AWS ElastiCache, Redis Cloud, or Upstash
- **Node.js** (v18+)
  - LTS version recommended
- **Domain & SSL Certificate**
  - HTTPS required for production
  - Free certificates: Let's Encrypt, Cloudflare

### Optional Services
- **AWS Secrets Manager / HashiCorp Vault**
  - For secure encryption key storage
  - Highly recommended for production
- **CloudWatch / Datadog / New Relic**
  - For monitoring and alerting
- **Sentry / Rollbar**
  - For error tracking

## Environment Setup

### 1. Generate Security Keys

```bash
# Generate ENCRYPTION_KEY (32-byte base64)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Example output: 3Kq9vL2xR8nP1mC5sT7uW9yE4hF6jG0aB3cD8eI2kN=

# Generate TRACKING_SECRET (32-byte hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Example output: 1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d
```

### 2. Configure Environment Variables

Create a `.env.production` file (or configure in your hosting platform):

```bash
# ========================================
# REQUIRED - Application will not start without these
# ========================================

# Database Connection
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Security Keys (CRITICAL - use KMS in production)
ENCRYPTION_KEY=<generated-32-byte-base64>
TRACKING_SECRET=<generated-32-byte-hex>

# Environment
NODE_ENV=production
PORT=5000

# ========================================
# RECOMMENDED
# ========================================

# Redis (for distributed rate limiting)
REDIS_URL=redis://user:password@host:port

# Allowed Origins (CORS)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# API URL (for cross-origin frontend deployments)
# If frontend is on different domain/CDN, set this to the backend API URL
VITE_API_URL=https://api.yourdomain.com

# ========================================
# OPTIONAL - AWS SES (for system emails)
# ========================================
# Note: Users configure their own SES credentials in the UI
# These are only for system-level emails (password reset, etc.)
AWS_ACCESS_KEY_ID=<your-aws-access-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>
AWS_REGION=us-east-1
```

### 3. Secure Key Management (Production)

⚠️ **CRITICAL**: Do NOT store `ENCRYPTION_KEY` in plain environment variables!

**Option A: AWS Secrets Manager**
```bash
# Store encryption key in AWS Secrets Manager
aws secretsmanager create-secret \
  --name newsletter-encryption-key \
  --secret-string "3Kq9vL2xR8nP1mC5sT7uW9yE4hF6jG0aB3cD8eI2kN=" \
  --region us-east-1

# Update server/encryption.ts to fetch from Secrets Manager
```

**Option B: HashiCorp Vault**
```bash
# Store encryption key in Vault
vault kv put secret/newsletter encryption_key="3Kq9vL2xR8nP1mC5sT7uW9yE4hF6jG0aB3cD8eI2kN="

# Update server/encryption.ts to fetch from Vault
```

## Database Setup

### 1. Create Database

```bash
# Using PostgreSQL CLI
createdb newsletter_production

# Or using SQL
psql -c "CREATE DATABASE newsletter_production;"
```

### 2. Enable Required Extensions

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Optional: Enable pg_stat_statements for monitoring
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
```

### 3. Run Database Migrations

```bash
# Install dependencies
npm install

# Push schema to database
npm run db:push
```

**Important**: This creates all required tables:
- users
- sessions
- email_templates
- campaigns
- subscribers
- campaign_subscribers
- campaign_analytics
- email_provider_integrations
- subscription_confirmations
- web_version_views
- link_clicks
- blacklist
- lists
- rules
- user_settings
- settings

### 4. Database Security

```sql
-- Create read-only user for reporting
CREATE USER newsletter_readonly WITH PASSWORD 'strong-password';
GRANT CONNECT ON DATABASE newsletter_production TO newsletter_readonly;
GRANT USAGE ON SCHEMA public TO newsletter_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO newsletter_readonly;

-- Enable SSL (recommended)
-- In postgresql.conf:
ssl = on
ssl_cert_file = '/path/to/server.crt'
ssl_key_file = '/path/to/server.key'
```

## Security Configuration

### 1. Add Security Headers (Helmet)

```bash
npm install helmet
```

Update `server/index.ts`:
```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

### 2. Configure CORS

```bash
npm install cors
```

Update `server/index.ts`:
```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));
```

### 3. Upgrade Rate Limiting to Redis

```bash
npm install redis
```

Update `server/rateLimiter.ts`:
```typescript
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

await redisClient.connect();

// Replace in-memory store with Redis
```

## Deployment Steps

### Option A: Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY . .

# Build frontend
RUN npm run build

# Expose port
EXPOSE 5000

# Start application
CMD ["npm", "start"]
```

```bash
# Build image
docker build -t newsletter-app:latest .

# Run container
docker run -d \
  --name newsletter-app \
  -p 5000:5000 \
  --env-file .env.production \
  newsletter-app:latest
```

### Option B: PM2 Deployment

```bash
# Install PM2
npm install -g pm2

# Create ecosystem.config.js
module.exports = {
  apps: [{
    name: 'newsletter-app',
    script: './server/index.ts',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
    },
    env_file: '.env.production',
  }],
};

# Start application
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Option C: Platform-Specific

**Replit Deployment:**
```bash
# Use Replit's built-in deployment
# Click "Deploy" button in Replit UI
# Configure environment variables in Secrets
```

**Heroku:**
```bash
# Create Heroku app
heroku create newsletter-app

# Add PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# Add Redis
heroku addons:create heroku-redis:premium-0

# Set environment variables
heroku config:set ENCRYPTION_KEY="<your-key>"
heroku config:set TRACKING_SECRET="<your-secret>"
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

**AWS (EC2 + RDS):**
1. Launch EC2 instance (t3.medium or larger)
2. Install Node.js 18+
3. Clone repository
4. Configure security groups (allow port 5000)
5. Use Application Load Balancer for HTTPS
6. Configure RDS PostgreSQL
7. Use ElastiCache for Redis
8. Deploy with PM2 or Docker

## Post-Deployment

### 1. Verify Deployment

```bash
# Health check
curl https://yourdomain.com/api/health

# Expected response: 200 OK

# Test authentication
curl -X POST https://yourdomain.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!","name":"Test User"}'
```

### 2. Create Admin User

```bash
# SSH into server
ssh user@yourserver

# Use psql to create admin user
psql $DATABASE_URL -c "UPDATE users SET role='admin' WHERE email='admin@yourdomain.com';"
```

### 3. Configure DNS

```
# A Record
yourdomain.com.     A     <your-server-ip>

# CNAME (optional)
www.yourdomain.com. CNAME yourdomain.com.
```

### 4. SSL Certificate

**Using Certbot (Let's Encrypt):**
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### 5. Configure Nginx (Reverse Proxy)

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Monitoring & Maintenance

### 1. Application Monitoring

```bash
# Install monitoring tools
npm install prom-client

# Expose metrics endpoint
# /metrics for Prometheus scraping
```

**Key Metrics to Monitor:**
- API response times (p50, p95, p99)
- Error rates by endpoint
- Database query performance
- Email sending success/failure rates
- Rate limit violations
- Active sessions
- Memory usage
- CPU usage

### 2. Log Management

```bash
# Use PM2 logs
pm2 logs newsletter-app

# Or configure external logging
# Datadog, CloudWatch, Loggly, etc.
```

### 3. Database Backups

```bash
# Automated daily backups
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/newsletter_$(date +\%Y\%m\%d).sql.gz

# Test restore monthly
pg_restore -d newsletter_test /backups/newsletter_20241113.sql.gz
```

### 4. Security Audits

```bash
# Weekly dependency audit
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies quarterly
npm update
```

## Troubleshooting

### Common Issues

#### 1. Application Won't Start

**Error: ENCRYPTION_KEY not set**
```bash
# Solution: Set ENCRYPTION_KEY in environment variables
export ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
```

**Error: Database connection failed**
```bash
# Check DATABASE_URL format
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

#### 2. Email Sending Fails

**Error: AWS SES not configured**
```
# Users must configure their own AWS SES credentials in Settings > Email Integration
# Ensure users have:
# 1. Valid AWS credentials
# 2. SES verified email/domain
# 3. SES production access (if sending >200 emails/day)
```

#### 3. Rate Limiting Issues

**Rate limits reset on restart**
```bash
# Solution: Deploy Redis for persistent rate limiting
# See "Upgrade Rate Limiting to Redis" section
```

#### 4. High Memory Usage

```bash
# Check Node.js memory limit
node --max-old-space-size=2048 server/index.ts

# Monitor with PM2
pm2 monit
```

### Debug Mode

```bash
# Enable debug logging
export DEBUG=*

# Run application
npm start
```

## Performance Optimization

### 1. Database Indexing

```sql
-- Check missing indexes
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public';

-- Add indexes if missing
CREATE INDEX CONCURRENTLY idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX CONCURRENTLY idx_subscribers_user_id ON subscribers(user_id);
CREATE INDEX CONCURRENTLY idx_email_templates_user_id ON email_templates(user_id);
```

### 2. Connection Pooling

```typescript
// In server/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 3. Caching

```bash
# Install Redis for caching
npm install redis

# Cache frequently accessed data
# - Email templates
# - User settings
# - Campaign analytics
```

## Rollback Plan

If deployment fails:

1. **Database Rollback**
   ```bash
   pg_restore -d newsletter_production /backups/newsletter_latest.sql.gz
   ```

2. **Application Rollback**
   ```bash
   # Docker
   docker run newsletter-app:previous-version

   # PM2
   pm2 deploy production revert 1

   # Git
   git reset --hard <previous-commit>
   npm install
   npm run build
   pm2 restart newsletter-app
   ```

3. **Verify Rollback**
   ```bash
   curl https://yourdomain.com/api/health
   ```

## Support & Contact

- **Documentation**: See README.md and SECURITY.md
- **Security Issues**: security@yourcompany.com
- **Technical Support**: support@yourcompany.com

## Changelog

- **2024-11-13**: Initial production deployment guide
- Added AES-256-GCM encryption for credentials
- Added HTML sanitization for XSS prevention
- Added environment variable validation
- Added error boundaries
