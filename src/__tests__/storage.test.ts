import * as fs from "node:fs/promises";
import * as A from "fp-ts/Array";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import type { NonEmptyString } from "io-ts-types";
import { afterAll, beforeAll, describe, expect, it, test } from "vitest";
import type { Filesystem } from "@/fs";
import { FilesystemError } from "@/fs";
import type { TaskEncoded, Description, Task } from "@/schema";
import { FilesystemStorage, Storage, StorageError } from "@/storage";
import { Config } from '@/config'
import * as RTE from 'fp-ts/ReaderTaskEither'

describe("FilesystemStorage", () => {
  const description = 'todo in this afternoon' as Description

  const askForStorage = pipe(
      RTE.ask<Storage>(),
      RTE.map(storage => storage.storage),
    )

  test("Insert task", async () => {
    const result = await pipe(
      TE.Do,
      TE.bind('impl', () => InMemoryFilesystemStorage),
      TE.flatMap(({ impl }) =>
        pipe(
          askForStorage,
          RTE.flatMap(storage =>
            pipe(
              storage.insert(description),
              TE.flatMap(storage.getAll),
              RTE.fromTaskEither
            )
          )
        )({ storage: impl })
      )
    )()
    if(E.isLeft(result)) {
      console.log(result.left)
    }
    expect(E.isRight(result)).toBe(true)

    expect(pipe(
      result,
      E.map(task => task[0].description)
    )).toStrictEqual(E.right(description))
  })

  test("Gets all tasks", async () => {
    const tasks = pipe(
      askForStorage,
      RTE.flatMap(storage => storage.getAll)
    )
  });
});


const TASKS_FILEPATH = 'todos.json';

const InMemoryConfig: Config = {
  config: {
    tasksFilepath: TASKS_FILEPATH
  } 
}

const InMemoryFilesystem = () => {
  const task: TaskEncoded = {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    description: "description",
    status: "in-progress",
    id: "1",
  }
  const tasks: string[] = [JSON.stringify(task)]

  return ({ filesystem: {
    readFile: (path: string) => 
      pipe(
        TE.of(JSON.stringify([tasks])),
        TE.flatMap(
          TE.fromPredicate(
            () => path === TASKS_FILEPATH,
            () => new FilesystemError('error')
          ))
      ),
    writeFile: (path: string, content: string) => pipe(
      TE.of(undefined),
      TE.tapIO(() => () => tasks.push(content)),
      TE.flatMap(
        TE.fromPredicate(
          () => path === TASKS_FILEPATH,
          () => new FilesystemError('error')
        ))
    )
  } } satisfies Filesystem)
}

const InMemoryFilesystemStorage = FilesystemStorage({
  ...InMemoryConfig,
  ...InMemoryFilesystem()
});
