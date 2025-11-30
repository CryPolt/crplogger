import { jest } from "@jest/globals"
import { createLogger } from "../src/index.js"


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


describe("Logger levels output", () => {

    test("should log all levels correctly", async () => {
        const logger = createLogger({ level: "TRACE" })

        logger.trace("trace_msg")
        logger.debug("debug_msg")
        logger.info("info_msg")
        logger.warn("warn_msg")
        logger.error("error_msg")
        logger.fatal("fatal_msg")

        await waitForLogs(150)

        expect(written.length).toBe(6)

        const logs = written.map(parseLog)

        expect(logs[0].Level).toBe("TRACE")
        expect(logs[0].Message).toBe("trace_msg")

        expect(logs[1].Level).toBe("DEBUG")
        expect(logs[1].Message).toBe("debug_msg")

        expect(logs[2].Level).toBe("INFO")
        expect(logs[2].Message).toBe("info_msg")

        expect(logs[3].Level).toBe("WARN")
        expect(logs[3].Message).toBe("warn_msg")

        expect(logs[4].Level).toBe("ERROR")
        expect(logs[4].Message).toBe("error_msg")

        expect(logs[5].Level).toBe("FATAL")
        expect(logs[5].Message).toBe("fatal_msg")
    })

    test("should respect logging level threshold", async () => {
        const logger = createLogger({ level: "WARN" })

        logger.trace("trace_msg")
        logger.debug("debug_msg")
        logger.info("info_msg")
        logger.warn("warn_msg")
        logger.error("error_msg")
        logger.fatal("fatal_msg")

        await waitForLogs(150)

        expect(written.length).toBe(3)

        const logs = written.map(parseLog)

        expect(logs[0].Level).toBe("WARN")
        expect(logs[1].Level).toBe("ERROR")
        expect(logs[2].Level).toBe("FATAL")
    })
})