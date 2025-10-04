import * as A from "fp-ts/Array";
import * as E from "fp-ts/Either";
import * as Eq from "fp-ts/Eq";
import { flow, identity, pipe } from "fp-ts/function";
import * as N from "fp-ts/number";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as Semigroup from "fp-ts/Semigroup";
import * as TE from "fp-ts/TaskEither";
import type * as t from "io-ts";
import { PathReporter } from "io-ts/PathReporter";
import type { Config } from "@/config";
import type { Filesystem } from "@/fs";
import { FilesystemError } from "@/fs";
import { makeTask, makeTasks, type Task } from "@/schema.compound";
import { TasksFromJson } from "@/schema.dto";
import type { Description, Priority, Status, TaskId } from "@/schema.simple";
import { decodeFromJson, encodeToJson } from "@/utils/json";
import type { ReaderResult } from "@/utils/types";

export type TaskRepository = {
  taskRepository: ReaderResult<typeof FilesystemTaskRepository>;
};

type Introspect = ReaderResult<typeof FilesystemTaskRepository>;

export class TaskRepositoryError extends Error {
  _tag = "TaskRepositoryError";
  constructor(
    message = "TaskRepositoryError default message",
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

const mergeToTaskRepositoryError = (error: Error | t.Errors) => {
  if (error instanceof Error)
    return new TaskRepositoryError(error.message, error);
  return new TaskRepositoryError(error.map((v) => v.value).join(","), {
    cause: error,
  });
};

const askForFilesystem = flow(
  RTE.ask<Filesystem>,
  RTE.map((filesystem) => filesystem.filesystem),
);

const askForConfig = flow(
  RTE.ask<Config>,
  RTE.map((config) => config.config),
);

export const FilesystemTaskRepository = pipe(
  RTE.Do,
  RTE.bindW("filesystem", askForFilesystem),
  RTE.bindW("config", askForConfig),
  RTE.map(({ config, filesystem }) => {
    const writeTasks = flow(
      encodeToJson(TasksFromJson),
      TE.fromEither,
      TE.flatMap((tasks) => filesystem.writeFile(config.tasksFilepath, tasks)),
    );

    const readTasks = pipe(
      filesystem.readFile(config.tasksFilepath),
      TE.flatMap(flow(decodeFromJson(TasksFromJson), TE.fromEither)),
    );

    const eqTask = Eq.contramap((task: Task) => task.id)(N.Eq);

    const eqTaskId = Eq.fromEquals<TaskId>((x, y) => x === y);

    const dropMatching = (taskId: TaskId) =>
      flow(A.filter<Task>((task) => !eqTaskId.equals(taskId, task.id)));

    const semigroupTask = Semigroup.struct<Task>({
      id: Semigroup.last<TaskId>(),
      description: Semigroup.last<Description>(),
      status: Semigroup.last<Status>(),
      priority: Semigroup.last<Priority>(),
      createdAt: Semigroup.last<Date>(),
      updatedAt: Semigroup.last<O.Option<Date>>(),
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

    const ensureFileWithDefault = <E>(error: E) =>
      pipe(
        error,
        TE.fromPredicate((error) => error instanceof FilesystemError, identity),
        TE.flatMap(() =>
          pipe(
            TE.Do,
            TE.let("initTasks", () => makeTasks([])),
            TE.flatMap(({ initTasks }) =>
              pipe(writeTasks(initTasks), TE.as(initTasks)),
            ),
          ),
        ),
      );

    return {
      getAll() {
        return pipe(
          readTasks,
          TE.orElse(ensureFileWithDefault),
          TE.mapLeft((e) => mergeToTaskRepositoryError(e)),
        );
      },

      getById(id: TaskId) {
        return pipe(this.getAll(), TE.map(findMatching(id)));
      },

      create(description: Description) {
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
          TE.let("task", ({ taskId: id }) =>
            makeTask({
              id,
              description,
              status: "todo",
              priority: "low",
              createdAt: new Date(),
              updatedAt: O.none,
            }),
          ),
          TE.map(({ tasks, task }) => A.append(task)(tasks)),
          TE.flatMap(writeTasks),
          TE.mapLeft(mergeToTaskRepositoryError),
        );
      },

      update(task: Task, newTask: Task) {
        return pipe(
          this.getAll(),
          TE.map(swapMatching(task, newTask)),
          TE.flatMap(writeTasks),
          TE.mapLeft(mergeToTaskRepositoryError),
        );
      },

      delete(taskId: TaskId) {
        return pipe(
          this.getAll(),
          TE.map(dropMatching(taskId)),
          TE.flatMap(writeTasks),
          TE.mapLeft(mergeToTaskRepositoryError),
        );
      },
    };
  }),
);
