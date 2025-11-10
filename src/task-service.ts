import * as A from "fp-ts/Array";
import { flow, pipe } from "fp-ts/function";
import type * as Ord from "fp-ts/Ord";
import type * as P from "fp-ts/Predicate";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import type { Task } from "@/schema.compound";
import type { Description, TaskId } from "@/schema.simple";
import type { TaskRepository } from "@/task-repository";
import type { ReaderResult } from "@/utils/types";

export type TaskService = ReaderResult<typeof TaskService>;

export class TaskServiceError extends Error {
  _tag = "TaskServiceError";
  constructor(message = "TaskServiceError default", options?: ErrorOptions) {
    super(message, options);
  }
}

interface Options {
  where: P.Predicate<Task>;
  orderBy: Ord.Ord<Task>;
}

export const TaskService = pipe(
  RTE.Do,
  RTE.bind("deps", RTE.ask<TaskRepository>),
  RTE.map(({ deps: { taskRepository } }) => ({
    getAll: (options: Options) => {
      const filter = A.filter(options.where);
      const sort = A.sort(options.orderBy);

      return pipe(
        taskRepository.getAll(),
        TE.map(flow(filter, sort)),
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
      return pipe(
        taskRepository.update(task, newTask),
        TE.mapLeft((e) => new TaskServiceError(e.message, { cause: e })),
      );
    },
    delete: (taskId: TaskId) => {
      return pipe(
        taskRepository.delete(taskId),
        TE.mapLeft((e) => new TaskServiceError(e.message, { cause: e })),
      );
    },
  })),
  RTE.bindTo("taskService"),
);
