import { Storage, FilesystemStorage } from "./storage";
import { Presentation, ConsolePresentation } from './presentation';
import { pipe } from 'fp-ts/function'
import * as RTE from 'fp-ts/ReaderTaskEither'
import { Task } from './schema'
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import { PathReporter } from 'io-ts/PathReporter'



const TaskTracker = pipe(
  RTE.Do,
  RTE.bind('storage', RTE.ask<Storage>),
  RTE.bindW('presentation', RTE.ask<Presentation>),
  RTE.map(({ storage, presentation }) => {
     return {

      add(description: string) {
         const _add = pipe(
           Task.decode({}),
           TE.fromEither,
           TE.flatMap(storage.add),
         )


      },
      delete() {},
      update() {},
      updateStatus() {},
      list() {}
    }
  }
)
)

