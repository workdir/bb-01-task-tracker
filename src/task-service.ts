import { pipe, flow } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import * as P from 'fp-ts/Predicate'

import { TaskId, Description, Status, Priority } from '@/schema.simple'
import { type Task } from '@/schema.compound'
import type { TaskRepository } from "@/task-repository";
import type { ReaderResult } from "@/utils/types";
import {  } from '@/task.algebra'
import * as O from 'fp-ts/Option'
import * as Alg from 'task.algebra' 
import * as RA from 'fp-ts/ReadonlyArray'
import * as R from 'fp-ts/Record'
import * as RNEA from 'fp-ts/ReadonlyNonEmptyArray'
import * as E from 'fp-ts/Either'
import * as AP from 'fp-ts/Apply'
import * as Eq from 'fp-ts/Eq'
import * as N from 'fp-ts/number'
import * as B from 'fp-ts/boolean'
import * as Sem from 'fp-ts/Semigroup'
import * as M from 'fp-ts/Monoid'
import * as Ord from 'fp-ts/Ord'

export type TaskService = ReaderResult<typeof TaskService> 

export class TaskServiceError extends Error {
  _tag = "TaskServiceError";
  constructor(message = "TaskServiceError default", options?: ErrorOptions) {
    super(message, options);
  }
}

// add/create, update, delete

interface Options {
  where: P.Predicate<Task>,
  orderBy: Ord.Ord<Task>
}

export const TaskService = pipe(
  RTE.Do,
  RTE.bind("deps", RTE.ask<TaskRepository> ),
  RTE.map(({ deps: { taskRepository } }) => ({
    getAll: (options: Options) => {
      const filter = RA.filter(options.where)
      const sort = RA.sort(options.orderBy)

      return pipe(
        taskRepository.getAll(),
        TE.map(flow(filter,sort)),
        TE.mapLeft((e) => new TaskServiceError(e.message, { cause: e })),
      );
    },
    getById: (id: TaskId) => {
      return pipe(
        taskRepository.getById(id),
        TE.mapLeft((e) => new TaskServiceError(e.message, { cause: e })),
      );
    },
    create: (description: Description) => {
      return pipe(
        taskRepository.create(description),
        TE.mapLeft((e) => new TaskServiceError(e.message, { cause: e })),
      );
    },
    update: (task: Task, newTask: Task) => {
      pipe(
        taskRepository.update(task, newTask),
        TE.mapLeft((e) => new TaskServiceError(e.message, { cause: e })),
      );
    },
    delete: (taskId: TaskId) => {
      pipe(
        taskRepository.delete(taskId),
        TE.mapLeft((e) => new TaskServiceError(e.message, { cause: e })),
      );
    },
  })),
  RTE.bindTo('taskService')
);
