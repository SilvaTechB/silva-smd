import chalk from 'chalk'
import { spawn } from 'child_process'
import express from 'express'
import figlet from 'figlet'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { EventEmitter } from 'events'
EventEmitter.defaultMaxListeners = Infinity

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

figlet('SILVA MD', { font: 'Ghost' }, (err, data) => {
  if (err) return console.error(chalk.red('Figlet error:'), err)
  console.log(chalk.yellow(data))
})

figlet('Silva Bot', (err, data) => {
  if (err) return console.error(chalk.red('Figlet error:'), err)
  console.log(chalk.magenta(data))
})

const app = express()
const port = process.env.PORT || 5000

app.use(express.static(path.join(__dirname, 'jusorts')))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'jusorts', 'silva.html'))
})

app.listen(port, '0.0.0.0', () => {
  console.log(chalk.green(`Port ${port} is open`))
})

let isRunning = false
async function start(file) {
  if (isRunning) return
  isRunning = true

  const args = [path.join(__dirname, file), ...process.argv.slice(2)]
  const child = spawn(process.argv[0], args, {
    stdio: ['inherit', 'inherit', 'inherit', 'ipc']
  })

  child.on('message', data => {
    if (typeof data === 'object' && data.type === 'qr') {
      console.log(chalk.yellow('QR code generated - check the terminal to scan'))
      return
    }
    if (typeof data === 'object' && data.type === 'connected') {
      console.log(chalk.green('WhatsApp connected successfully!'))
      return
    }
    console.log(chalk.cyan(`✔️ RECEIVED: ${data}`))
    if (data === 'reset') {
      child.kill()
      isRunning = false
      start(file)
    } else if (data === 'uptime') {
      child.send(process.uptime())
    }
  })

  child.on('exit', code => {
    isRunning = false
    console.error(chalk.red(`❌ Exited with code: ${code}`))
    if (code !== 0) {
      fs.watchFile(args[0], () => {
        fs.unwatchFile(args[0])
        start(file)
      })
    }
  })

  child.on('error', err => {
    console.error(chalk.red(`❌ Child process error: ${err}`))
    child.kill()
    isRunning = false
    start(file)
  })

  const pluginsFolder = path.join(__dirname, 'silvaxlab')
  fs.readdir(pluginsFolder, async (err, files) => {
    if (err) {
      console.error(chalk.red(`Error reading plugins: ${err}`))
      return
    }
    console.log(chalk.yellow(`Installed ${files.length} plugins`))

    try {
      const { default: baileys } = await import('@whiskeysockets/baileys')
      const version = (await baileys.fetchLatestBaileysVersion()).version
      console.log(chalk.blue(`Using Baileys version ${version}`))
    } catch {
      console.error(chalk.red('Baileys library is not installed.'))
    }
  })
}

start('sylivanus.js')

process.on('unhandledRejection', err => {
  console.error(chalk.red('Unhandled rejection:'), err)
  start('sylivanus.js')
})

process.on('exit', code => {
  console.error(chalk.red(`Process exited with code ${code}`))
  start('sylivanus.js')
})
