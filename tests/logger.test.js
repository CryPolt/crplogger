import { jest } from "@jest/globals"
import {
    createLogger,
    initLogger,
    getLogger,
    runWithRequestId,
    getRequestId,
    generateRequestId
} from "../src/index.js"


let written = []
let buffer = ""

beforeEach(() => {
    written = []
    buffer = ""

    jest.spyOn(process.stderr, "write").mockImplementation((chunk, cb) => {
        const str = Buffer.isBuffer(chunk) ? chunk.toString() : String(chunk)

        for (const ch of str) {
            if (ch === "\n") {
                if (buffer.length > 0) {
                    if (/^\d{4}-\d{2}-\d{2}T/.test(buffer)) {
                        written.push(buffer)
                    }
                }
                buffer = ""
            } else {
                buffer += ch
            }
        }

        cb && cb()
    })
})

afterEach(() => {
    jest.restoreAllMocks()
})

async function waitForLogs(timeout = 100) {
    const start = Date.now()
    let prev = -1
    while (Date.now() - start < timeout) {
        if (written.length === prev) return
        prev = written.length
        await new Promise(r => setTimeout(r, 5))
    }
}

function parseLog(line) {
    const json = line.replace(/^[^ ]+ /, "")
    return JSON.parse(json)
}


describe("Donner Logger", () => {

    test("DI logger prints JSON with INFO level", async () => {
        const logger = createLogger({ level: "INFO" })

        logger.info("Test message", { Payload: [{ a: 1 }] })

        await waitForLogs()

        expect(written.length).toBe(1)

        const log = parseLog(written[0])
        expect(log.Level).toBe("INFO")
        expect(log.Message).toBe("Test message")
        expect(log.Payload).toEqual([{ a: 1 }])
    })

    test("Lower-level logs do not print when threshold is higher", async () => {
        const logger = createLogger({ level: "WARN" })

        logger.debug("debug msg")
        logger.info("info msg")
        logger.warn("warn msg")

        await waitForLogs()

        expect(written.length).toBe(1)

        const log = parseLog(written[0])
        expect(log.Level).toBe("WARN")
    })

    test("Errors are serialized with stack", async () => {
        const logger = createLogger({ level: "DEBUG" })

        const err = new Error("boom!")
        logger.error(err)

        await waitForLogs()

        expect(written.length).toBe(1)

        const log = parseLog(written[0])

        expect(log.Level).toBe("ERROR")
        expect(log.Payload[0]).toContain("Stack:")
        expect(log.Payload[1]).toContain("Error:boom!")
    })

    test("request_id auto propagates using AsyncLocalStorage", async () => {
        const logger = createLogger({ level: "INFO" })

        const rid = generateRequestId()

        runWithRequestId(() => {
            logger.info("Inside context")
            expect(getRequestId()).toBe(rid)
        }, rid)

        await waitForLogs()

        expect(written.length).toBe(1)

        const log = parseLog(written[0])
        expect(log.RequestID).toBe(rid)
    })

    test("Nested async operations preserve request_id", async () => {
        const logger = createLogger({ level: "INFO" })

        runWithRequestId(() => {
            const rid = getRequestId()

            setTimeout(() => {
                logger.info("Delayed log")
                expect(getRequestId()).toBe(rid)
            }, 5)
        })

        await waitForLogs(200)

        expect(written.length).toBe(1)

        const log = parseLog(written[0])
        expect(log.RequestID).toBeTruthy()
    })

    test("Global logger initializes exactly once", async () => {
        const logger1 = initLogger({ level: "DEBUG" })
        const logger2 = initLogger({ level: "ERROR" })

        expect(logger1).toBe(logger2)
        expect(getLogger()).toBe(logger1)
    })

    test("Global logger logs properly", async () => {
        initLogger({ level: "INFO" })
        const gl = getLogger()

        gl.info("global_test")

        await waitForLogs()

        expect(written.length).toBe(1)

        const log = parseLog(written[0])
        expect(log.Message).toBe("global_test")
    })

    test("Queue processes logs sequentially", async () => {
        const logger = createLogger({ level: "INFO" })

        logger.info("msg1")
        logger.info("msg2")
        logger.info("msg3")

        await waitForLogs()

        expect(written.length).toBe(3)

        expect(parseLog(written[0]).Message).toBe("msg1")
        expect(parseLog(written[1]).Message).toBe("msg2")
        expect(parseLog(written[2]).Message).toBe("msg3")
    })
})