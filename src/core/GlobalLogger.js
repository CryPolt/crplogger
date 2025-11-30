import { Logger } from "./Logger.js"

let globalLogger = null

/**
 * Initialize global logger (singleton)
 * @param {import('../types').LoggerConfig} config
 * @returns {import('../types').ILogger}
 */
export function initLogger(config = {}) {
    if (!globalLogger) {
        globalLogger = new Logger(config)
    }
    return globalLogger
}

/**
 * Get global logger
 * @returns {import('../types').ILogger}
 */
export function getLogger() {
    if (!globalLogger) {
        throw new Error(
            "Global logger not initialized. Call initLogger({ ... }) first."
        )
    }
    return globalLogger
}