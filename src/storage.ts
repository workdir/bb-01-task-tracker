import * as t from "io-ts";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import { pipe, flow } from "fp-ts/function";
import { readFile, writeFile } from "./fs";
import { typesafeJsonParsing } from "./utils/json";
import { Task, Env } from "./schema";

export interface Storage {
  getAll: () => RTE.ReaderTaskEither<Env, StorageError, Array<Task>>;
  add: (task: Task) => RTE.ReaderTaskEither<Env, StorageError, void>;
}

class StorageError extends Error {
  constructor(message: string) {
    super(message);
  }
}

const mergeToStorageError = (error: Error | t.Errors) => {
  if (error instanceof Error) return new StorageError(error.message);
  return new StorageError(error.map((v) => v.value).join(","));
};

export class FilesystemStorage implements Storage {
  getAll() {
    return pipe(
      RTE.ask<Env>(),
      RTE.flatMap((env) =>
        pipe(
          readFile(env.tasksFilepath),
          TE.flatMap(flow(typesafeJsonParsing, TE.fromEither)),
          TE.flatMap(flow(t.array(Task).decode, TE.fromEither)),
          TE.mapLeft(mergeToStorageError),
          RTE.fromTaskEither
        )
      )
    );
  }
  add(task: Task) {
    return pipe(
      RTE.Do,
      RTE.bind("env", () => RTE.ask<Env>()),
      RTE.bind("tasks", this.getAll),
      RTE.flatMap(({ tasks, env }) =>
        pipe(
          writeFile(env.tasksFilepath, JSON.stringify([...tasks, task])),
          TE.mapError((e) => new StorageError(e.message)),
          RTE.fromTaskEither
        )
      )
    );
  }
}
