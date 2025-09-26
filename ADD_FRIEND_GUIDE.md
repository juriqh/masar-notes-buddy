# Add Your Friend to Telegram Bot Notifications

## 👥 **How to Send Messages to Your Friend**

### Step 1: Get Your Friend's Chat ID

#### Method 1: Using @userinfobot (Easiest)
1. **Your friend opens Telegram**
2. **Searches for** `@userinfobot`
3. **Starts a chat** with @userinfobot
4. **Sends any message** (like "Hello")
5. **Copies their user ID** from the bot's response
6. **Shares the ID with you**

#### Method 2: Using Your Bot
1. **Your friend starts a chat** with your bot
2. **Sends any message** to your bot
3. **You check Railway logs** to see their chat ID

### Step 2: Add Friend's Chat ID to Railway

1. **Go to Railway dashboard**
2. **Click on your project**
3. **Go to Variables tab**
4. **Add new variable**:
   ```
   TELEGRAM_FRIEND_CHAT_ID = [your friend's chat ID]
   ```
5. **Save and redeploy**

### Step 3: Test

1. **Redeploy your bot** (Railway will auto-redeploy)
2. **Check Telegram** - both you and your friend should receive:
   - ✅ Startup message
   - ✅ Morning reminders (7:00 AM)
   - ✅ Evening summaries (9:00 PM)

## 🎯 **What Happens Next**

### ✅ **Both You and Your Friend Will Receive:**
- **Morning reminders** with today's class schedule
- **Evening summaries** with tomorrow's classes
- **Website link** for uploading notes
- **All notifications** at the same times

### 📱 **Example Messages:**
```
🌅 Good Morning! Here are your classes for today:

📚 مهارات اللغة الإنجليزية (1) (1001)
⏰ Time: 08:00 AM - 09:50 AM
📍 Location: Building 03, Floor 2, Wing A, Room 415

Have a great day! 🎓

📝 Upload your notes: https://YOUR-VERCEL-URL.vercel.app
```

## 🔧 **Bot Features for Multiple Users**

- ✅ **Sends to both** you and your friend
- ✅ **Same schedule** for both users
- ✅ **Individual messages** (not group chat)
- ✅ **Easy to add more friends** (just add more chat IDs)

## 🚨 **Important Notes**

- **Friend must start a chat** with your bot first
- **Chat ID is unique** for each user
- **Bot can send to multiple users** simultaneously
- **All users get the same messages**

## 📋 **Quick Setup**

1. **Friend gets their chat ID** from @userinfobot
2. **Add `TELEGRAM_FRIEND_CHAT_ID`** to Railway variables
3. **Redeploy** - done!

Your friend will now receive all the same class notifications as you! 🎉


