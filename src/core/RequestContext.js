import { AsyncLocalStorage } from "async_hooks"
import crypto from "crypto"

const als = new AsyncLocalStorage()

/** Generate UUID for request id */
export function generateRequestId() {
    return crypto.randomUUID()
}

/**
 * Run function inside request-id context
 * @param {Function} fn
 * @param {string?} requestId
 */
export function runWithRequestId(fn, requestId = null) {
    const rid = requestId || generateRequestId()
    als.run({ request_id: rid }, fn)
}

/** Get current request id (ALS) */
export function getRequestId() {
    return als.getStore()?.request_id || null
}