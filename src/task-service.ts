import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";

import { TaskId, Description } from '@/schema.simple'
import { Task } from '@/schema.compound'
import type { TaskRepository } from "@/task-repository";
import type { ReaderResult } from "@/utils/types";
import {  } from '@/task.algebra'
import { Filesystem } from '@/fs'

export type TaskService = ReaderResult<typeof TaskService> 

export class TaskServiceError extends Error {
  _tag = "TaskServiceError";
  constructor(message = "TaskServiceError default", options?: ErrorOptions) {
    super(message, options);
  }
}

export const TaskService = pipe(
  RTE.Do,
  RTE.bind("deps", RTE.ask<TaskRepository> ),
  RTE.map(({ deps: { taskRepository } }) => ({
    getAll: () => {
      return pipe(
        taskRepository.getAll(),
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
