# Vercel Deployment Guide for Masar Notes Buddy

## 🚀 Deploy Your Website to Vercel

### Step 1: Create New Project on Vercel

1. **Go to [vercel.com](https://vercel.com)** and sign in
2. **Click "New Project"**
3. **Import your GitHub repository** (if not already connected)
4. **Select your repository**: `masar-notes-buddy`

### Step 2: Configure Environment Variables

In the Vercel dashboard, go to **Settings > Environment Variables** and add:

```
VITE_SUPABASE_URL = https://gukbteeyusfddcctogxw.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1a2J0ZWV5dXNmZGRjY3RvZ3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODY4ODIsImV4cCI6MjA3MjE2Mjg4Mn0.DQ2kWaOYEsVxR8OcZ5FdP8PvyxVjyBWpETBp9B8h9Go
VITE_SUPABASE_PROJECT_ID = gukbteeyusfddcctogxw
```

### Step 3: Deploy

1. **Click "Deploy"**
2. **Wait for deployment** to complete
3. **Copy your deployment URL** (e.g., `https://masar-notes-buddy-xyz.vercel.app`)

### Step 4: Update Telegram Bot

Once deployed, update your Telegram bot with the new URL:

1. **Update the bot code** to use your new Vercel URL
2. **Replace** `https://masar-notes-buddy.vercel.app` with your actual URL
3. **Redeploy the bot** (if needed)

## 📱 What Your Bot Will Send

After deployment, your bot messages will include:

```
📝 Upload your notes: https://your-actual-url.vercel.app
```

## 🔧 Files Ready for Deployment

- ✅ `vercel.json` - Vercel configuration
- ✅ `package.json` - Dependencies
- ✅ `vite.config.ts` - Build configuration
- ✅ All React components in `src/`

## 🎯 Benefits

- ✅ **24/7 availability** - Website always online
- ✅ **Fast loading** - Vercel's global CDN
- ✅ **Automatic HTTPS** - Secure connection
- ✅ **Easy updates** - Just push to GitHub

## 📋 Next Steps

1. Deploy to Vercel
2. Get your deployment URL
3. Update bot with new URL
4. Test the complete flow!

Your website will be live and your Telegram bot will have the correct link to share! 🚀
