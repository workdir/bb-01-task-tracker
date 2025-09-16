import { pipe } from 'fp-ts/function'
import * as E from 'fp-ts/Either'
import { TaskTracker } from './task-tracker'
import * as RTE from 'fp-ts/ReaderTaskEither'
import * as A from 'fp-ts/Array'
import { Commands } from './schema'
import * as O from 'fp-ts/Option'
import { PathReporter } from 'io-ts/PathReporter'

const application = pipe(
  RTE.Do,
  RTE.bind('taskTracker', () => TaskTracker),
  RTE.let('args', () => pipe(
    process.argv,
    A.dropLeft(2)
  )),
  RTE.map(({ taskTracker, args }) => {
    pipe(
      Commands.decode(args),
      E.map(([command]) => {
        switch (command) {
          case "add":
            taskTracker.add('maybe invalid description')
            break;
          case "update":
            break;
          case "delete":
            taskTracker.delete(1)
            break;
          case "list":
            taskTracker.getAll()
            break;
          case "mark-in-progress":
            break;
          case "mark-done":
            break;
        }
      }),
    )
  })
)



