
import * as t from "io-ts";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import { pipe, flow } from "fp-ts/function";
import { readFile, writeFile } from "./fs";
import { parseJson } from "./utils/json";
import * as O from 'fp-ts/Option'
import  { ReaderResult } from './utils/types'
import { Task, Env } from "./schema";

// Not to define it myself 
export type Presentation = ReaderResult<typeof ConsolePresentation> 

class StorageError extends Error {
  _tag = "StorageError"
  constructor(message: string) {
    super(message);
  }
}

const mergeToStorageError = (error: Error | t.Errors) => {
  if (error instanceof Error) return new StorageError(error.message);
  return new StorageError(error.map((v) => v.value).join(","));
};

// we need to build an equality for task

export const ConsolePresentation = pipe(
  RTE.ask<Env>(),
  RTE.map((env) => ({
    getAll() {
      return pipe(
        readFile(env.tasksFilepath),
        TE.flatMap(flow(parseJson, TE.fromEither)),
        TE.flatMap(flow(t.array(Task).decode, TE.fromEither)),
        TE.mapLeft(mergeToStorageError),
      )
    },
    delete(id: number) {
      const x = pipe(
        this.getAll(),
        TE.map(( tasks) =>
          tasks
        )
      ) 
    },
    add(task: Task) {
      return pipe(
        TE.Do,
        TE.bind("tasks", this.getAll),
        TE.flatMap(({ tasks }) =>
          pipe(
            writeFile(env.tasksFilepath, JSON.stringify([...tasks, task])),
            TE.mapError((e) => new StorageError(e.message)),
          )
        )
      )
    }
  })
  ))

