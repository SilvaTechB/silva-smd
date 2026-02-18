process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'
import './config.js'

import dotenv from 'dotenv'
import { existsSync, readFileSync, readdirSync, unlinkSync, watch } from 'fs'
import { createRequire } from 'module'
import path, { join } from 'path'
import { platform } from 'process'
import { fileURLToPath, pathToFileURL } from 'url'
import * as ws from 'ws'
import { EventEmitter } from 'events'
import qrcodeTerminal from 'qrcode-terminal'

EventEmitter.defaultMaxListeners = Infinity
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
    console.log(chalk.yellow('No SESSION_ID found. Bot will start in QR code pairing mode.'))
    console.log(chalk.yellow('QR code will be printed in the terminal. Scan it with WhatsApp.'))
    return
  }

  try {
    await loadSession(txt)
    console.log('Session credentials loaded successfully.')
  } catch (error) {
    console.error('Error loading session:', error)
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
  generateHighQualityLinkPreview: true,
  getMessage: async key => {
    return { conversation: '' }
  },
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
  msgRetryCounterCache,
  defaultQueryTimeoutMs: undefined,
  syncFullHistory: false,
}

global.conn = makeWASocket(connectionOptions)
conn.isInit = false
store?.bind(conn.ev)

conn.ev.process(async (events) => {
  if (events['connection.update']) {
    const update = events['connection.update']
    const { qr, connection, lastDisconnect } = update
    if (qr) {
      console.log(chalk.green('\n📱 QR CODE GENERATED - Scan with WhatsApp:\n'))
      qrcodeTerminal.generate(qr, { small: true }, (qrcode) => {
        console.log(qrcode)
      })
    }
    if (connection === 'open') {
      console.log(chalk.green('✅ WhatsApp connected successfully!'))
    }
    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode
      console.log(chalk.red(`Connection closed. Reason: ${reason}`))
    }
  }
  if (events['creds.update']) {
    await saveCreds()
  }
})

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
  let prekey = []
  const directorio = readdirSync('./session')
  const filesFolderPreKeys = directorio.filter(file => {
    return file.startsWith('pre-key-')
  })
  prekey = [...prekey, ...filesFolderPreKeys]
  filesFolderPreKeys.forEach(files => {
    unlinkSync(`./session/${files}`)
  })
}

async function connectionUpdate(update) {
  const { connection, lastDisconnect, isNewLogin, qr } = update
  global.stopped = connection

  if (isNewLogin) conn.isInit = true

  const code =
    lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode

  if (code && code !== DisconnectReason.loggedOut && conn?.ws.socket == null) {
    try {
      conn.logger.info(await global.reloadHandler(true))
    } catch (error) {
      console.error('Error reloading handler:', error)
    }
  }

  if (code && (code === DisconnectReason.restartRequired || code === 428)) {
    conn.logger.info(chalk.yellow('\n Restart Required... Restarting'))
    process.send('reset')
  }

  if (global.db.data == null) loadDatabase()

  if (qr) {
    conn.logger.info(chalk.yellow('\nQR code generated - scan to pair'))
    try {
      process.send({ type: 'qr', qr: qr })
    } catch (e) {}
  }

  if (connection === 'open') {
    try {
      process.send({ type: 'connected' })
    } catch (e) {}
    const { jid, name } = conn.user
    const msg = `💖𝑺𝑰𝑳𝑽𝑨 𝑴𝑫 𝑩𝑶𝑻💖 \n\nGreetings ${name}, ✅ Congrats you have successfully deployed *Silva MD Bot* \n\n ⚙️ *Prefix:*\n 🏢 *Organization:* *Silva Tech Inc.* \n 🗓️ *CREATED:* *Sep 2024* \n\n 🌟 *Follow our WhatsApp Channel for updates:* \n https://whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v \n\n 🔄 *New features coming soon. Stay tuned!* \n\n Developer Sylivanus Momanyi\nfounder of Silva Tech Inc`

    await conn.sendMessage(jid, { text: msg, mentions: [jid] }, { quoted: null })

    newsletterHandler.follow({
      sock: conn,
      config: global.config || {},
      logMessage: (level, msg) => conn.logger.info(chalk.green(msg))
    }).catch(err => conn.logger.error('Newsletter follow error:', err.message))

    conn.logger.info(chalk.yellow('\nSilva is on 𝖶𝖮𝖱𝖪'))
  }

  if (connection === 'close') {
    conn.logger.error(chalk.yellow(`\nConnection closed... Get a new session`))
  }
}

process.on('uncaughtException', console.error)

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
    isInit = true
  }
  if (!isInit) {
    if (conn._evCleanup) {
      conn._evCleanup()
      conn._evCleanup = null
    }
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
  conn.connectionUpdate = connectionUpdate.bind(global.conn)
  conn.credsUpdate = saveCreds.bind(global.conn, true)

  const currentDateTime = new Date()
  const messageDateTime = new Date(conn.ev)
  if (currentDateTime >= messageDateTime) {
    const chats = Object.entries(conn.chats)
      .filter(([jid, chat]) => !jid.endsWith('@g.us') && chat.isChats)
      .map(v => v[0])
  } else {
    const chats = Object.entries(conn.chats)
      .filter(([jid, chat]) => !jid.endsWith('@g.us') && chat.isChats)
      .map(v => v[0])
  }

  conn._evCleanup = conn.ev.process(async (events) => {
    if (events['messages.upsert']) {
      const upsert = events['messages.upsert']
      conn.handler(upsert)
      if (process.env.statusview === 'true' || process.env.autoRead === 'true') {
        const msgs = upsert.messages || []
        for (const msg of msgs) {
          try {
            if (process.env.statusview === 'true' && msg.key?.remoteJid === 'status@broadcast') {
              await conn.readMessages([msg.key])
            }
            if (process.env.autoRead === 'true' && msg.key?.remoteJid !== 'status@broadcast') {
              await conn.readMessages([msg.key])
            }
          } catch (e) {}
        }
      }
    }
    if (events['messages.update']) {
      conn.pollUpdate(events['messages.update'])
    }
    if (events['group-participants.update']) {
      conn.participantsUpdate(events['group-participants.update'])
    }
    if (events['groups.update']) {
      conn.groupsUpdate(events['groups.update'])
    }
    if (events['message.delete']) {
      conn.onDelete(events['message.delete'])
    }
    if (events['presence.update']) {
      conn.presenceUpdate(events['presence.update'])
    }
    if (events['connection.update']) {
      conn.connectionUpdate(events['connection.update'])
    }
    if (events['creds.update']) {
      conn.credsUpdate(events['creds.update'])
    }
  })
  isInit = false
  console.log(chalk.green('Event listeners registered via ev.process'))
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
  const test = await Promise.all(
    [
      spawn('ffmpeg'),
      spawn('ffprobe'),
      spawn('ffmpeg', [
        '-hide_banner',
        '-loglevel',
        'error',
        '-filter_complex',
        'color',
        '-frames:v',
        '1',
        '-f',
        'webp',
        '-',
      ]),
      spawn('convert'),
      spawn('magick'),
      spawn('gm'),
      spawn('find', ['--version']),
    ].map(p => {
      return Promise.race([
        new Promise(resolve => {
          p.on('close', code => {
            resolve(code !== 127)
          })
        }),
        new Promise(resolve => {
          p.on('error', _ => resolve(false))
        }),
      ])
    })
  )
  const [ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find] = test
  const s = (global.support = {
    ffmpeg,
    ffprobe,
    ffmpegWebp,
    convert,
    magick,
    gm,
    find,
  })
  Object.freeze(global.support)
}

async function saafsafai() {
  if (stopped === 'close' || !conn || !conn.user) return
  clearsession()
  console.log(chalk.cyanBright('\nStored Sessions Cleared'))
}

setInterval(saafsafai, 10 * 60 * 1000)

_quickTest().catch(console.error)
