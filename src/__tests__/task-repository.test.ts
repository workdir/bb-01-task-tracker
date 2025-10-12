import * as fs from "node:fs/promises";
import * as A from "fp-ts/Array";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as IO from "fp-ts/IO";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import { afterAll, beforeAll, describe, expect, it, test } from "vitest";
import type { Filesystem } from "@/fs";
import { makeTask, makeTasks } from "@/schema.compound";
import { TaskFromJson, TasksFromJson } from "@/schema.dto";
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
        )(impl),
      ),
    )();

    expect(E.isRight(result)).toBe(true);
    pipe(
      result,
      E.map(tasks => {
        expect(tasks.length).toBe(2)
        expect(tasks[1].description).toBe(description)
      })
    )
  });

  test("Gets all tasks", async () => {
    const result = await pipe(
      TE.Do,
      TE.bind("impl", () => InMemoryTaskRepository),
      TE.flatMap(({ impl }) =>
        pipe(
          askForTaskRepository,
          RTE.flatMap((taskRepository) =>
            pipe(taskRepository.getAll(), RTE.fromTaskEither),
          ),
        )(impl),
      ),
    )();

    expect(E.isRight(result)).toBe(true)

    pipe(
      result,
      E.map(tasks => {
        expect(tasks.length).toBe(2)
        expect(tasks[0].id).toBe(1)
      })
    )
  });
});

const InMemoryFilesystem = () => {
  const task = TaskFromJson.encode(
    makeTask({
      id: makeTaskId(1),
      description: makeDescription("buy bitcoin"),
      priority: "high",
      status: "todo",
      createdAt: new Date(),
      updatedAt: O.none,
    }),
  );

  let filecontent = JSON.stringify(A.of(task));

  const updateFilecontent = (content: string) => IO.of((filecontent = content));

  const getFilecontent = () => {
    return filecontent;
  };

  return {
    filesystem: {
      readFile: (_: string) =>
        pipe(
          TE.Do,
          TE.let("freshFilecontent", getFilecontent),
          TE.map(({ freshFilecontent }) => freshFilecontent),
        ),
      writeFile: (_: string, content: string) =>
        pipe(
          TE.of(undefined),
          TE.tapIO(() => updateFilecontent(content)),
        ),
    },
  } satisfies Filesystem;
};

const InMemoryTaskRepository = FilesystemTaskRepository({
  ...InMemoryFilesystem(),
});
