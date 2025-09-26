import * as t from "io-ts";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as A from "fp-ts/Array";
import * as TE from "fp-ts/TaskEither";
import { pipe, flow } from "fp-ts/function";
import { Filesystem } from "./fs";
import { parseJson } from "./utils/json";
import * as Semigroup from "fp-ts/Semigroup";
import * as Eq from "fp-ts/Eq";
import * as N from "fp-ts/number";
import * as O from "fp-ts/Option";
import { ReaderResult } from "./utils/types";
import {
  Task,
  Env,
  decodeTasks,
  encodeTasks,
  Status,
  Description,
  InsertTask,
  TaskId,
} from "./schema";
import { Config } from "@/config";

export type Storage = { storage: ReaderResult<typeof FilesystemStorage> };

class StorageError extends Error {
  _tag = "StorageError";
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

const mergeToStorageError = (error: Error | t.Errors) => {
  if (error instanceof Error) return new StorageError(error.message, error);
  return new StorageError(error.map((v) => v.value).join(","), {
    cause: error,
  });
};

export const FilesystemStorage = pipe(
  RTE.Do,
  RTE.bind(
    "filesystem",
    flow(
      RTE.ask<Filesystem>,
      RTE.map((filesystem) => filesystem.filesystem),
    ),
  ),
  RTE.bindW(
    "config",
    flow(
      RTE.ask<Config>,
      RTE.map((config) => config.config),
    ),
  ),
  RTE.map(({ config, filesystem }) => {
    const writeTasks = flow(encodeTasks, JSON.stringify, (tasks) =>
      filesystem.writeFile(config.tasksFilepath, tasks),
    );

    const readTasks = pipe(
      filesystem.readFile(config.tasksFilepath),
      TE.flatMap(flow(parseJson, decodeTasks, TE.fromEither)),
    );

    const eqTask = Eq.contramap((task: Task) => task.id)(N.Eq);

    const eqTaskId = Eq.fromEquals<TaskId>((x, y) => x === y);

    const dropMatching = (taskId: TaskId) =>
      flow(A.filter<Task>((task) => !eqTaskId.equals(taskId, task.id)));

    const semigroupTask = Semigroup.struct<Task>({
      id: Semigroup.last<TaskId>(),
      description: Semigroup.last<Description>(),
      status: Semigroup.last<Status>(),
      createdAt: Semigroup.last<Date>(),
      updatedAt: Semigroup.last<Date>(),
    });

    const swapMatching = (task: Task, updated: Task) =>
      flow(
        A.map<Task, Task>((_task) =>
          eqTask.equals(task, _task)
            ? semigroupTask.concat(task, updated)
            : _task,
        ),
      );

    const findMatching = (id: TaskId) =>
      flow(A.findFirst<Task>((task) => eqTaskId.equals(task.id, id)));

    return {
      getAll() {
        return pipe(readTasks, TE.mapLeft(mergeToStorageError));
      },

      getById(id: TaskId) {
        return pipe(this.getAll(), TE.map(findMatching(id)));
      },

      insert(description: Description) {
        console.log("isert is working");
        return pipe(
          TE.Do,
          TE.bind("tasks", this.getAll),
          TE.let("taskId", ({ tasks }) =>
            pipe(
              A.last(tasks),
              O.map((task) => task.id + 1),
              O.getOrElse(() => 0),
            ),
          ),
          TE.bindW("task", ({ taskId }) =>
            pipe(
              Task.decode({
                id: taskId,
                description,
                status: "todo",
                createdAt: new Date(),
                updatedAt: new Date(),
              }),
              TE.fromEither,
            ),
          ),
          TE.map(({ tasks, task }) => A.append(task)(tasks)),
          TE.flatMap(writeTasks),
          TE.mapLeft(mergeToStorageError),
          TE.mapError((e) => new StorageError(e.message, { cause: e })),
        );
      },

      update(task: Task, newTask: Task) {
        return pipe(
          this.getAll(),
          TE.map(swapMatching(task, newTask)),
          TE.flatMap(writeTasks),
          TE.mapError((e) => new StorageError(e.message, { cause: e })),
        );
      },

      delete(taskId: TaskId) {
        return pipe(
          this.getAll(),
          TE.map(dropMatching(taskId)),
          TE.flatMap(writeTasks),
          TE.mapError((e) => new StorageError(e.message, { cause: e })),
        );
      },
    };
  }),
);
