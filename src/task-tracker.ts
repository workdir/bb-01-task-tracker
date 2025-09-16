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
  RTE.bindW('presentation', RTE.ask<Presentation>),
  RTE.map(({ storage, presentation }) => {
     return {

      add(description: Description) {
         pipe(
          Task.decode
             ({
               id: 1, // storage should be reponsible for generating id. why? Because if i have filesystem storage i generate id based on already saved todo if i use db the autoincrement can be appiled so that logic would be complete nonsens.
               description: description,
               createdAt: new Date(),// this also shoulud be delegated to the storage. Why? 
               updatedAt: new Date(), // this aslo shoulud be delegated to the storage.
               status: "todo",
             } satisfies Task)
           ),
           TE.fromEither,
           TE.flatMap(storage.add),
           TE.mapError(e => {
             switch (e) {

             }
           })
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

