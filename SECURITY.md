# Security Implementation Guide

This document outlines the security measures implemented in the multi-tenant newsletter system and requirements for production deployment.

## Implemented Security Features

### 1. Authentication & Authorization
- ✅ **Session-based authentication** with Bearer tokens
- ✅ **Bcrypt password hashing** (10 salt rounds)
- ✅ **Multi-tenant isolation** - All queries filtered by `userId`
- ✅ **Token expiration** - Sessions expire after configured duration
- ✅ **Protected routes** - `requireAuth` middleware on all sensitive endpoints

### 2. Data Encryption
- ✅ **AES-256-GCM encryption** for AWS SES credentials
- ✅ **PBKDF2 key derivation** (100,000 iterations)
- ✅ **Unique IV per encryption** - Prevents replay attacks
- ✅ **Authentication tags** - Ensures data integrity
- ⚠️  **Development key persistence** - Stored in `.encryption-key-dev` (git-ignored)

### 3. XSS Prevention
- ✅ **HTML sanitization** - All email templates sanitized using `sanitize-html`
- ✅ **Allowed tags whitelist** - Only safe HTML tags permitted
- ✅ **Style attribute filtering** - CSS injection prevention
- ✅ **Automatic migration** - Existing templates sanitized on startup

### 4. SQL Injection Protection
- ✅ **Drizzle ORM** - Parameterized queries only
- ✅ **No raw SQL** - All queries through type-safe ORM
- ✅ **Input validation** - Zod schemas validate all inputs

### 5. Rate Limiting
- ✅ **Per-IP rate limiting** - Prevents abuse
- ✅ **Endpoint-specific limits**:
  - Public endpoints: 100 requests / 15 minutes
  - Subscriptions: 5 attempts / hour
  - Unsubscribes: 10 attempts / 5 minutes
- ⚠️  **In-memory store** - Resets on server restart
- 🔴 **PRODUCTION WARNING**: Use Redis for distributed rate limiting

### 6. Input Validation
- ✅ **Zod schemas** - Runtime type validation
- ✅ **Email validation** - RFC-compliant email checking
- ✅ **Subject sanitization** - Max length & character filtering
- ✅ **Protected fields** - userId, createdAt, etc. cannot be modified by users

### 7. Error Handling
- ✅ **Error boundaries** - Prevents blank pages from React errors
- ✅ **Safe error messages** - No sensitive data in error responses
- ✅ **Environment validation** - Required vars checked on startup

## Production Deployment Checklist

### Critical Requirements

#### 1. Environment Variables (REQUIRED)
```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Security Keys
ENCRYPTION_KEY=<generate-with-crypto-randomBytes-32-base64>
TRACKING_SECRET=<generate-with-crypto-randomBytes-32-hex>

# Environment
NODE_ENV=production
```

**Generate secure keys:**
```bash
# Generate ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Generate TRACKING_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 2. Key Management Service (RECOMMENDED)
⚠️  **CRITICAL**: Do NOT store `ENCRYPTION_KEY` in plain environment variables for production!

**Recommended KMS Solutions:**
- **AWS Secrets Manager** - Best for AWS deployments
- **HashiCorp Vault** - Best for multi-cloud
- **Azure Key Vault** - Best for Azure deployments
- **Google Secret Manager** - Best for GCP deployments

**Implementation Example (AWS Secrets Manager):**
```typescript
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

async function getEncryptionKey(): Promise<string> {
  const client = new SecretsManagerClient({ region: "us-east-1" });
  const command = new GetSecretValueCommand({
    SecretId: "newsletter-encryption-key",
  });
  const response = await client.send(command);
  return response.SecretString!;
}
```

#### 3. Rate Limiting Store (REQUIRED for production)
⚠️  **Current**: In-memory store (resets on restart, not distributed)

**Replace with Redis:**
```bash
npm install redis
```

**Update `server/rateLimiter.ts`:**
```typescript
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Use Redis instead of in-memory store
```

#### 4. HTTPS / TLS
- ✅ Enforce HTTPS only
- ✅ Use TLS 1.2 or higher
- ✅ Redirect HTTP → HTTPS
- ✅ Set `Strict-Transport-Security` header

#### 5. CORS Configuration
Add CORS middleware in production:
```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));
```

#### 6. Security Headers
Add Helmet for security headers:
```bash
npm install helmet
```

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

### Database Security

#### 1. Connection Security
- ✅ Use SSL/TLS for database connections
- ✅ Rotate database credentials regularly
- ✅ Use IAM authentication (AWS RDS)
- ✅ Restrict database access by IP

#### 2. Backup & Recovery
- ✅ Enable automated backups
- ✅ Test restore procedures monthly
- ✅ Encrypt backups at rest
- ✅ Store backups in separate region

#### 3. Encryption at Rest
- ✅ Enable database encryption
- ✅ Use managed encryption keys
- ✅ Encrypt backup storage

### Monitoring & Alerts

#### 1. Security Monitoring
- 📊 Monitor failed authentication attempts
- 📊 Alert on rate limit violations
- 📊 Track unusual database queries
- 📊 Monitor encryption key access

#### 2. Performance Monitoring
- 📊 Track API response times
- 📊 Monitor database query performance
- 📊 Alert on high error rates
- 📊 Monitor email delivery rates

## Known Limitations

### Development Environment
1. **Encryption key** - Stored in `.encryption-key-dev` file
2. **Rate limiting** - In-memory store, resets on restart
3. **TRACKING_SECRET** - Auto-generated, changes on restart

### Production Warnings
1. 🔴 **DO NOT** commit `.encryption-key-dev` to version control
2. 🔴 **DO NOT** use environment variables for ENCRYPTION_KEY (use KMS)
3. 🔴 **DO NOT** use in-memory rate limiting (use Redis)
4. 🔴 **DO NOT** expose detailed error messages to clients

## Security Incident Response

### 1. Credential Compromise
If AWS SES credentials are compromised:
1. Immediately rotate AWS credentials in AWS Console
2. Update encrypted credentials in database
3. Invalidate all user sessions
4. Review CloudTrail logs for unauthorized access
5. Notify affected users if data was accessed

### 2. Encryption Key Compromise
If ENCRYPTION_KEY is compromised:
1. Generate new encryption key
2. Re-encrypt all credentials with new key
3. Update production environment
4. Review access logs
5. Conduct security audit

### 3. Database Breach
If database is compromised:
1. Immediately revoke all database access
2. Rotate all credentials
3. Invalidate all user sessions
4. Review query logs for data exfiltration
5. Notify affected users per GDPR requirements

## Compliance

### GDPR Compliance
- ✅ Double opt-in subscription flow
- ✅ Unsubscribe links in all emails
- ✅ Data export capability (planned)
- ✅ Data deletion capability (planned)
- ✅ Consent tracking
- ✅ Data encryption

### Email Authentication (DMARC/SPF/DKIM)
- ✅ Users configure own AWS SES (includes DKIM)
- ✅ SPF record validation (AWS SES)
- ⚠️  DMARC policy monitoring (partial)
- ⚠️  Feedback loop configuration (user responsibility)

## Regular Security Tasks

### Weekly
- [ ] Review failed authentication logs
- [ ] Check rate limit violations
- [ ] Monitor email bounce rates

### Monthly
- [ ] Rotate database credentials
- [ ] Review user access logs
- [ ] Update dependencies (npm audit)
- [ ] Test backup restoration

### Quarterly
- [ ] Security penetration testing
- [ ] Dependency vulnerability scan
- [ ] Review encryption key access
- [ ] Update SSL certificates
- [ ] Security training for team

## Contact

For security issues, please contact: [security@yourcompany.com]

**DO NOT** create public GitHub issues for security vulnerabilities.
