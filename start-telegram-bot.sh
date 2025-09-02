#!/bin/bash

# Start Telegram bot in background
cd /Users/juriqh/masar-notes-buddy
nohup python telegram-bot.py > telegram-bot.log 2>&1 &

echo "Telegram bot started in background!"
echo "Process ID: $!"
echo "Log file: telegram-bot.log"
echo ""
echo "To stop the bot, run: pkill -f telegram-bot.py"
echo "To check if it's running: ps aux | grep telegram-bot"
echo "To view logs: tail -f telegram-bot.log"
