import chalk from 'chalk'
import { spawn } from 'child_process'
import express from 'express'
import figlet from 'figlet'
import fs from 'fs'
import path from 'path'
<<<<<<< HEAD
import { fileURLToPath } from 'url';

figlet(
  'SILVA MD',
  {
    font: 'Ghost',
    horizontalLayout: 'default',
    verticalLayout: 'default',
  },
  (err, data) => {
    if (err) {
      console.error(chalk.red('Figlet error:', err))
      return
    }
    console.log(chalk.yellow(data))
  }
)

figlet(
  'Silva Bot',
  {
    horizontalLayout: 'default',
    verticalLayout: 'default',
  },
  (err, data) => {
    if (err) {
      console.error(chalk.red('Figlet error:', err))
      return
    }
    console.log(chalk.magenta(data))
  }
)

const app = express()
const port = process.env.PORT || 5000

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'jusorts')));

app.get('/', (req, res) => {
  res.redirect('/silva.html');
});
=======
import { fileURLToPath } from 'url'
import { EventEmitter } from 'events'

// Suppress MaxListenersExceededWarning
EventEmitter.defaultMaxListeners = Infinity

// Path helpers
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Display startup banners
figlet('SILVA MD', { font: 'Ghost' }, (err, data) => {
  if (err) return console.error(chalk.red('Figlet error:'), err)
  console.log(chalk.yellow(data))
})

figlet('Silva Bot', (err, data) => {
  if (err) return console.error(chalk.red('Figlet error:'), err)
  console.log(chalk.magenta(data))
})

// Start Express server
const app = express()
const port = process.env.PORT || 5000

app.use(express.static(path.join(__dirname, 'jusorts')))
app.get('/', (req, res) => res.redirect('/silva.html'))
>>>>>>> a5ad72cbcf4e1685bb7ca81f056aee180f08b9f5

app.listen(port, () => {
  console.log(chalk.green(`Port ${port} is open`))
})

<<<<<<< HEAD
let isRunning = false

=======
// Controlled bot launcher
let isRunning = false
>>>>>>> a5ad72cbcf4e1685bb7ca81f056aee180f08b9f5
async function start(file) {
  if (isRunning) return
  isRunning = true

<<<<<<< HEAD
  const currentFilePath = new URL(import.meta.url).pathname
  const args = [path.join(path.dirname(currentFilePath), file), ...process.argv.slice(2)]
  const p = spawn(process.argv[0], args, {
    stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
  })

  p.on('message', data => {
    console.log(chalk.cyan(`✔️RECEIVED ${data}`))
    switch (data) {
      case 'reset':
        p.kill()
        isRunning = false
        start.apply(this, arguments)
        break
      case 'uptime':
        p.send(process.uptime())
        break
    }
  })

  p.on('exit', code => {
    isRunning = false
    console.error(chalk.red(`❌Exited with code: ${code}`))

    if (code === 0) return

    fs.watchFile(args[0], () => {
      fs.unwatchFile(args[0])
      start('sylivanus.js')
    })
  })

  p.on('error', err => {
    console.error(chalk.red(`Error: ${err}`))
    p.kill()
    isRunning = false
    start('sylivanus.js')
  })

  const pluginsFolder = path.join(path.dirname(currentFilePath), 'lazackcmds')

  fs.readdir(pluginsFolder, async (err, files) => {
    if (err) {
      console.error(chalk.red(`Error reading lazackcmds folder: ${err}`))
=======
  const args = [path.join(__dirname, file), ...process.argv.slice(2)]
  const child = spawn(process.argv[0], args, {
    stdio: ['inherit', 'inherit', 'inherit', 'ipc']
  })

  child.on('message', data => {
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

  // Plugin loader
  const pluginsFolder = path.join(__dirname, 'SilvaXlab')
  fs.readdir(pluginsFolder, async (err, files) => {
    if (err) {
      console.error(chalk.red(`Error reading plugins: ${err}`))
>>>>>>> a5ad72cbcf4e1685bb7ca81f056aee180f08b9f5
      return
    }
    console.log(chalk.yellow(`Installed ${files.length} plugins`))

<<<<<<< HEAD
    try {
      const { default: baileys } = await import('@whiskeysockets/baileys')
      const version = (await baileys.fetchLatestBaileysVersion()).version
      console.log(chalk.yellow(`Using Baileys version ${version}`))
    } catch (e) {
      console.error(chalk.red(' Baileys library is not installed'))
=======
    // Check Baileys version
    try {
      const { default: baileys } = await import('@whiskeysockets/baileys')
      const version = (await baileys.fetchLatestBaileysVersion()).version
      console.log(chalk.blue(`Using Baileys version ${version}`))
    } catch {
      console.error(chalk.red('Baileys library is not installed.'))
>>>>>>> a5ad72cbcf4e1685bb7ca81f056aee180f08b9f5
    }
  })
}

<<<<<<< HEAD
start('sylivanus.js')

process.on('unhandledRejection', () => {
  console.error(chalk.red(`Unhandled promise rejection. Bot will restart...`))
=======
// Auto-restart logic
start('sylivanus.js')

process.on('unhandledRejection', err => {
  console.error(chalk.red('Unhandled rejection:'), err)
>>>>>>> a5ad72cbcf4e1685bb7ca81f056aee180f08b9f5
  start('sylivanus.js')
})

process.on('exit', code => {
<<<<<<< HEAD
  console.error(chalk.red(`Exited with code: ${code}`))
  console.error(chalk.red(`Bot will restart...`))
  start('sylivanus.js')
})
=======
  console.error(chalk.red(`Process exited with code ${code}`))
  start('sylivanus.js')
})
>>>>>>> a5ad72cbcf4e1685bb7ca81f056aee180f08b9f5
