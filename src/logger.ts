import * as L from 'logging-ts/lib/IO'
import * as IO from 'fp-ts/IO'
import * as Console  from 'fp-ts/Console';
import {  flow, pipe } from 'fp-ts/function'
import * as D from 'fp-ts/Date';
import * as TE from 'fp-ts/TaskEither'
import * as RTE from 'fp-ts/ReaderTaskEither'

type Level = 'Debug' | 'Info' | 'Warning' | 'Error'

interface Entry {
  message: string
  time: Date
  level: Level
}

const showEntry = (entry: Entry) => `[${entry.time.toISOString()}] ${entry.level.toUpperCase()}: ${entry.message}`
 
const logger: L.LoggerIO<Entry> = flow(showEntry, Console.log) 

const debug = (message: string) => logger({ level: 'Debug', time: new Date(), message })
const info = (message: string) => logger({ level: 'Info', time: new Date(), message })
const warning = (message: string) => logger({ level: 'Warning', time: new Date(), message })
const error = (message: string) => logger({ level: 'Error', time: new Date(), message })

export {
  debug,
  info,
  warning,
  error
}

const loggerTE = L.withLogger(TE.MonadIO)(info)

const application = pipe(
  TE.fromIO(info('transaction start')),
  TE.flatMap(() => TE.of('buy bitcoin')),
  loggerTE((result) => `transaction end with result: ${result}`),
  TE.tapIO((result) => info('transaction end with result: ' + result)),
)

application()



