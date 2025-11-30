
# @crypolt/crplogger

Lightweight, zero-dependency, high-performance asynchronous structured JSON logger for Node.js with automatic request_id propagation via AsyncLocalStorage.

## Features

- Zero dependencies
- Asynchronous non-blocking queue
- Automatic request_id propagation
- Fully structured JSON logs
- Global logger instance (initLogger, getLogger)
- Works with Elastic, Loki, Kibana, Grafana
- Error stack trace serialization
- Minimal overhead and extremely fast

## Installation

```
npm install @crypolt/crplogger
```

## Quick Start

```
import { initLogger } from '@crypolt/crplogger'

const logger = initLogger({ level: 'INFO' })

logger.info('Server started', {
  Payload: { port: 8080 }
})
```

Example output:

```
2025-01-15T10:25:10.123Z {"Level":"INFO","Host":"app01","Message":"Server started","Payload":{"port":8080,"RequestID":"8e91a380-..."}}
```

## Request ID Context

```
import { runWithRequestId, getRequestId, getLogger } from '@crypolt/crplogger'

runWithRequestId(() => {
  const logger = getLogger()
  logger.info('Inside context', {
    Payload: { id: getRequestId() }
  })
})
```

## Global Logger

```
import { initLogger, getLogger } from '@crypolt/crplogger'

initLogger({ level: 'DEBUG' })

const logger = getLogger()

logger.debug('Debug message')
logger.error(new Error('Failure'))
```

## API

### initLogger(config)

Initialize global logger (singleton).

### getLogger()

Returns the global logger instance.

### createLogger(config)

Creates a standalone logger instance.

### Logger Methods

- logger.trace(message, meta?)
- logger.debug(message, meta?)
- logger.info(message, meta?)
- logger.warn(message, meta?)
- logger.error(message or Error, meta?)
- logger.fatal(message or Error, meta?)

### LogMeta structure

```
{
  Payload?: Record<string, any>,
  request_id?: string,
  stack?: string,
  errorMsg?: string,
  Source?: any
}
```

## Integration Examples

### Express

```
import express from 'express'
import { initLogger, runWithRequestId, getLogger } from '@crypolt/crplogger'

initLogger({ level: 'INFO' })

const app = express()

app.use((req, res, next) => {
  runWithRequestId(() => {
    const logger = getLogger()
    logger.info('Incoming request', {
      Payload: {
        method: req.method,
        url: req.url
      }
    })
    next()
  })
})

app.get('/', (req, res) => {
  const logger = getLogger()
  logger.info('Handled root route')
  res.send('OK')
})

app.listen(3000)
```

### Fastify

```
import Fastify from 'fastify'
import { initLogger, runWithRequestId, getLogger } from '@crypolt/crplogger'

initLogger({ level: 'INFO' })

const app = Fastify()

app.addHook('onRequest', (req, res, next) => {
  runWithRequestId(() => {
    const logger = getLogger()
    logger.info('Incoming request', {
      Payload: { url: req.url }
    })
    next()
  })
})

app.get('/', async () => {
  const logger = getLogger()
  logger.info('Fastify root hit')
  return { ok: true }
})

app.listen({ port: 3000 })
```

### Kafka Consumer

```
import { Kafka } from 'kafkajs'
import { initLogger, runWithRequestId, getLogger } from '@crypolt/crplogger'

initLogger({ level: 'INFO' })

const kafka = new Kafka({ clientId: 'svc', brokers: ['localhost:9092'] })
const consumer = kafka.consumer({ groupId: 'group1' })

await consumer.connect()
await consumer.subscribe({ topic: 'events' })

await consumer.run({
  eachMessage: async ({ message }) => {
    runWithRequestId(() => {
      const logger = getLogger()
      logger.info('Processing message', {
        Payload: { value: message.value.toString() }
      })
    })
  }
})
```

## Example Log Output

```
2025-01-15T10:30:12.114Z {"Level":"INFO","Host":"srv01","Message":"Incoming request","Payload":{"method":"GET","url":"/","RequestID":"d59f5e1b-..."}}
2025-01-15T10:30:12.115Z {"Level":"INFO","Host":"srv01","Message":"Handled root route","Payload":{"RequestID":"d59f5e1b-..."}}
```

## License

MIT License
