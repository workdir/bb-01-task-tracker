import { pipe } from 'fp-ts/function'
import * as RTE from 'fp-ts/ReaderTaskEither'
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import { PathReporter } from 'io-ts/PathReporter'

import { Storage } from "./storage";
import { Presentation } from './presentation';
import { Task, Description, TaskId, Status } from './schema'

export const TaskTracker = pipe(
  RTE.Do,
  RTE.bind('storage', RTE.ask<Storage>),
  //RTE.bindW('presentation', RTE.ask<Presentation>),
  RTE.map(({ storage, presentation }) => {
     return {

      add(description: Description) {
          storage.add({ description, status: "todo" })
      },

      delete(id: TaskId) {
        
      },

      update(id: TaskId, { description, status }: {description?: Description, status?: Status}) {
         
      },

      getAll() {
        storage.getAll()
      }
    }
  }
)
)

