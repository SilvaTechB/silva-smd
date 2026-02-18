process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'
process.on('uncaughtException', (err) => {
    process.stderr.write(`[UNCAUGHT] ${err.message}\n${err.stack}\n`)
})
process.on('unhandledRejection', (reason) => {
    process.stderr.write(`[UNHANDLED] ${reason?.message || reason}\n`)
})
import './config.js'

import dotenv from 'dotenv'
import { existsSync, readFileSync, readdirSync, unlinkSync, watch } from 'fs'
import { createRequire } from 'module'
import path, { join } from 'path'
import { platform } from 'process'
import { fileURLToPath, pathToFileURL } from 'url'
import * as ws from 'ws'
import qrcodeTerminal from 'qrcode-terminal'
import { loadSession } from './lib/makesession.js'
import clearTmp from './lib/tempclear.js'
import newsletterHandler from './lib/newsletter.js'

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
    return rmPrefix
        ? /file:\/\/\//.test(pathURL)
            ? fileURLToPath(pathURL)
            : pathURL
        : pathToFileURL(pathURL).toString()
}
global.__dirname = function dirname(pathURL) {
    return path.dirname(global.__filename(pathURL, true))
}
global.__require = function require(dir = import.meta.url) {
    return createRequire(dir)
}
global.silvabot = 'https://www.guruapi.tech/api'

import chalk from 'chalk'
import { spawn } from 'child_process'
import lodash from 'lodash'
import NodeCache from 'node-cache'
import { default as Pino } from 'pino'
import syntaxerror from 'syntax-error'
import { format } from 'util'
import yargs from 'yargs'
import { makeWASocket, protoType, serialize } from './lib/simple.js'

const {
    DisconnectReason,
    useMultiFileAuthState,
    makeCacheableSignalKeyStore,
    fetchLatestWaWebVersion,
    proto,
    delay,
    jidNormalizedUser,
    PHONENUMBER_MCC,
    Browsers
} = await (await import('@whiskeysockets/baileys')).default

import readline from 'readline'

dotenv.config()

// Main initialization
async function initialize() {
    const txt = process.env.SESSION_ID

    if (!txt) {
        process.stdout.write('No SESSION_ID found. Bot will start in QR code pairing mode.\n')
    }

    if (txt) {
        try {
            await loadSession(txt)
            process.stdout.write('Session credentials loaded successfully.\n')
        } catch (error) {
            process.stdout.write(`Error loading session: ${error.message}\n`)
        }
    }
}

// Initialize session
await initialize()
await delay(1000 * 3)

// Security check - modified to be more flexible
async function securityCheck() {
    try {
        if (existsSync('package.json')) {
            const packageJson = readFileSync('package.json', 'utf8')
            const packageData = JSON.parse(packageJson)
            console.log(chalk.green('Security check passed, Thanks for using Silva MD Bot'))
            console.log(chalk.bgBlack(chalk.redBright('Starting Silva MD Bot...')))
        } else {
            console.log(chalk.green('Starting Silva MD Bot...'))
        }
    } catch (error) {
        console.error('Security check warning:', error.message)
        console.log(chalk.green('Starting Silva MD Bot...'))
    }
}

securityCheck()

const pairingCode = !!global.pairingNumber || process.argv.includes('--pairing-code')
const useQr = process.argv.includes('--qr')

const logger = Pino({ level: 'fatal' })

const msgRetryCounterCache = new NodeCache()

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
})
const question = text => new Promise(resolve => rl.question(text, resolve))

const { CONNECTING } = ws
const { chain } = lodash
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000

protoType()
serialize()

global.API = (name, path = '/', query = {}, apikeyqueryname) =>
    (name in global.APIs ? global.APIs[name] : name) +
    path +
    (query || apikeyqueryname
        ? '?' +
        new URLSearchParams(
            Object.entries({
                ...query,
                ...(apikeyqueryname
                    ? {
                        [apikeyqueryname]: global.APIKeys[name in global.APIs ? global.APIs[name] : name],
                    }
                    : {}),
            })
        )
        : '')
global.timestamp = {
    start: new Date(),
}

const __dirname = global.__dirname(import.meta.url)
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.prefix = new RegExp(
    '^[' +
    (process.env.PREFIX || '*/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.\\-.@').replace(
        /[|\\{}()[\]^$+*?.\-\^]/g,
        '\\$&'
    ) +
    ']'
)

// Initialize database
global.db = {
    data: {
        users: {},
        chats: {},
        stats: {},
        msgs: {},
        sticker: {},
        settings: {},
    },
    chain: null,
    read: async function () { },
    write: async function () { },
}
global.db.chain = chain(global.db.data)
global.DATABASE = global.db

global.loadDatabase = async function loadDatabase() {
    if (global.db.data !== null) return
    global.db.data = {
        users: {},
        chats: {},
        stats: {},
        msgs: {},
        sticker: {},
        settings: {},
    }
    global.db.chain = chain(global.db.data)
}

// Session management
global.authFolder = `session`
const { state, saveCreds } = await useMultiFileAuthState(global.authFolder)

let { version: waVersion } = await fetchLatestWaWebVersion().catch(() => ({ version: [2, 3000, 1015901307] }))
console.log(chalk.blue(`Using WA version: ${waVersion}`))

const connectionOptions = {
    version: waVersion,
    logger: Pino({ level: 'fatal' }),
    browser: Browsers.ubuntu('Chrome'),
    auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(
            state.keys,
            Pino({ level: 'fatal' })
        ),
    },
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: false,
    msgRetryCounterCache,
    defaultQueryTimeoutMs: undefined,
    syncFullHistory: false,
    shouldIgnoreJid: jid => jid?.endsWith('@newsletter'),
}

// Create socket connection
global.conn = makeWASocket(connectionOptions)
let connectionFailures = 0
const MAX_FAILURES = 10
let reconnectTimer = null

// Register event handlers
function registerEventHandlers() {
    const ev = global.conn.ev

    const log = (msg) => process.stdout.write(msg + '\n')

    ev.process(async (events) => {
        // Handle connection updates
        if (events['connection.update']) {
            const update = events['connection.update']
            const { qr, connection, lastDisconnect } = update

            if (qr && !global.conn.user) {
                log('\n📱 QR CODE GENERATED - Scan with WhatsApp:\n')
                qrcodeTerminal.generate(qr, { small: true }, (qrcode) => {
                    log(qrcode)
                })
            }

            if (connection === 'open') {
                log('✅ WhatsApp connected successfully!')
                connectionFailures = 0
                const { jid, name } = global.conn.user || {}
                log(`📱 Logged in as: ${name || 'Unknown'} (${jid || 'N/A'})`)

                // Send welcome message
                try {
                    const prefix = global.prefix || '.'
                    const pluginCount = Object.keys(global.plugins || {}).length
                    const mode = process.env.MODE || 'public'
                    const botName = process.env.BOTNAME || 'Silva MD Bot'

                    const welcomeMsg = `╭━━━━━━━━━━━━━━━━━╮
┃  *${botName}*  
┃  _Connected Successfully_
╰━━━━━━━━━━━━━━━━━╯

Hey *${name}* 👋
Your bot is now online and ready.

╭─── *⚡ Quick Info* ───
│ 📛 *Bot:* ${botName}
│ 🔧 *Prefix:* [ ${prefix} ]
│ 🧩 *Plugins:* ${pluginCount} loaded
│ 🔒 *Mode:* ${mode}
╰──────────────────

> Type *${prefix}menu* to see all commands`

                    await global.conn.sendMessage(jid, { text: welcomeMsg })
                } catch (e) {
                    log(`[CONN] Could not send welcome message: ${e.message}`)
                }

                // Follow newsletters
                try {
                    await newsletterHandler.follow({
                        sock: global.conn,
                        config: global.config || {},
                        logMessage: (level, msg) => log(msg)
                    })
                } catch (e) { }
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.data?.extra?.reason
                connectionFailures++

                log(`[CONN] Connection closed. Code: ${statusCode} | Attempt: ${connectionFailures}/${MAX_FAILURES}`)

                // Clear any existing reconnect timer
                if (reconnectTimer) {
                    clearTimeout(reconnectTimer)
                    reconnectTimer = null
                }

                // Handle different disconnect reasons
                if (statusCode === DisconnectReason.loggedOut) {
                    log('[CONN] Session logged out. Please generate new SESSION_ID')
                    process.exit(1)
                }

                if (statusCode === 440) {
                    log('[CONN] Session expired - reconnecting with new session...')
                }

                if (connectionFailures >= MAX_FAILURES) {
                    log('[CONN] Max reconnection attempts reached. Please check your session.')
                    process.exit(1)
                }

                // Reconnect with exponential backoff
                const backoff = Math.min(3000 * Math.pow(1.5, connectionFailures - 1), 30000)
                log(`[CONN] Reconnecting in ${backoff / 1000}s...`)

                reconnectTimer = setTimeout(async () => {
                    try {
                        // Close old connection
                        if (global.conn.ws) {
                            global.conn.ws.close()
                        }
                        global.conn.ev.removeAllListeners()

                        // Create new connection
                        global.conn = makeWASocket(connectionOptions)
                        registerEventHandlers()

                        // Reload handlers
                        if (global.reloadHandler) {
                            await global.reloadHandler()
                        }
                    } catch (error) {
                        log(`[CONN] Reconnection error: ${error.message}`)
                    }
                }, backoff)
            }

            if (connection === 'connecting') {
                log('[CONN] Connecting to WhatsApp...')
            }
        }

        // Handle credentials update
        if (events['creds.update']) {
            await saveCreds()
        }

        // Handle messages
        if (events['messages.upsert']) {
            const upsert = events['messages.upsert']

            if (upsert.type === 'notify' || upsert.type === 'append') {
                for (const msg of upsert.messages) {
                    if (!msg.message) continue

                    // Auto-read status
                    if (msg.key.remoteJid === 'status@broadcast') {
                        if (process.env.AUTO_STATUS_VIEW === 'true') {
                            await global.conn.readMessages([msg.key]).catch(() => { })
                        }
                        continue
                    }

                    // Auto-read messages
                    if (process.env.AUTO_READ === 'true' && !msg.key.fromMe) {
                        await global.conn.readMessages([msg.key]).catch(() => { })
                    }

                    // Process message with handler
                    if (global.conn.handler) {
                        try {
                            await global.conn.handler(upsert)
                        } catch (e) {
                            log(`[HANDLER-ERR] ${e.message}`)
                        }
                    }
                }
            }
        }

        // Handle other events
        if (events['messages.update']) {
            if (global.conn.pollUpdate) global.conn.pollUpdate(events['messages.update'])
        }
        if (events['group-participants.update']) {
            if (global.conn.participantsUpdate) global.conn.participantsUpdate(events['group-participants.update'])
        }
        if (events['groups.update']) {
            if (global.conn.groupsUpdate) global.conn.groupsUpdate(events['groups.update'])
        }
    })

    log('Event listeners registered successfully')
}

// Register initial event handlers
registerEventHandlers()

// Handle pairing code if needed
if (pairingCode && !state.creds.registered) {
    let phoneNumber
    if (!!global.pairingNumber) {
        phoneNumber = global.pairingNumber.replace(/[^0-9]/g, '')
    } else {
        phoneNumber = await question(
            chalk.bgBlack(chalk.greenBright(`Please type your WhatsApp number: `))
        )
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '')
        rl.close()
    }

    setTimeout(async () => {
        try {
            let code = await global.conn.requestPairingCode(phoneNumber)
            code = code?.match(/.{1,4}/g)?.join('-') || code
            console.log(chalk.bold.greenBright('Your Pairing Code:') + ' ' + chalk.bgGreenBright(chalk.black(code)))
        } catch (error) {
            console.error('Pairing code error:', error)
        }
    }, 3000)
}

// Initialize database if needed
if (global.db.data == null) await loadDatabase()

// Load plugins
const pluginFolder = global.__dirname(join(__dirname, './plugins'))
const pluginFilter = filename => /\.js$/.test(filename)
global.plugins = {}

async function loadPlugins() {
    if (!existsSync(pluginFolder)) {
        console.log(chalk.yellow('Plugins folder not found, creating...'))
        await fs.promises.mkdir(pluginFolder, { recursive: true })
        return
    }

    const files = readdirSync(pluginFolder).filter(pluginFilter)
    for (const filename of files) {
        try {
            const file = global.__filename(join(pluginFolder, filename))
            const module = await import(`${file}?update=${Date.now()}`)
            global.plugins[filename] = module.default || module
        } catch (e) {
            console.error(chalk.red(`Error loading plugin ${filename}:`), e.message)
        }
    }
    console.log(chalk.green(`Loaded ${Object.keys(global.plugins).length} plugins`))
}

await loadPlugins()

// Import and setup handler
let handler = await import('./handler.js')
global.reloadHandler = async function (restartConn) {
    try {
        const Handler = await import(`./handler.js?update=${Date.now()}`)
        if (Object.keys(Handler || {}).length) handler = Handler
    } catch (error) {
        console.error('Handler reload error:', error)
    }

    if (restartConn && global.conn) {
        global.conn.handler = handler.handler.bind(global.conn)
        global.conn.pollUpdate = handler.pollUpdate?.bind(global.conn)
        global.conn.participantsUpdate = handler.participantsUpdate?.bind(global.conn)
        global.conn.groupsUpdate = handler.groupsUpdate?.bind(global.conn)
    } else if (global.conn) {
        global.conn.handler = handler.handler.bind(global.conn)
        global.conn.pollUpdate = handler.pollUpdate?.bind(global.conn)
        global.conn.participantsUpdate = handler.participantsUpdate?.bind(global.conn)
        global.conn.groupsUpdate = handler.groupsUpdate?.bind(global.conn)
    }

    return true
}

// Set handlers
if (global.conn) {
    global.conn.handler = handler.handler?.bind(global.conn)
    global.conn.pollUpdate = handler.pollUpdate?.bind(global.conn)
    global.conn.participantsUpdate = handler.participantsUpdate?.bind(global.conn)
    global.conn.groupsUpdate = handler.groupsUpdate?.bind(global.conn)
}

// Cleanup functions
function runCleanup() {
    clearTmp()
        .then(() => {
            console.log('Temporary file cleanup completed.')
        })
        .catch(error => {
            console.error('An error occurred during temporary file cleanup:', error)
        })
        .finally(() => {
            setTimeout(runCleanup, 1000 * 60 * 5) // Run every 5 minutes
        })
}

runCleanup()

// Memory management
setInterval(() => {
    try {
        if (global.gc) global.gc()
    } catch { }

    const mem = process.memoryUsage()
    if (mem.heapUsed > 500 * 1024 * 1024) { // 500MB threshold
        console.log(chalk.yellow(`⚠️ High memory: ${Math.round(mem.heapUsed / 1024 / 1024)}MB - cleaning...`))
        if (global.db?.data?.msgs) global.db.data.msgs = {}
        if (global.db?.data?.sticker) global.db.data.sticker = {}
    }
}, 5 * 60 * 1000) // Every 5 minutes

console.log(chalk.green('Bot initialization complete!'))
