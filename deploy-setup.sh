# LMS Deployment - Quick Start Script
# Run this after deploying to Vercel

# 1. Install Vercel CLI globally
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Link to your project
vercel link

# 4. Pull environment variables
vercel env pull .env.production

# 5. Run database migrations
npx prisma migrate deploy

# 6. Seed admin user
node prisma/seed.js

echo "Deployment setup complete!"
echo "Your app should be live at your Vercel URL"
echo "Login with: admin@lms.com / admin123"
