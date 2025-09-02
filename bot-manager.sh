#!/bin/bash

case "$1" in
    start)
        echo "Starting Telegram bot..."
        nohup python telegram-bot.py > telegram-bot.log 2>&1 &
        echo "Bot started! Process ID: $!"
        echo "Log file: telegram-bot.log"
        ;;
    stop)
        echo "Stopping Telegram bot..."
        pkill -f telegram-bot.py
        echo "Bot stopped!"
        ;;
    status)
        if pgrep -f telegram-bot.py > /dev/null; then
            echo "✅ Bot is running!"
            echo "Process ID: $(pgrep -f telegram-bot.py)"
        else
            echo "❌ Bot is not running"
        fi
        ;;
    logs)
        echo "Recent bot logs:"
        tail -10 telegram-bot.log
        ;;
    *)
        echo "Usage: $0 {start|stop|status|logs}"
        echo ""
        echo "Commands:"
        echo "  start  - Start the bot in background"
        echo "  stop   - Stop the bot"
        echo "  status - Check if bot is running"
        echo "  logs   - Show recent logs"
        ;;
esac
