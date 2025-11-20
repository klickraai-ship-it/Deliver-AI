# Coolify Deployment Guide

## Overview
This guide covers deploying the DeliverAI Mail Dashboard to Coolify, a self-hosted Heroku/Netlify alternative.

## Prerequisites
- Coolify instance running
- Git repository with the application code
- PostgreSQL database configured in Coolify
- Domain name (optional but recommended)

## Deployment Steps

### 1. Prepare Your Repository
1. Ensure all files are committed to your Git repository
2. The repository should include:
   - `Dockerfile`
   - `package.json`
   - Source code
   - Environment variables configured

### 2. Create a New Project in Coolify
1. Log into your Coolify dashboard
2. Click "Create Project"
3. Choose "From Git Repository"
4. Enter your repository URL
5. Select the branch (usually `main` or `master`)

### 3. Configure Build Settings
1. In the project settings, go to "Build"
2. Set build command: `npm run build`
3. Set publish directory: `.` (root directory)
4. Set port: `5000`

### 4. Configure Environment Variables
In Coolify project settings, go to "Environment" and add these variables:

#### Required
```
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key-here
ENCRYPTION_KEY=your-32-character-encryption-key
NODE_ENV=production
PORT=5000
```

#### Email Configuration (choose one)
```
# Resend
RESEND_API_KEY=your-resend-api-key

# OR AWS SES
AWS_SES_ACCESS_KEY_ID=your-aws-access-key
AWS_SES_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_SES_REGION=us-east-1
```

#### Payment Providers (optional)
```
# Razorpay
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# PayPal
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
```

#### AI Features (optional)
```
GEMINI_API_KEY=your-gemini-api-key
```

#### Super Admin (for initial setup)
```
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=secure-password
```

### 5. Database Setup
1. In Coolify, create a PostgreSQL database service
2. Note the connection details
3. Update the `DATABASE_URL` environment variable with the correct connection string

### 6. Deploy
1. Click "Deploy" in Coolify
2. Monitor the build logs for any errors
3. Once deployed, the application will be available at your Coolify domain

### 7. Post-Deployment Setup
1. Access the application
2. Create your first super admin account using the credentials from environment variables
3. Configure email settings in the admin panel
4. Set up payment providers if needed

## Troubleshooting

### Build Failures
- Check build logs in Coolify
- Ensure all dependencies are in `package.json`
- Verify environment variables are set correctly

### Runtime Errors
- Check application logs in Coolify
- Verify database connection
- Ensure all required environment variables are configured

### Database Issues
- Confirm `DATABASE_URL` is correct
- Check database permissions
- Run migrations manually if needed: `npm run db:push`

## Security Considerations
- Use strong, unique passwords for database
- Generate secure random strings for `JWT_SECRET` and `ENCRYPTION_KEY`
- Keep API keys secure and rotate regularly
- Use HTTPS (automatically configured by Coolify)

## Performance Optimization
- Enable caching if needed
- Monitor resource usage
- Scale resources based on load

## Updates
- Push changes to your Git repository
- Coolify will automatically redeploy
- For database schema changes, ensure migrations are included

## Support
For Coolify-specific issues, refer to the [Coolify documentation](https://coolify.io/docs).

For application-specific issues, check the main README.md file.
