import * as A from "fp-ts/Array";
import { apply, flow, identity, pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import { Default } from "@/default";
import type { Filesystem } from "@/fs";
import { FilesystemError } from "@/fs";
import { stringifyValidationErrors } from "@/PathReporter";
import { makeTask, makeTasks, type Task } from "@/schema.compound";
import { TasksFromJson } from "@/schema.dto";
import type { Description, TaskId } from "@/schema.simple";
import * as Alg from "@/task.algebra";
import { decodeFromJson, encodeToJson } from "@/utils/json";
import type { ReaderResult } from "@/utils/types";

export type TaskRepository = ReaderResult<typeof FilesystemTaskRepository>;

export class TaskRepositoryError extends Error {
  _tag = "TaskRepositoryError";
  constructor(
    message = "TaskRepositoryError default message",
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

const askForFilesystem = flow(
  RTE.ask<Filesystem>,
  RTE.map((filesystem) => filesystem.filesystem),
);

export const FilesystemTaskRepository = pipe(
  RTE.Do,
  RTE.bind("default", () => RTE.fromEither(Default)),
  RTE.bindW("filesystem", askForFilesystem),
  RTE.map(({ default: { config, logger }, filesystem }) => {
    const writeTasks = flow(
      encodeToJson(TasksFromJson),
      TE.fromEither,
      TE.flatMap((tasks) => filesystem.writeFile(config.tasksFilepath, tasks)),
    );

    const readTasks = pipe(
      filesystem.readFile(config.tasksFilepath),
      TE.flatMap(flow(decodeFromJson(TasksFromJson), TE.fromEither)),
    );

    const ensureFileWithDefault = flow(
      TE.fromPredicate(
        // it has to check for file Not found errors, current condition does not reflect given requirement.
        <E>(error: E) => error instanceof FilesystemError,
        identity,
      ),
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

    const getTaskId = flow(
      A.last<Task>,
      O.map((task) => task.id + 1),
      O.getOrElse(() => 0),
    );

    return {
      getAll() {
        return pipe(
          readTasks,
          TE.orElse(ensureFileWithDefault),
          TE.tapError((error) => pipe(logger.error(String(error)), TE.fromIO)),
          TE.mapLeft((error) => {
            return Array.isArray(error)
              ? new TaskRepositoryError(stringifyValidationErrors(error))
              : new TaskRepositoryError(error.message, { cause: error });
          }),
        );
      },

      getById(id: TaskId) {
        return pipe(this.getAll(), TE.map(Alg.findById(id)));
      },

      create(description: Description) {
        return pipe(
          TE.Do,
          TE.bind("tasks", this.getAll),
          TE.let("taskId", ({ tasks }) => getTaskId(tasks)),
          TE.let("task", ({ taskId: id }) =>
            // has to be shorter, to versboe rigth now
            makeTask({
              id,
              description,
              status: "todo",
              priority: "low",
              createdAt: new Date(),
              updatedAt: O.none,
            }),
          ),
          TE.flatMap(({ tasks, task }) =>
            pipe(A.append(task), apply(tasks), writeTasks, TE.as(task)),
          ),
          TE.mapLeft((error) => {
            return Array.isArray(error)
              ? new TaskRepositoryError(stringifyValidationErrors(error))
              : new TaskRepositoryError(error.message, { cause: error });
          }),
        );
      },

      update(task: Task, updates: Task) {
        return pipe(
          this.getAll(),
          TE.map(Alg.replace(task, Alg.update(task, updates))),
          TE.flatMap(writeTasks),
          TE.mapLeft((error) => {
            return Array.isArray(error)
              ? new TaskRepositoryError(stringifyValidationErrors(error))
              : new TaskRepositoryError(error.message, { cause: error });
          }),
        );
      },

      delete(taskId: TaskId) {
        return pipe(
          this.getAll(),
          TE.map(Alg.deleteById(taskId)),
          TE.flatMap(writeTasks),
          TE.mapLeft((error) => {
            return Array.isArray(error)
              ? new TaskRepositoryError(stringifyValidationErrors(error))
              : new TaskRepositoryError(error.message, { cause: error });
          }),
        );
      },
    };
  }),
  RTE.bindTo("taskRepository"),
);
