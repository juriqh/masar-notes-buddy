# Railway Deployment Guide - 24/7 Telegram Bot

## 🚀 Deploy Your Telegram Bot to Railway (Runs Even When Computer is Off!)

### Why Railway?
- ✅ **24/7 uptime** - Runs even when your computer is off
- ✅ **Free tier available** - Perfect for personal projects
- ✅ **Easy deployment** - Just connect GitHub
- ✅ **Automatic restarts** - If bot crashes, it restarts automatically

### Step 1: Create Railway Account

1. **Go to [railway.app](https://railway.app)**
2. **Sign up** with your GitHub account
3. **Connect your GitHub** repository

### Step 2: Deploy Your Bot

1. **Click "New Project"**
2. **Select "Deploy from GitHub repo"**
3. **Choose your repository**: `masar-notes-buddy`
4. **Railway will automatically detect** it's a Python project

### Step 3: Configure Environment Variables

In Railway dashboard, go to **Variables** and add:

```
TELEGRAM_BOT_TOKEN = 8288199844:AAEiSZubnQOvvPrCy0bTD3WC7w9YY28oPt0
TELEGRAM_CHAT_ID = 1971005453
```

### Step 4: Update Start Command

In Railway dashboard, go to **Settings > Deploy** and set:
- **Start Command**: `python railway-bot.py`

### Step 5: Deploy!

1. **Click "Deploy"**
2. **Wait for deployment** to complete
3. **Check logs** to see if bot started successfully

## 🎯 What Happens Next

### ✅ **Your Bot Will:**
- **Run 24/7** on Railway's servers
- **Send morning reminders** at 7:00 AM (Asia/Riyadh time)
- **Send evening summaries** at 9:00 PM (Asia/Riyadh time)
- **Continue running** even when your computer is off
- **Auto-restart** if it crashes

### 📱 **You'll Receive:**
- **Startup message**: "🤖 Telegram bot is now running on Railway! 24/7 notifications active."
- **Daily notifications** with your class schedule
- **Website link** for uploading notes

## 🔧 Files Ready for Railway

- ✅ `railway-bot.py` - Bot optimized for cloud deployment
- ✅ `railway.json` - Railway configuration
- ✅ `requirements.txt` - Python dependencies

## 💰 **Cost**
- **Free tier**: 500 hours/month (enough for 24/7)
- **Paid plans**: Start at $5/month for unlimited usage

## 🎉 **Benefits**

- ✅ **True 24/7 operation** - No dependency on your computer
- ✅ **Automatic scaling** - Handles traffic spikes
- ✅ **Easy monitoring** - View logs and status
- ✅ **Simple updates** - Just push to GitHub

## 📋 **After Deployment**

1. **Test the bot** - You should receive a startup message
2. **Wait for notifications** - Check at 7:00 AM and 9:00 PM
3. **Monitor logs** - Railway dashboard shows bot activity
4. **Update website URL** - Replace `YOUR-VERCEL-URL` with actual Vercel URL

## 🚨 **Important Notes**

- **Railway free tier** has limits, but should be enough for your bot
- **Bot will restart** automatically if it crashes
- **Logs are available** in Railway dashboard
- **Environment variables** are secure and encrypted

Your Telegram bot will now run **24/7 in the cloud** and send notifications even when your computer is completely shut down! 🎯


