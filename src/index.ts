import { pipe } from 'fp-ts/function'
import * as E from 'fp-ts/Either'
import { TaskTracker  } from './task-tracker'
import {FilesystemStorage} from './storage'
import {ConsolePresentation} from './presentation'
import * as RTE from 'fp-ts/ReaderTaskEither'
import * as A from 'fp-ts/Array'
import { Commands } from './schema'
import * as TE from 'fp-ts/TaskEither'
import * as O from 'fp-ts/Option'
import { PathReporter } from 'io-ts/PathReporter'
import { Trim } from './utils/schema'
import { NonEmptyString } from 'io-ts-types'

const application = pipe(
  RTE.Do,
  RTE.let('args', () => pipe(
    process.argv,
    A.dropLeft(2)
  )),
  RTE.bind('taskTracker', () => TaskTracker),
  RTE.map(({ args, taskTracker }) => {
    pipe(
      Commands.decode(args),
      E.map((args) => {
        const [command] = args;
        switch (command) {
          case "add":
            taskTracker.add(args[1])
            break;
          case "update":
            const x = args[1]
            const y = args[2] 
            taskTracker.update(x, { description: args[2] })
            break;
          case "delete":
            taskTracker.delete(args[1])
            break;
          case "list":
            taskTracker.list()
            break;
          case "mark-in-progress":
            const rr = args[1]
            break;
          case "mark-done":
            break;
        }
      }),
    )
  })
)

pipe(
  TE.Do,
  TE.bind('storage', () => pipe(
    NonEmptyString.decode(''),
    TE.fromEither,
    TE.flatMap(
      (tasksFilepath) => FilesystemStorage({ tasksFilepath })
    )
  ),
  ),
  TE.bindW('taskTracker', ({ storage }) => TaskTracker(storage)),
  TE.map(({taskTracker}) => taskTracker)
)

