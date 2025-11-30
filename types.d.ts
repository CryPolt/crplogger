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
    trace(msg: string | Error, meta?: LogMeta): void
    debug(msg: string | Error, meta?: LogMeta): void
    info(msg: string | Error, meta?: LogMeta): void
    warn(msg: string | Error, meta?: LogMeta): void
    error(msg: string | Error, meta?: LogMeta): void
    fatal(msg: string | Error, meta?: LogMeta): void
}