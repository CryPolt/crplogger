import { Logger } from "./core/Logger.js"
import {
    runWithRequestId,
    getRequestId,
    generateRequestId
} from "./core/RequestContext.js"
import { initLogger, getLogger } from "./core/GlobalLogger.js"

/**
 * Create logger instance
 * @param {import('./types').LoggerConfig} config
 * @returns {import('./types').ILogger}
 */
export function createLogger(config = {}) {
    return new Logger(config)
}

export { initLogger, getLogger }

export { runWithRequestId, getRequestId, generateRequestId }

export { Logger }