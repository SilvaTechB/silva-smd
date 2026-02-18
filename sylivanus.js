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
import { default as Pino, default as pino } from 'pino'
import syntaxerror from 'syntax-error'
import { format } from 'util'
import yargs from 'yargs'
import { makeWASocket, protoType, serialize } from './lib/simple.js'

const {
  DisconnectReason,
  useMultiFileAuthState,
  MessageRetryMap,
  fetchLatestWaWebVersion,
  makeCacheableSignalKeyStore,
  proto,
  delay,
  jidNormalizedUser,
  PHONENUMBER_MCC,
} = await (
  await import('@whiskeysockets/baileys')
).default

import readline from 'readline'

dotenv.config()

async function main() {
  const txt = process.env.SESSION_ID

  if (!txt) {
    process.stdout.write('No SESSION_ID found. Bot will start in QR code pairing mode.\n')
    process.stdout.write('QR code will be printed in the terminal. Scan it with WhatsApp.\n')
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

main()

await delay(1000 * 5)

async function securityCheck() {
  try {
    const packageJson = readFileSync('package.json', 'utf8')
    const packageData = JSON.parse(packageJson)
    const authorName = packageData.author && packageData.author.name

    if (!authorName) {
      console.log('Author name not found in package.json')
      process.exit(1)
    }

    if (authorName.trim().toLowerCase() !== 'silva') {
      console.log('Unauthorized copy detected. Please use the original Silva MD Bot from https://github.com/SilvaTechB/silva-md-bot')
      process.exit(1)
    } else {
      console.log(chalk.green('Security check passed, Thanks for using Silva MD Bot'))
      console.log(chalk.bgBlack(chalk.redBright('Starting Silva MD Bot...')))
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

securityCheck()

const pairingCode = !!global.pairingNumber || process.argv.includes('--pairing-code')
const useQr = process.argv.includes('--qr')
const useStore = true

const MAIN_LOGGER = pino({ timestamp: () => `,"time":"${new Date().toJSON()}"` })

const logger = MAIN_LOGGER.child({})
logger.level = 'fatal'

const store = undefined

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
  read: async function () {},
  write: async function () {},
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
global.authFolder = `session`
const { state, saveCreds } = await useMultiFileAuthState(global.authFolder)

let { version: waVersion } = await fetchLatestWaWebVersion().catch(() => ({ version: [2, 3000, 1015901307] }))
console.log(chalk.blue(`Using WA version: ${waVersion}`))

const msgRetryCounterMap = {}

const connectionOptions = {
  version: waVersion,
  logger: Pino({
    level: 'silent',
  }),
  browser: ['Ubuntu', 'Chrome', '22.04.4'],
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(
      state.keys,
      Pino().child({
        level: 'fatal',
        stream: 'store',
      })
    ),
  },
  markOnlineOnConnect: true,
  generateHighQualityLinkPreview: false,
  getMessage: async key => {
    let jid = jidNormalizedUser(key.remoteJid)
    let msg = await store?.loadMessage?.(jid, key.id)
    return msg?.message || { conversation: '' }
  },
  msgRetryCounterCache,
  msgRetryCounterMap,
  retryRequestDelayMs: 250,
  maxMsgRetryCount: 10,
  patchMessageBeforeSending: message => {
    const requiresPatch = !!(
      message.buttonsMessage ||
      message.templateMessage ||
      message.listMessage
    )
    if (requiresPatch) {
      message = {
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadataVersion: 2,
              deviceListMetadata: {},
            },
            ...message,
          },
        },
      }
    }

    return message
  },
  defaultQueryTimeoutMs: undefined,
  syncFullHistory: false,
}

global.conn = makeWASocket(connectionOptions)
conn.isInit = false
store?.bind(conn.ev)

let connectionFailures = 0
const MAX_FAILURES = 5

function registerEventHandlers() {
  const ev = global.conn.ev

  const log = (msg) => process.stdout.write(msg + '\n')

  ev.process(async (events) => {
    if (events['connection.update']) {
      const update = events['connection.update']
      const { qr, connection, lastDisconnect } = update

      if (qr) {
        log('\n📱 QR CODE GENERATED - Scan with WhatsApp:\n')
        qrcodeTerminal.generate(qr, { small: true }, (qrcode) => {
          log(qrcode)
        })
        try { process.send({ type: 'qr', qr }) } catch (e) {}
      }
      if (connection === 'open') {
        log('✅ WhatsApp connected successfully!')
        connectionFailures = 0
        try { process.send({ type: 'connected' }) } catch (e) {}
        const { jid, name } = global.conn.user || {}
        log(`📱 Logged in as: ${name || 'Unknown'} (${jid || 'N/A'})`)
        const prefix = global.prefix || '.'
        const pluginCount = Object.keys(global.plugins || {}).length
        const mode = process.env.MODE || 'public'
        const botName = process.env.BOTNAME || 'Silva MD Bot'
        const uptime = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
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
│ 🕐 *Started:* ${uptime}
╰──────────────────

╭─── *🏢 About* ───
│ 👨‍💻 *Dev:* Sylivanus Momanyi
│ 🏛️ *Org:* Silva Tech Inc.
│ 📅 *Since:* Sep 2024
╰──────────────────

📢 *Stay Updated:*
https://whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v

> Type *${prefix}menu* to see all commands`
        try {
          await global.conn.sendMessage(jid, { text: welcomeMsg, mentions: [jid] }, { quoted: null })
        } catch (e) {
          log(`[CONN] Could not send welcome message: ${e.message}`)
        }
        try {
          newsletterHandler.follow({
            sock: global.conn,
            config: global.config || {},
            logMessage: (level, msg) => log(msg)
          }).catch(() => {})
        } catch (e) {}
      }
      if (connection === 'close') {
        const code = lastDisconnect?.error?.output?.statusCode
        connectionFailures++
        log(`[CONN] Connection closed. Code: ${code} | Attempt: ${connectionFailures}/${MAX_FAILURES}`)

        if (connectionFailures >= MAX_FAILURES) {
          log('\n╔══════════════════════════════════════════╗')
          log('║  SESSION_ID EXPIRED OR INVALID           ║')
          log('║  Please generate a new SESSION_ID and    ║')
          log('║  update the secret, then restart.        ║')
          log('╚══════════════════════════════════════════╝\n')
          return
        }

        if (code === DisconnectReason.loggedOut) {
          log('[CONN] Session logged out. Clearing session...')
          try {
            const sessionFiles = readdirSync('./session')
            for (const f of sessionFiles) {
              if (f !== 'README.md') try { unlinkSync(`./session/${f}`) } catch {}
            }
          } catch {}
        }

        if (code === DisconnectReason.restartRequired || code === 428) {
          log('[CONN] Restart required. Restarting immediately...')
          try { process.send('reset') } catch {}
        }

        const backoff = Math.min(connectionFailures * 3000, 15000)
        log(`[CONN] Reconnecting in ${backoff/1000}s...`)
        await delay(backoff)
        try {
          if (global.reloadHandler) {
            await global.reloadHandler(true)
          }
        } catch (error) {
          log(`[CONN] Reconnection error: ${error.message}`)
        }
      }
      if (connection === 'connecting') {
        log('[CONN] Connecting to WhatsApp...')
      }
    }

    if (events['creds.update']) {
      await saveCreds()
    }

    if (events['messages.upsert']) {
      const upsert = events['messages.upsert']
      const msgCount = upsert?.messages?.length || 0
      const firstMsg = upsert?.messages?.[0]
      const from = firstMsg?.key?.remoteJid || 'unknown'
      log(`[MSG] ${msgCount} msg(s) from ${from.slice(0,20)} | type: ${upsert?.type}`)

      const msgs = upsert.messages || []
      for (const msg of msgs) {
        try {
          if (msg.key?.remoteJid === 'status@broadcast' && !msg.key?.fromMe) {
            if (process.env.statusview === 'true' || process.env.AUTO_STATUS_LIKE === 'true') {
              await global.conn.readMessages([msg.key]).catch(() => {})
            }
            if (process.env.AUTO_STATUS_LIKE === 'true') {
              const likeEmoji = process.env.AUTO_STATUS_LIKE_EMOJI || '💚'
              const myJid = global.conn.user?.id ? jidNormalizedUser(global.conn.user.id) : null
              if (myJid) {
                await global.conn.sendMessage('status@broadcast', {
                  react: { key: msg.key, text: likeEmoji }
                }, {
                  statusJidList: [msg.key.participant, myJid]
                }).catch(() => {})
                log(`[STATUS] Liked status from ${msg.key.participant?.split('@')[0] || 'unknown'} with ${likeEmoji}`)
              }
            }
            if (process.env.Status_Saver === 'true') {
              try {
                const senderName = msg.pushName || global.conn.getName?.(msg.key.participant) || 'Unknown'
                const ownerJid = global.conn.user?.id ? jidNormalizedUser(global.conn.user.id) : null
                if (ownerJid) {
                  await global.conn.copyNForward(ownerJid, msg, true).catch(() => {})
                  const caption = msg.message?.imageMessage?.caption || msg.message?.videoMessage?.caption || ''
                  await global.conn.sendMessage(ownerJid, {
                    text: `*AUTO STATUS SAVER*\n*From:* ${senderName}\n*Caption:* ${caption || 'None'}`,
                    mentions: [msg.key.participant]
                  }).catch(() => {})
                  log(`[STATUS] Saved status from ${senderName}`)
                }
              } catch (e) {}
            }
            if (process.env.STATUS_REPLY === 'true') {
              try {
                const replyMsg = process.env.STATUS_MSG || 'SILVA MD 💖💖 SUCCESSFULLY VIEWED YOUR STATUS'
                const quotedStatus = {
                  key: { remoteJid: 'status@broadcast', id: msg.key.id, participant: msg.key.participant },
                  message: msg.message
                }
                await global.conn.sendMessage(msg.key.participant, { text: replyMsg }, { quoted: quotedStatus }).catch(() => {})
              } catch (e) {}
            }
          }
          if (process.env.autoRead === 'true' && msg.key?.remoteJid !== 'status@broadcast') {
            await global.conn.readMessages([msg.key]).catch(() => {})
          }
        } catch (e) {}
      }

      if (global.conn.handler) {
        try {
          await global.conn.handler(upsert)
        } catch (e) {
          log(`[HANDLER-ERR] ${e.message}`)
        }
      }
    }

    if (events['messages.update']) {
      if (global.conn.pollUpdate) global.conn.pollUpdate(events['messages.update'])
    }
    if (events['group-participants.update']) {
      if (global.conn.participantsUpdate) global.conn.participantsUpdate(events['group-participants.update'])
    }
    if (events['groups.update']) {
      if (global.conn.groupsUpdate) global.conn.groupsUpdate(events['groups.update'])
    }
    if (events['message.delete']) {
      if (global.conn.onDelete) global.conn.onDelete(events['message.delete'])
    }
    if (events['presence.update']) {
      if (global.conn.presenceUpdate) global.conn.presenceUpdate(events['presence.update'])
    }
  })
  log('Event listeners registered via ev.process')
}
registerEventHandlers()

if (pairingCode && !conn.authState.creds.registered) {
  let phoneNumber
  if (!!global.pairingNumber) {
    phoneNumber = global.pairingNumber.replace(/[^0-9]/g, '')

    if (!Object.keys(PHONENUMBER_MCC).some(v => phoneNumber.startsWith(v))) {
      console.log(
        chalk.bgBlack(chalk.redBright("Start with your country's WhatsApp code, Example : 254xxx"))
      )
      process.exit(0)
    }
  } else {
    phoneNumber = await question(
      chalk.bgBlack(chalk.greenBright(`Please type your WhatsApp number : `))
    )
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '')

    if (!Object.keys(PHONENUMBER_MCC).some(v => phoneNumber.startsWith(v))) {
      console.log(
        chalk.bgBlack(chalk.redBright("Start with your country's WhatsApp code, Example : 254xxx"))
      )

      phoneNumber = await question(
        chalk.bgBlack(chalk.greenBright(`Please type your WhatsApp number : `))
      )
      phoneNumber = phoneNumber.replace(/[^0-9]/g, '')
      rl.close()
    }
  }

  setTimeout(async () => {
    let code = await conn.requestPairingCode(phoneNumber)
    code = code?.match(/.{1,4}/g)?.join('-') || code
    const pairingCode =
      chalk.bold.greenBright('Your Pairing Code:') + ' ' + chalk.bgGreenBright(chalk.black(code))
    console.log(pairingCode)
  }, 3000)
}

conn.logger.info('\nWaiting For Login\n')

if (!opts['test']) {
  if (global.db) {
    setInterval(async () => {
      if (global.db.data) await global.db.write()
      if (opts['autocleartmp'] && (global.support || {}).find)
        (tmp = [os.tmpdir(), 'tmp']),
          tmp.forEach(filename =>
            cp.spawn('find', [filename, '-amin', '3', '-type', 'f', '-delete'])
          )
    }, 30 * 1000)
  }
}

function runCleanup() {
  clearTmp()
    .then(() => {
      console.log('Temporary file cleanup completed.')
    })
    .catch(error => {
      console.error('An error occurred during temporary file cleanup:', error)
    })
    .finally(() => {
      setTimeout(runCleanup, 1000 * 60 * 2)
    })
}

runCleanup()

function clearsession() {
}

if (global.db.data == null) loadDatabase()

let isInit = true
let handler = await import('./handler.js')
global.reloadHandler = async function (restatConn) {
  try {
    const Handler = await import(`./handler.js?update=${Date.now()}`).catch(console.error)
    if (Object.keys(Handler || {}).length) handler = Handler
  } catch (error) {
    console.error
  }
  if (restatConn) {
    const oldChats = global.conn.chats
    try {
      global.conn.ws.close()
    } catch {}
    conn.ev.removeAllListeners()
    global.conn = makeWASocket(connectionOptions, {
      chats: oldChats,
    })
    registerEventHandlers()
    isInit = true
  }

  conn.welcome = `👋 Hey @user, 🎉 *Welcome to* _@group_! 🔍 Check the group description: @desc 💬 Let's keep the vibes positive! 🚀`
  conn.bye = `😢 *@user has left the building!* 👋 Farewell and best wishes!`
  conn.spromote = `🆙 *Promotion Alert!* 👑 @user is now an *Admin*! Let's gooo! 🎊`
  conn.sdemote = `🔽 *Demotion Notice!* @user is no longer an admin.`
  conn.sDesc = `📝 *Group Description Updated!* 🔍 New Description: @desc`
  conn.sSubject = `🖋️ *Group Name Changed!* 🔔 New Title: _@group_`
  conn.sIcon = `🖼️ *Group Icon Updated!* Check out the fresh new look! 🔥`
  conn.sRevoke = `🔗 *Group Link Reset!* Here's the new invite link: @revoke`
  conn.sAnnounceOn = `🔒 *Group Closed!* Only admins can now send messages.`
  conn.sAnnounceOff = `🔓 *Group Open!* Everyone can now chat freely. 🎉`
  conn.sRestrictOn = `🚫 *Edit Permissions Locked!* Only admins can edit group info now.`
  conn.sRestrictOff = `✅ *Edit Permissions Opened!* All members can now update group info.`
  conn.sDelete = `🗑️ *Message Deleted!* This message has been removed.`

  conn.handler = handler.handler.bind(global.conn)
  conn.pollUpdate = handler.pollUpdate.bind(global.conn)
  conn.participantsUpdate = handler.participantsUpdate.bind(global.conn)
  conn.groupsUpdate = handler.groupsUpdate.bind(global.conn)
  conn.onDelete = handler.deleteUpdate.bind(global.conn)
  conn.presenceUpdate = handler.presenceUpdate.bind(global.conn)
  conn.credsUpdate = saveCreds.bind(global.conn, true)

  isInit = false
  return true
}

const pluginFolder = global.__dirname(join(__dirname, './silvaxlab/index'))
const pluginFilter = filename => /\.js$/.test(filename)
global.plugins = {}
async function filesInit() {
  for (const filename of readdirSync(pluginFolder).filter(pluginFilter)) {
    try {
      const file = global.__filename(join(pluginFolder, filename))
      const module = await import(file)
      global.plugins[filename] = module.default || module
    } catch (e) {
      conn.logger.error(e)
      delete global.plugins[filename]
    }
  }
}
filesInit()
  .then(_ => Object.keys(global.plugins))
  .catch(console.error)

global.reload = async (_ev, filename) => {
  if (pluginFilter(filename)) {
    const dir = global.__filename(join(pluginFolder, filename), true)
    if (filename in global.plugins) {
      if (existsSync(dir)) conn.logger.info(`\nUpdated plugin - '${filename}'`)
      else {
        conn.logger.warn(`\nDeleted plugin - '${filename}'`)
        return delete global.plugins[filename]
      }
    } else conn.logger.info(`\nNew plugin - '${filename}'`)
    const err = syntaxerror(readFileSync(dir), filename, {
      sourceType: 'module',
      allowAwaitOutsideFunction: true,
    })
    if (err) conn.logger.error(`\nSyntax error while loading '${filename}'\n${format(err)}`)
    else {
      try {
        const module = await import(`${global.__filename(dir)}?update=${Date.now()}`)
        global.plugins[filename] = module.default || module
      } catch (e) {
        conn.logger.error(`\nError require plugin '${filename}\n${format(e)}'`)
      } finally {
        global.plugins = Object.fromEntries(
          Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b))
        )
      }
    }
  }
}
Object.freeze(global.reload)
watch(pluginFolder, global.reload)
await global.reloadHandler()
async function _quickTest() {
  const check = (cmd, args = []) => new Promise(resolve => {
    const p = spawn(cmd, args)
    p.on('error', () => resolve(false))
    p.on('close', code => resolve(code !== 127))
  })
  const [ffmpeg, ffprobe, convert] = await Promise.all([
    check('ffmpeg', ['-version']),
    check('ffprobe', ['-version']),
    check('convert', ['--version']),
  ])
  global.support = Object.freeze({ ffmpeg, ffprobe, ffmpegWebp: ffmpeg, convert, magick: false, gm: false, find: true })
}

async function saafsafai() {
  if (stopped === 'close' || !conn || !conn.user) return
  try {
    clearsession()
  } catch {}
}

setInterval(saafsafai, 10 * 60 * 1000)

setInterval(() => {
  try { if (global.gc) global.gc() } catch {}
  const mem = process.memoryUsage()
  if (mem.heapUsed > 350 * 1024 * 1024) {
    console.log(chalk.yellow(`⚠️ High memory: ${Math.round(mem.heapUsed / 1024 / 1024)}MB - clearing caches`))
    if (global.db?.data?.msgs) global.db.data.msgs = {}
    if (global.db?.data?.sticker) global.db.data.sticker = {}
  }
}, 60 * 1000)

_quickTest().catch(console.error)
