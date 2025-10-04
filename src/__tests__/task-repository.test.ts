import * as fs from "node:fs/promises";
import * as A from "fp-ts/Array";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as IO from "fp-ts/IO";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import { afterAll, beforeAll, describe, expect, it, test } from "vitest";
import type { Config } from "@/config";
import type { Filesystem } from "@/fs";
import { FilesystemError } from "@/fs";
import type { Task } from "@/schema.compound";
import { makeTasks } from "@/schema.compound";
import {} from "@/schema.dto";
import { makeDescription, makeTaskId } from "@/schema.simple";
import type { TaskRepository } from "@/task-repository";
import { FilesystemTaskRepository } from "@/task-repository";

describe("TaskRepository", () => {
  const description = makeDescription("buy solana");

  const askForTaskRepository = pipe(
    RTE.ask<TaskRepository>(),
    RTE.map((taskRepository) => taskRepository.taskRepository),
  );

  test("Insert task", async () => {
    const result = await pipe(
      TE.Do,
      TE.bind("impl", () => InMemoryTaskRepository),
      TE.flatMap(({ impl }) =>
        pipe(
          askForTaskRepository,
          RTE.flatMap((taskRepository) =>
            pipe(
              taskRepository.create(description),
              TE.flatMap(taskRepository.getAll),
              RTE.fromTaskEither,
            ),
          ),
        )({ taskRepository: impl }),
      ),
    )();

    if (E.isLeft(result)) {
    }
    expect(E.isRight(result)).toBe(true);

    expect(
      pipe(
        result,
        E.map((task) => task[0].description),
      ),
    ).toStrictEqual(E.right(description));
  });

  test.only("Gets all tasks", async () => {
    const result = await pipe(
      TE.Do,
      TE.bind("impl", () => InMemoryTaskRepository),
      TE.flatMap(({ impl }) =>
        pipe(
          askForTaskRepository,
          RTE.flatMap((taskRepository) =>
            pipe(taskRepository.getAll(), RTE.fromTaskEither),
          ),
        )({ taskRepository: impl }),
      ),
    )();

    if (E.isRight(result)) {
      return;
    }

    console.log(result.left.cause);

    //    expect(E.isLeft(result)).toBe(true)
    //expect(E.isRight(result)).toBe(true);

    //const length = pipe(result, E.map(t => t.length))

    //expect(length).toStrictEqual(E.right(2));
  });
});

const TASKS_FILEPATH = "todos.json";

const InMemoryConfig: Config = {
  config: {
    tasksFilepath: TASKS_FILEPATH,
  },
};

const InMemoryFilesystem = () => {
  const tasks = makeTasks([
    {
      id: makeTaskId(1),
      description: makeDescription("buy bitcoin"),
      priority: "high",
      status: "todo",
      createdAt: new Date(),
      updatedAt: O.none,
    },
  ]);

  let filecontent = JSON.stringify(tasks);

  const updateFilecontent = (content: string) =>
    IO.of(() => {
      filecontent = content;
    });

  return {
    filesystem: {
      readFile: (_: string) => TE.of(filecontent),
      writeFile: (_: string, content: string) =>
        pipe(TE.of(undefined), TE.tapIO(updateFilecontent(content))),
    },
  } satisfies Filesystem;
};

const InMemoryTaskRepository = FilesystemTaskRepository({
  ...InMemoryConfig,
  ...InMemoryFilesystem(),
});
