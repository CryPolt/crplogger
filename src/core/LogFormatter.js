import os from "os"
import { generateRequestId, getRequestId } from "./RequestContext.js"

const HOST = os.hostname()

let cachedTs = new Date().toISOString()
setInterval(() => {
    cachedTs = new Date().toISOString()
}, 1)

/**
 * Format structured log line
 */
export class LogFormatter {
    /**
     * @param {import('../types').LogLevel} level
     * @param {string} message
     * @param {import('../types').LogMeta} meta
     * @returns {string}
     */
    static format(level, message, meta = {}) {
        const reqId =
            meta.request_id ||
            getRequestId() ||
            generateRequestId()

        const payload =
            meta.Payload && typeof meta.Payload === "object"
                ? meta.Payload
                : {}

        payload.RequestID = reqId

        if (meta.stack) payload.Stack = meta.stack.replace(/\n/g, "\\n")
        if (meta.errorMsg) payload.Error = meta.errorMsg
        if (meta.Source) payload.Source = meta.Source

        const log = {
            Level: level,
            Host: HOST,
            Message: typeof message === "string" ? message : String(message),
            Payload: payload
        }

        return `${cachedTs} ${JSON.stringify(log)}`
    }
}