import * as t from "io-ts";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as A from 'fp-ts/Array'
import * as TE from "fp-ts/TaskEither";
import { pipe, flow } from "fp-ts/function";
import { readFile, writeFile } from "./fs";
import { parseJson } from "./utils/json";
import * as Semigroup from 'fp-ts/Semigroup'
import * as Eq from 'fp-ts/Eq'
import * as N from 'fp-ts/number'
import * as O from 'fp-ts/Option'
import { ReaderResult } from './utils/types'
import { Task, Env, decodeTasks, encodeTasks, Status } from "./schema";
import { NonEmptyString } from './utils/schema'

// Not to define it myself 
export type Storage = ReaderResult<typeof FilesystemStorage>

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

export const FilesystemStorage = pipe(
  RTE.ask<Env>(),
  RTE.map(({ tasksFilepath }) => {

    const writeTasks = flow(
      encodeTasks,
      JSON.stringify,
      (tasks) => writeFile(tasksFilepath, tasks)
    )

    const readTasks = pipe(
      readFile(tasksFilepath),
      TE.flatMap(
        flow(
          parseJson,
          decodeTasks,
          TE.fromEither
        )
      )
    )

    const eqTask = Eq.contramap((task: Task) => task.id)(N.Eq)

    const dropMatching = (task: Task) => flow(
      A.filter<Task>(
        (_task) => !eqTask.equals(task, _task)
      )
    )

    const semigroupTask = Semigroup.struct<Task>({
      id: Semigroup.last<number>(),
      description: Semigroup.last<NonEmptyString>(),
      status: Semigroup.last<Status>(),
      createdAt: Semigroup.last<Date>(),
      updatedAt: Semigroup.last<Date>()
    })

    const swapMatching = (task: Task, updated: Task) => flow(
      A.map<Task, Task>(
        _task => eqTask.equals(task, _task)
          ? semigroupTask.concat(task, updated)
          : _task
      )
    )

    return {
      getAll() {

        return pipe(
          readTasks,
          TE.mapLeft(mergeToStorageError),
        )

      },

      add(task: Task) {

        return pipe(
          this.getAll(),
          TE.map(A.append(task)),
          TE.flatMap(writeTasks),
          TE.mapError((e) => new StorageError(e.message)),
        )

      },

      update(task: Task, updated: Task) {

        return pipe(
          this.getAll(),
          TE.map(swapMatching(task, updated)),
          TE.flatMap(writeTasks),
          TE.mapError((e) => new StorageError(e.message)),
        )

      },

      delete(task: Task) {

        return pipe(
          this.getAll(),
          TE.map(dropMatching(task)),
          TE.flatMap(writeTasks),
          TE.mapError((e) => new StorageError(e.message)),
        )

      }

    }
  }
  ))



