import { LogFormatter } from "./LogFormatter.js"
import { LogQueue } from "./LogQueue.js"

const LEVELS = {
    TRACE: 10,
    DEBUG: 20,
    INFO: 30,
    WARN: 40,
    ERROR: 50,
    FATAL: 60
}

const NL = Buffer.from("\n")

/**
 * High-performance asynchronous logger
 */
export class Logger {
    /**
     * @param {import('../types').LoggerConfig} param0
     */
    constructor({ level = "INFO" } = {}) {
        this.level = level.toUpperCase()
        this.queue = new LogQueue()
    }

    /**
     * @param {import('../types').LogLevel} level
     */
    shouldLog(level) {
        return LEVELS[level] >= LEVELS[this.level]
    }

    /**
     * @param {import('../types').LogLevel} level
     * @param {string|Error} message
     * @param {import('../types').LogMeta} meta
     */
    log(level, message, meta = {}) {
        if (!this.shouldLog(level)) return

        if (message instanceof Error) {
            meta.errorMsg = message.message
            meta.stack = message.stack
            message = message.message
        }

        const text = LogFormatter.format(level, message, meta)
        const buf = Buffer.concat([Buffer.from(text), NL])

        this.queue.push(() => {
            process.stderr.write(buf)
        })
    }

    /** Wait for internal queue to flush all logs */
    async waitForFlush() {
        while (this.queue.flushing || !this.queue.isEmpty()) {
            await new Promise(r => setTimeout(r, 1))
        }
    }

    logTrace(m, meta) { this.log("TRACE", m, meta) }
    logDebug(m, meta) { this.log("DEBUG", m, meta) }
    logInfo(m, meta)  { this.log("INFO", m, meta) }
    logWarn(m, meta)  { this.log("WARN", m, meta) }
    logError(m, meta) { this.log("ERROR", m, meta) }
    logFatal(m, meta) { this.log("FATAL", m, meta) }
}