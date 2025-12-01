export type LogLevel =
    | "TRACE"
    | "DEBUG"
    | "INFO"
    | "WARN"
    | "ERROR"
    | "FATAL"

export interface LogMeta {
    Payload?: Record<string, any>
    request_id?: string
    stack?: string
    errorMsg?: string
    Source?: any
}

export interface LoggerConfig {
    level?: LogLevel
}

export interface ILogger {
    logTrace(msg: string | Error, meta?: LogMeta): void
    logDebug(msg: string | Error, meta?: LogMeta): void
    logInfo(msg: string | Error, meta?: LogMeta): void
    logWarn(msg: string | Error, meta?: LogMeta): void
    logError(msg: string | Error, meta?: LogMeta): void
    logFatal(msg: string | Error, meta?: LogMeta): void
}