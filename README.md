# TripKeeper 🚗

Voice-driven Telegram bot for ride-hailing drivers: trip logging, fuel tracking, maintenance reminders, and real profit/loss analytics.

## Why
Ride-hailing drivers rarely know their true earnings. Gross revenue hides fuel, dead kilometres, and running costs. TripKeeper turns voice notes into a full accounting system — speak, and it does the math.

## Features (in progress)
- 🎤 Voice trip logging ("trip ended, 43 pounds card")
- 📸 Odometer photo tracking
- 💰 Per-trip profit/loss (Uber cut, fuel, cost/km)
- 📊 Daily shift reports
- 🔧 Maintenance ledger + reminders
- 🌍 Trilingual: English / العربية / Русский

## Tech
Node.js, Telegraf, SQLite (better-sqlite3)

## Setup
```bash
pnpm install
echo "BOT_TOKEN=your_token" > .env
pnpm start
```

## License
MIT
