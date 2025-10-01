
import * as A from "fp-ts/Array";
import * as E from "fp-ts/Either";
import * as Eq from "fp-ts/Eq";
import { flow, pipe } from "fp-ts/function";
import * as N from "fp-ts/number";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as Semigroup from "fp-ts/Semigroup";
import * as TE from "fp-ts/TaskEither";
import type * as t from "io-ts";
import { PathReporter } from "io-ts/PathReporter";
import type { Config } from "@/config";
import type { Filesystem } from "@/fs";
import {
  type Description,
  decodeTasks,
  encodeTasks,
  type Status,
  Task,
  type TaskId,
} from "@/schema";
import { parseJson } from "@/utils/json";
import type { ReaderResult } from "@/utils/types";
import { TaskRepository } from '@/task-repository'


export type TaskService = { taskRepository: ReaderResult<typeof TaskService> };

export class TaskServiceError extends Error {
  _tag = "TaskServiceError";
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

const askForTaskRepository = flow(
  RTE.ask<TaskRepository>,
  RTE.map((taskRepository) => taskRepository.taskRepository),
);

const TaskService = pipe(
  RTE.Do,
  RTE.bindW('taskRepository', askForTaskRepository),
  RTE.map(({ taskRepository }) => ({
    getAll: () => {
      taskRepository.getAll()
    },
    getById: (id: TaskId) => {
      taskRepository.getById(id)
    },
    create: (description: Description) => {
      taskRepository.create(description)
    },
    update: (task: Task, newTask: Task) => { 
      taskRepository.update(task, newTask)
    },
    delete: (taskId: TaskId) => {
      taskRepository.delete(taskId)
    }
  }))
)
