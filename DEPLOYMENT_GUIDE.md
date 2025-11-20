# 🚀 LMS Deployment Guide - Step by Step

## What You'll Need
1. A free Vercel account (sign up at https://vercel.com)
2. (Optional) A GitHub account for easy updates

---

## 📋 Quick Deployment Steps

### **Option 1: Deploy via Vercel Website (Easiest)** ⭐

#### Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Click "Sign Up" 
3. Sign up with GitHub (recommended) or email

#### Step 2: Upload Your Project
1. Download your entire project folder (`f:\New App`)
2. ZIP the folder
3. In Vercel dashboard, click "Add New Project"
4. Click "Import" and upload your ZIP file

#### Step 3: Configure Environment Variables
In Vercel project settings, add these variables:

```
AUTH_SECRET=8ca704852a76beee7ca1b0d7efb10f32b6cdefeae50e8c905c771c32ad24109f5
```

(DATABASE_URL will be auto-added in next step)

#### Step 4: Add Database
1. In your Vercel project, go to "Storage" tab
2. Click "Create Database"
3. Select "Postgres"
4. Click "Create"
5. DATABASE_URL is automatically added to your environment variables

#### Step 5: Initialize Database
1. In Vercel project settings, go to "Settings" → "Environment Variables"
2. Add one more variable:
   ```
   NEXTAUTH_URL=https://YOUR-PROJECT-NAME.vercel.app
   ```
   (Replace YOUR-PROJECT-NAME with your actual Vercel URL)

3. Go to "Deployments" tab
4. Click "..." on latest deployment → "Redeploy"

5. Once deployed, open terminal locally and run:
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Login to Vercel
   vercel login
   
   # Link to your project
   vercel link
   
   # Pull environment variables
   vercel env pull
   
   # Run migrations
   npx prisma migrate deploy
   
   # Seed admin user
   node prisma/seed.js
   ```

#### Step 6: Access Your App! 🎉
Your app will be live at: `https://YOUR-PROJECT-NAME.vercel.app`

**Default Login:**
- Email: `admin@lms.com`
- Password: `admin123`

---

### **Option 2: Deploy via GitHub (For Easy Updates)** 

#### Step 1: Create GitHub Repository
1. Go to https://github.com
2. Click "New Repository"
3. Name it `lms-portal`
4. Make it private
5. Click "Create Repository"

#### Step 2: Push Your Code
Open terminal in your project folder and run:

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - LMS Portal"

# Add remote (replace USERNAME with your GitHub username)
git remote add origin https://github.com/USERNAME/lms-portal.git

# Push
git push -u origin main
```

#### Step 3: Connect to Vercel
1. In Vercel dashboard, click "Add New Project"
2. Click "Import Git Repository"
3. Select your `lms-portal` repository
4. Click "Import"

#### Step 4: Follow Steps 3-6 from Option 1 above

---

## 🔒 Security Recommendations

### For Production Use
1. **Change Default Password:**
   - Create a new admin user with a strong password
   - Delete or change the default admin

2. **Increase Password Security:**
   - In `prisma/seed.js`, change `bcrypt.hash('admin123', 4)` to `bcrypt.hash('admin123', 12)`
   - In `src/app/admin/users/actions.ts`, change rounds from 4 to 12

3. **Custom Domain (Optional):**
   - In Vercel project settings → Domains
   - Add your custom domain

---

## 📝 Important Files Reference

- **Environment Template:** [ENV_PRODUCTION_TEMPLATE.txt](file:///f:/New%20App/ENV_PRODUCTION_TEMPLATE.txt)
- **Vercel Config:** [vercel.json](file:///f:/New%20App/vercel.json)
- **Database Schema:** [schema.prisma](file:///f:/New%20App/prisma/schema.prisma)

---

## ❓ Troubleshooting

### "Database connection failed"
- Make sure you created Vercel Postgres storage
- Check DATABASE_URL is set in environment variables
- Redeploy after adding database

### "AUTH_SECRET not found"
- Add AUTH_SECRET in Vercel environment variables
- Use the one provided: `8ca704852a76beee7ca1b0d7efb10f32b6cdefeae50e8c905c771c32ad24109f5`

### "Cannot login"
- Make sure you ran `npx prisma migrate deploy`
- Make sure you ran `node prisma/seed.js`
- Check database has the admin user

---

## 🎯 What's Next?

After deployment:
1. Change admin password
2. Create employee/trainer accounts
3. Start creating courses
4. Customize branding (logos, colors)
5. Add your organization's courses

**Need help?** Check Vercel docs: https://vercel.com/docs
