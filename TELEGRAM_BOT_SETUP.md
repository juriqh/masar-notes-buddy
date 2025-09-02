# Telegram Bot Setup Guide

## Step 1: Create a Telegram Bot

1. **Open Telegram** and search for `@BotFather`
2. **Start a chat** with BotFather
3. **Send the command**: `/newbot`
4. **Follow the prompts**:
   - Choose a name for your bot (e.g., "Masar Assistant")
   - Choose a username (must end with 'bot', e.g., "masar_assistant_bot")
5. **Copy the bot token** that BotFather gives you

## Step 2: Get Your Chat ID

1. **Start a chat** with your new bot
2. **Send any message** to the bot (e.g., "Hello")
3. **Visit this URL** in your browser (replace YOUR_BOT_TOKEN with your actual token):
   ```
   https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
   ```
4. **Find your chat ID** in the response (look for "chat":{"id":123456789})

## Step 3: Update Your .env File

Add these lines to your `.env` file:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_actual_bot_token_here
TELEGRAM_CHAT_ID=your_actual_chat_id_here
```

## Step 4: Test the Bot

Run the Telegram bot:

```bash
python telegram-bot.py
```

The bot will:
- ✅ Send a test message when it starts
- ✅ Send morning reminders at 7:00 AM
- ✅ Send evening summaries at 9:00 PM
- ✅ Show your daily class schedule

## Features

- **Morning Reminders**: Daily class schedule at 7:00 AM
- **Evening Summary**: Tomorrow's classes at 9:00 PM
- **Simple Setup**: No complex permissions needed
- **Reliable**: Works without Discord's privileged intents

## Troubleshooting

- **Bot not responding**: Check your bot token and chat ID
- **No messages**: Make sure you've started a chat with your bot first
- **Wrong timezone**: The bot uses Asia/Riyadh timezone (adjust in the code if needed)
