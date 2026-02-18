# Silva MD Bot

## Overview
Silva MD Bot is a multi-functional WhatsApp bot built with Node.js and the Baileys library. It provides moderation, automation, media tools, and AI-powered features for WhatsApp groups and individual chats.

## Project Architecture
- **silva.js** - Main entry point. Starts Express server on port 5000, serves modern landing page, and spawns the bot process
- **sylivanus.js** - Core bot logic. Handles WhatsApp connection, message processing, plugin loading, and database management
- **handler.js** - Message handler that processes incoming messages and routes them to plugins
- **config.js** - Bot configuration (owner numbers, API keys, bot settings)
- **lib/makesession.js** - Session loader. Parses `Silva~<compressed_base64>` format, decompresses gzip, writes creds.json
- **silvaxlab/** - Plugin commands directory (257 plugins)
- **lib/** - Utility libraries (scrapers, converters, database adapters, etc.)
- **session/** - WhatsApp session credentials storage
- **jusorts/** - Static assets served by Express (landing page, images)
- **media/** - Media files (audio, images)

## Key Dependencies
- `gifted-baileys@2.0.6` - WhatsApp Web API (uses buffered event system with `conn.ev.process()`)
- `express` - Web server for landing page
- `pino` - Logging
- `chalk` - Terminal colors
- `figlet` - ASCII art banners
- `node-cache` - Caching
- `zlib` (built-in) - Session decompression

## Session Format
- SESSION_ID format: `Silva~<base64_gzip_compressed_creds>`
- The `lib/makesession.js` module handles parsing, decompressing, and saving session credentials
- When no SESSION_ID is set, QR code prints directly in the terminal for scanning

## Environment Variables
- `SESSION_ID` - WhatsApp session ID (format: Silva~base64data, get from session generator)
- `BOTNAME` - Bot display name
- `MODE` - Bot mode (public/private)
- `PREFIX` - Command prefix (default: .)
- `PORT` - Server port (default: 5000)
- `statusview` - Auto-view WhatsApp statuses (true/false)
- `autoRead` - Auto-read incoming messages (true/false)
- `AUTO_STATUS_LIKE` - Auto-like WhatsApp statuses (true/false)
- `AUTO_STATUS_LIKE_EMOJI` - Emoji used for status likes (default: 💚)
- `Status_Saver` - Save statuses to bot owner (true/false)
- `STATUS_REPLY` - Auto-reply to status posters (true/false)
- `STATUS_MSG` - Custom reply message for status viewers

## Running the Bot
The bot runs via `node silva.js` which:
1. Starts Express server on port 5000 with modern landing page
2. Spawns `sylivanus.js` as a child process
3. sylivanus.js loads session from SESSION_ID (Silva~ compressed format) or starts QR mode
4. QR code prints in terminal for WhatsApp pairing (no web QR page)
5. Loads all plugins from silvaxlab/ directory

## Security
- The bot includes a security check that verifies the package.json author name is "SILVA"
- Unauthorized copies will not start

## gifted-baileys Event System
- gifted-baileys uses a **buffered event system** - all events go through `conn.ev.process(handler)`
- The handler receives a map of events: `events['messages.upsert']`, `events['connection.update']`, etc.
- Old `conn.ev.on('event-name', handler)` pattern does NOT work
- Bot-sent message IDs start with `GIFTED-` prefix (used for isBaileys detection)
- lib/store.js also uses `conn.ev.process()` for store event listeners

## Recent Changes
- 2026-02-18: Added lib/newsletter.js - auto-follows WhatsApp newsletters on connection open
- 2026-02-18: Fixed isBaileys detection to recognize GIFTED- prefixed message IDs
- 2026-02-18: Added auto status view and auto-read support in event handler
- 2026-02-18: Removed debug logging from handler.js
- 2026-02-18: Fixed event system - switched from conn.ev.on() to conn.ev.process() for gifted-baileys
- 2026-02-18: Removed all database dependencies (lowdb, MongoDB, CloudDBAdapter) - bot uses in-memory storage only
- 2026-02-18: Switched Baileys library from @fizzxydev/baileys-pro to gifted-baileys@2.0.6
- 2026-02-18: Removed makeInMemoryStore (not available in gifted-baileys)
- 2026-02-18: Updated makesession.js to use Silva~ compressed base64 session format
- 2026-02-18: Modernized landing page (silva.html) with features, commands, stats, setup guide
- 2026-02-18: Renamed plugin directory from lazackcmds to silvaxlab
- 2026-02-18: Updated security check from GURU to SILVA
- 2026-02-18: Cleaned up unnecessary deployment files (Docker, Heroku, Koyeb, etc.)

## User Preferences
- Project uses ES modules (type: "module" in package.json)
- Node.js 20+ required
- QR code should print in terminal, not on web page
- Landing page should show useful bot info (features, commands, stats)
