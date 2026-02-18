import chalk from 'chalk'
import { spawn } from 'child_process'
import express from 'express'
import figlet from 'figlet'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Display banner
figlet('Silva Bot', (err, data) => {
    if (err) return console.error(chalk.red('Figlet error:'), err)
    console.log(chalk.magenta(data))
})

// Express server for uptime
const app = express()
const port = process.env.PORT || 5000

// Create jusorts directory if it doesn't exist
const jusortsDir = path.join(__dirname, 'jusorts')
if (!fs.existsSync(jusortsDir)) {
    fs.mkdirSync(jusortsDir, { recursive: true })
}

// Create a simple HTML file if it doesn't exist
const htmlFile = path.join(jusortsDir, 'silva.html')
if (!fs.existsSync(htmlFile)) {
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>Silva MD Bot</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            padding: 50px;
            margin: 0;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
            border: 1px solid rgba(255, 255, 255, 0.18);
            max-width: 600px;
            width: 90%;
        }
        h1 {
            font-size: 2.5em;
            margin-bottom: 20px;
        }
        .status {
            background: rgba(255, 255, 255, 0.2);
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
        }
        .online {
            color: #4ade80;
            font-weight: bold;
        }
        .footer {
            margin-top: 30px;
            font-size: 0.9em;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Silva MD Bot</h1>
        <div class="status">
            <p>Status: <span class="online">🟢 ONLINE</span></p>
            <p>Bot is running successfully!</p>
        </div>
        <p>🤖 WhatsApp Bot by Silva Tech Inc.</p>
        <div class="footer">
            <p>© 2024-2026 Silva Tech Inc. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`
    fs.writeFileSync(htmlFile, htmlContent)
}

app.use(express.static(jusortsDir))

app.get('/', (req, res) => {
    res.sendFile(path.join(jusortsDir, 'silva.html'))
})

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    })
})

const server = app.listen(port, '0.0.0.0', () => {
    console.log(chalk.green(`🌐 Web server running on port ${port}`))
})

// Handle server errors
server.on('error', (err) => {
    console.error(chalk.red('Server error:'), err)
})

let isRunning = false
let childProcess = null
const MAX_RESTARTS = 10
let restartCount = 0
let restartTimer = null

async function start(file) {
    if (isRunning) {
        console.log(chalk.yellow('Bot is already running'))
        return
    }

    if (restartCount >= MAX_RESTARTS) {
        console.error(chalk.red(`❌ Max restarts (${MAX_RESTARTS}) reached. Waiting 5 minutes before retrying...`))
        if (restartTimer) clearTimeout(restartTimer)
        restartTimer = setTimeout(() => {
            restartCount = 0
            start(file)
        }, 5 * 60 * 1000)
        return
    }

    isRunning = true
    restartCount++

    const args = [
        '--max-old-space-size=512',
        '--optimize-for-size',
        '--expose-gc',
        path.join(__dirname, file),
        ...process.argv.slice(2)
    ]

    console.log(chalk.cyan(`🔄 Starting bot instance #${restartCount}...`))

    childProcess = spawn(process.argv[0], args, {
        stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
        env: {
            ...process.env,
            NODE_OPTIONS: '--max-old-space-size=512'
        }
    })

    childProcess.on('message', (data) => {
        if (typeof data === 'object' && data.type === 'qr') {
            console.log(chalk.yellow('📱 QR code generated - scan with WhatsApp'))
            return
        }
        if (typeof data === 'object' && data.type === 'connected') {
            console.log(chalk.green('✅ WhatsApp connected successfully!'))
            restartCount = 0 // Reset restart count on successful connection
            return
        }
        console.log(chalk.cyan(`📨 Message: ${typeof data === 'object' ? JSON.stringify(data) : data}`))

        if (data === 'reset') {
            console.log(chalk.yellow('🔄 Restart requested by child process...'))
            restart()
        }
    })

    childProcess.on('exit', (code, signal) => {
        isRunning = false
        childProcess = null

        const exitMessage = signal
            ? `❌ Process killed with signal: ${signal}`
            : `❌ Process exited with code: ${code}`

        console.error(chalk.red(exitMessage))

        // Restart if not a normal exit
        if (code !== 0 && code !== null) {
            console.log(chalk.yellow(`🔄 Restarting in 3 seconds... (Attempt ${restartCount}/${MAX_RESTARTS})`))
            setTimeout(() => start(file), 3000)
        }
    })

    childProcess.on('error', (err) => {
        console.error(chalk.red(`❌ Child process error: ${err.message}`))
        isRunning = false
        childProcess = null
        setTimeout(() => start(file), 5000)
    })

    // Count plugins
    const pluginsFolder = path.join(__dirname, 'plugins')
    if (fs.existsSync(pluginsFolder)) {
        try {
            const files = fs.readdirSync(pluginsFolder)
            console.log(chalk.yellow(`📦 Loaded ${files.length} plugins`))
        } catch (err) {
            console.error(chalk.red(`Error reading plugins: ${err.message}`))
        }
    } else {
        console.log(chalk.yellow('📦 No plugins folder found'))
        fs.mkdirSync(pluginsFolder, { recursive: true })
    }
}

function restart() {
    if (childProcess) {
        console.log(chalk.yellow('🔄 Restarting bot...'))
        childProcess.kill()
    } else {
        start('sylivanus.js')
    }
}

// Handle process termination
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n👋 Shutting down gracefully...'))
    if (childProcess) {
        childProcess.kill()
    }
    server.close(() => {
        process.exit(0)
    })
})

process.on('SIGTERM', () => {
    console.log(chalk.yellow('👋 Received SIGTERM, shutting down...'))
    if (childProcess) {
        childProcess.kill()
    }
    server.close(() => {
        process.exit(0)
    })
})

process.on('unhandledRejection', (err) => {
    console.error(chalk.red('Unhandled rejection:'), err)
})

process.on('uncaughtException', (err) => {
    console.error(chalk.red('Uncaught exception:'), err)
    // Don't exit immediately, let the process handle it
})

// Start the bot
start('sylivanus.js')

console.log(chalk.green('✨ Silva MD Bot initialized successfully!'))
