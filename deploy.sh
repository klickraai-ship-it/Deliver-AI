#!/bin/bash

# Deploy script for Coolify

echo "🚀 Starting deployment to Coolify..."

# Build the application
echo "📦 Building application..."
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build completed successfully"

# Run database migrations (if needed)
echo "🗄️ Running database migrations..."
npm run db:push

if [ $? -ne 0 ]; then
    echo "❌ Database migration failed!"
    exit 1
fi

echo "✅ Database migrations completed"

echo "🎉 Deployment preparation complete!"
echo "📋 Next steps:"
echo "1. Push this code to your Git repository"
echo "2. Connect your Coolify project to the repository"
echo "3. Configure environment variables in Coolify"
echo "4. Deploy!"
