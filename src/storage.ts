import * as t from "io-ts";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import { pipe, flow } from "fp-ts/function";
import { readFile, writeFile } from "./fs";
import { typesafeJsonParsing } from "./utils/json";
import * as O from 'fp-ts/Option'
import { Task, Env } from "./schema";

class FilesystemStorageError extends Error {
  _tag = "FilesystemStorageError"
  constructor(message: string) {
    super(message);
  }
}

const mergeToFilesystemStorageError = (error: Error | t.Errors) => {
  if (error instanceof Error) return new FilesystemStorageError(error.message);
  return new FilesystemStorageError(error.map((v) => v.value).join(","));
};

export const FilesystemStorage = pipe(
  RTE.ask<Env>(),
  RTE.map((env) => ({
    getAll() {
      return pipe(
        readFile(env.tasksFilepath),
        TE.flatMap(flow(typesafeJsonParsing, TE.fromEither)),
        TE.flatMap(flow(t.array(Task).decode, TE.fromEither)),
        TE.mapLeft(mergeToFilesystemStorageError),
      )
    },
    add(task: Task) {
      return pipe(
        TE.Do,
        TE.bind("tasks", this.getAll),
        TE.flatMap(({ tasks }) =>
          pipe(
            writeFile(env.tasksFilepath, JSON.stringify([...tasks, task])),
            TE.mapError((e) => new FilesystemStorageError(e.message)),
          )
        )
      )
    }
  })
  ))
