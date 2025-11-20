# 🚀 Free Deployment Guide - Netlify + NeonDB

Deploy your LMS application completely **FREE** using Netlify and NeonDB (PostgreSQL).

## ✨ What You Get (All FREE)

**Netlify:**
- ✅ Unlimited personal and commercial projects
- ✅ 100GB bandwidth/month
- ✅ Continuous deployment
- ✅ HTTPS enabled by default
- ✅ Custom domain support

**NeonDB:**
- ✅ Free PostgreSQL database
- ✅ 3GB storage
- ✅ Automatic backups
- ✅ No credit card required

---

## 📋 Step-by-Step Deployment

### Part 1: Setup Netlify Account

1. **Create Account**
   - Go to https://www.netlify.com
   - Click "Sign up" → Sign up with GitHub (recommended)
   - Authorize Netlify

2. **Prepare Your Code (Optional - GitHub Method)**
   ```bash
   # Open PowerShell in your project folder (f:\New App)
   
   # Initialize git (if not already done)
   git init
   
   # Add all files
   git add .
   
   # Commit
   git commit -m "Initial commit - LMS Portal for Netlify"
   
   # Create new GitHub repository at https://github.com/new
   # Name it: lms-portal
   # Then push:
   git remote add origin https://github.com/YOUR_USERNAME/lms-portal.git
   git branch -M main
   git push -u origin main
   ```

---

### Part 2: Create Free Database (NeonDB)

1. **Create NeonDB Account**
   - Go to https://neon.tech
   - Click "Sign up" → Sign up with GitHub
   - No credit card required!

2. **Create Database**
   - After login, click "Create Project"
   - Project name: `lms-database`
   - Region: Choose closest to you (e.g., US East)
   - PostgreSQL version: 16 (latest)
   - Click "Create Project"

3. **Get Connection String**
   - After creation, you'll see a connection string
   - Copy the connection string that looks like:
     ```
     postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
     ```
   - **Save this!** You'll need it in the next step

---

### Part 3: Deploy to Netlify

#### Option A: Deploy from GitHub (Recommended)

1. **Import Project**
   - In Netlify dashboard, click "Add new site" → "Import an existing project"
   - Click "Deploy with GitHub"
   - Authorize and select your `lms-portal` repository
   - Click "Deploy"

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Click "Show advanced" → "New variable" and add:
   
   ```
   NODE_VERSION = 20
   ```

#### Option B: Deploy with Drag & Drop

1. **Prepare Deployment Folder**
   - Open your project folder: `f:\New App`
   - Delete these folders (they'll be regenerated):
     - `.next`
     - `node_modules`
   - ZIP the entire folder

2. **Deploy**
   - In Netlify dashboard, scroll down to "Deploy manually"
   - Drag and drop your ZIP file
   - Wait for deployment (first deployment might take 3-5 minutes)

---

### Part 4: Configure Environment Variables

1. **Add Environment Variables**
   - In your Netlify site, go to "Site configuration" → "Environment variables"
   - Click "Add a variable" and add these one by one:

   ```bash
   # Required variables:
   
   DATABASE_URL
   # Paste your NeonDB connection string here
   
   AUTH_SECRET
   # Use this value: 8ca704852a76beee7ca1b0d7efb10f32b6cdefeae50e8c905c771c32ad24109f5
   
   NEXTAUTH_URL
   # Your Netlify URL (e.g., https://your-site-name.netlify.app)
   ```

2. **Redeploy**
   - Go to "Deploys" tab
   - Click "Trigger deploy" → "Deploy site"
   - Wait for deployment to complete

---

### Part 5: Initialize Database

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login and Link**
   ```bash
   # Login to Netlify
   netlify login
   
   # Navigate to your project
   cd "f:\New App"
   
   # Link to your site
   netlify link
   ```

3. **Pull Environment Variables**
   ```bash
   # Pull the environment variables you set
   netlify env:pull
   ```

4. **Run Database Migrations**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate deploy
   
   # Seed admin user
   node prisma/seed.js
   ```

---

### Part 6: Access Your App! 🎉

Your app is now live at: **https://your-site-name.netlify.app**

**Default Login Credentials:**
- Email: `admin@lms.com`
- Password: `admin123`

> [!IMPORTANT]
> **Change the password immediately after first login!**

---

## 🎨 Customize Your Site

### Change Site Name
1. Go to "Site configuration" → "Site details"
2. Click "Change site name"
3. Enter your preferred name (e.g., `my-company-lms`)
4. Your new URL: `https://my-company-lms.netlify.app`

### Add Custom Domain (Optional)
1. Go to "Domain management" → "Add a domain"
2. Follow the instructions to connect your domain
3. Update `NEXTAUTH_URL` environment variable with your custom domain
4. Redeploy

---

## 🔧 Troubleshooting

### Build Failed
- Check build logs in Netlify dashboard
- Make sure `NODE_VERSION = 20` is set
- Ensure all dependencies are in `package.json`

### Database Connection Error
- Verify `DATABASE_URL` is correct
- Check NeonDB project is active (free tier sleeps after inactivity, wakes on request)
- Ensure connection string includes `?sslmode=require`

### Cannot Login
- Make sure you ran `npx prisma migrate deploy`
- Make sure you ran `node prisma/seed.js`
- Check database has tables (use NeonDB SQL Editor)

### "AUTH_SECRET not found"
- Verify environment variable is set in Netlify
- Make sure you triggered a redeploy after adding variables

---

## 🔄 Making Updates

With GitHub connected:
```bash
# Make your changes
git add .
git commit -m "Your update description"
git push

# Netlify will automatically deploy!
```

Without GitHub:
- Make changes locally
- Build and ZIP the project
- Drag and drop to Netlify

---

## 💰 Cost Breakdown

| Service | Cost |
|---------|------|
| Netlify Hosting | **FREE** |
| NeonDB Database | **FREE** |
| HTTPS Certificate | **FREE** |
| **Total** | **$0/month** ✨ |

---

## 🚀 What's Next?

1. ✅ Change admin password
2. ✅ Create employee/trainer accounts
3. ✅ Start creating courses
4. ✅ Customize branding
5. ✅ Invite your team

**Need help?**
- Netlify Docs: https://docs.netlify.com
- NeonDB Docs: https://neon.tech/docs
- Next.js Docs: https://nextjs.org/docs

---

## 📞 Quick Reference

**Netlify CLI Commands:**
```bash
netlify dev          # Run locally with Netlify functions
netlify deploy       # Deploy to preview
netlify deploy --prod # Deploy to production
netlify open         # Open Netlify dashboard
```

**Database Commands:**
```bash
npx prisma studio    # Open database GUI
npx prisma migrate   # Create/apply migrations
npx prisma db push   # Push schema changes
```

---

**Enjoy your FREE hosted LMS! 🎉**
