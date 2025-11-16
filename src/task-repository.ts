import * as A from "fp-ts/Array";
import { apply, flow, identity, pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import { Default } from "@/default";
import { type Filesystem, FilesystemError, isPathNotFoundError } from "@/fs";
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

export const FilesystemTaskRepository = pipe(
  RTE.Do,
  RTE.bindW("default", () => RTE.fromEither(Default)),
  RTE.bindW("deps", RTE.ask<Filesystem>),
  RTE.map(({ default: { config, logger }, deps: { filesystem } }) => {
    const writeTasks = flow(
      encodeToJson(TasksFromJson),
      TE.fromEither,
      TE.flatMap((tasks) => filesystem.writeFile(config.tasksFilepath, tasks)),
    );

    const readTasks = pipe(
      filesystem.readFile(config.tasksFilepath),
      TE.flatMap(flow(decodeFromJson(TasksFromJson), TE.fromEither)),
    );

    const nextTaskId = flow(
      A.last<Task>,
      O.map((task) => task.id + 1),
      O.getOrElse(() => 0),
    );

    return {
      getAll() {
        return pipe(
          readTasks,
          TE.orElse(
            // ensureFileWithDefault
            flow(
              TE.fromPredicate(
                (error) =>
                  error instanceof FilesystemError &&
                  isPathNotFoundError(error.cause),
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
            ),
          ),
          TE.mapLeft((error) => {
            return Array.isArray(error)
              ? new TaskRepositoryError(stringifyValidationErrors(error))
              : new TaskRepositoryError(error.message, { cause: error });
          }),
          /*TE.tapIO((tasks) =>
            logger.info(
              `Task Repository: tasks loaded successfully! ${JSON.stringify(TasksFromJson.encode(tasks))}`,
            ),
          ),
          TE.tapError((error) =>
            pipe(logger.error(error.toString()), TE.fromIO),
          ),*/
        );
      },

      getById(id: TaskId) {
        return pipe(
          this.getAll(),
          TE.map(Alg.findById(id)),
          /* TE.tapIO(
            flow(
              O.match(
                () => logger.error(`No Task found for given id: ${id}`),
                (task) => logger.info(`task of id: ${task.id} has been found`),
              ),
            ),
          ),
          */
        );
      },

      create(description: Description) {
        return pipe(
          TE.Do,
          TE.bind("tasks", this.getAll),
          TE.let("taskId", ({ tasks }) => nextTaskId(tasks)),
          TE.let("task", ({ taskId: id }) => makeTask({ id, description })),
          TE.flatMap(({ tasks, task }) =>
            pipe(A.append(task), apply(tasks), writeTasks, TE.as(task)),
          ),
          TE.mapLeft((error) => {
            return Array.isArray(error)
              ? new TaskRepositoryError(stringifyValidationErrors(error), {
                  cause: error,
                })
              : new TaskRepositoryError(error.message, { cause: error });
          }),
        );
      },

      // not saysfied
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
          TE.Do,
          TE.bind("throwForNonexistantIds", () =>
            pipe(
              this.getById(taskId),
              TE.flatMap(
                TE.fromOption(
                  () =>
                    new Error(
                      `Cannot delete nonexistant task of ID: ${taskId}`,
                    ),
                ),
              ),
            ),
          ),
          TE.flatMap(this.getAll),
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
