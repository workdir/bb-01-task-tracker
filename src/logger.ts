import * as L from 'logging-ts/lib/IO'
import * as IO from 'fp-ts/IO'
import * as Console  from 'fp-ts/Console';
import {  flow, pipe } from 'fp-ts/function'
import * as D from 'fp-ts/Date';
import * as TE from 'fp-ts/TaskEither'
import * as RTE from 'fp-ts/ReaderTaskEither'
import { Config } from '@/config'
import { ReaderResult } from '@/utils/types'


export type Logger = ReaderResult<typeof Logger>;

export type Level = 'debug' | 'info' | 'warning' | 'error'

export interface Entry {
  message: string
  time: Date
  level: Level
}

const askForConfig = flow(
  RTE.ask<Config>,
  RTE.map((config) => config.config),
);

export const Logger = pipe(
  RTE.Do,
  RTE.bind('config', askForConfig),
  RTE.map(({ config }) => {

    const showEntry = (entry: Entry) => `[${entry.time.toISOString()}] ${entry.level.toUpperCase()}: ${entry.message}`
    const logger = L.filter(flow(showEntry, Console.log), (entry) => true)

    const debug = (message: string) => logger({ level: 'debug', time: new Date(), message })
    const info = (message: string) => logger({ level: 'info', time: new Date(), message })
    const warning = (message: string) => logger({ level: 'warning', time: new Date(), message })
    const error = (message: string) => logger({ level: 'error', time: new Date(), message })

    return {
      debug,
      info,
      warning,
      error
    }

  }),
  RTE.bindTo('logger')
)

const programA = pipe(
  RTE.ask<Logger>(),
  RTE.flatMap(({ logger }) => pipe(
    IO.Do,
    IO.tap(() => logger.error('ERROR!')), 
    IO.tap(() => logger.warning('WARNING!')), 
    IO.tap(() => logger.info('INFO!')), 
    IO.tap(() => logger.debug('DEBUG!')), 
    RTE.fromIO
  )
  )
)

let mutation = 0

const programB = 
 pipe(
  RTE.ask<Logger>(),
  RTE.flatMap(({ logger }) => pipe(
    RTE.Do,
    RTE.tapIO(() => logger.info(`reading tasks begun, mutation: ${mutation}`)),
    RTE.map(() => {
      mutation += 1;
    }),
    RTE.tapIO(() => logger.info(`reading tasks finished, mutation: ${mutation}`))
  )))

interface User {
  name: string
}

const usersDB: Array<User> = []
const makeUser = (i: User): User => i;

const saveUsers = (users: Array<User>) => pipe(
  TE.of('saving users to db'),
  TE.tapIO(() => IO.of(usersDB.push(...users))),
  TE.asUnit
)

const getUsers = pipe(
  TE.of('reading users from db'),
  TE.as(usersDB)
)

const programC = flow(
  saveUsers,
  TE.flatMap(() => getUsers)
)

const TASKS_FILEPATH = "todos.json";

const InMemoryConfig: Config = {
  config: {
    tasksFilepath: TASKS_FILEPATH,
    logLevel: "debug"
  },
};

const run = pipe(
  TE.Do,
  TE.bind('impl', () => Logger(InMemoryConfig)),
  TE.flatMap(({ impl }) =>
    pipe(
      programA(impl), 
      TE.flatMap(() => programB(impl)),
      TE.flatMap(() => programC([makeUser({name: "steave"})]))
    )
  )
)

run()


