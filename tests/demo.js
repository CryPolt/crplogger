import { createLogger, runWithRequestId } from "../src/index.js"

const logger = createLogger({ level: "TRACE" })

logger.trace("trace message", { Payload: ["trace payload"] })
logger.debug("debug message")
logger.info("info message")
logger.warn("warn message")
logger.error(new Error("boom error"))
logger.fatal("fatal message")

await new Promise(r => setTimeout(r, 50))

runWithRequestId(() => {
    logger.info("inside context log", { Payload: ["ctx"] })
}, "REQ-DEMO-12345")

await new Promise(r => setTimeout(r, 50))