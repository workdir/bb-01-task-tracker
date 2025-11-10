import * as fs from "node:fs/promises";
import * as A from "fp-ts/Array";
import * as E from "fp-ts/Either";
import { flow, pipe } from "fp-ts/function";
import * as IO from "fp-ts/IO";
import * as O from "fp-ts/Option";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "vitest";
import type { Filesystem } from "@/fs";
import { makeTask } from "@/schema.compound";
import { TaskFromJson, TasksFromJson } from "@/schema.dto";
import { makeDescription, makeTaskId } from "@/schema.simple";
import type { TaskRepository } from "@/task-repository";
import { FilesystemTaskRepository } from "@/task-repository";
import { parseJson } from "@/utils/json";

describe("TaskRepository", () => {
  const askForTaskRepository = pipe(
    RTE.ask<TaskRepository>(),
    RTE.map((taskRepository) => taskRepository.taskRepository),
  );

  describe("Task Creation", () => {
    const description = makeDescription("buy solana");
    const descriptionB = makeDescription("buy bitcoin");

    afterEach(() => {
      filecontent = "[]";
    });

    test("Create Single", async () => {
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
        E.map((tasks) => {
          expect(tasks.length).toBe(1);
          expect(tasks[0].description).toBe(description);
        }),
      );
    });

    test("Create Many", async () => {
      const result = await pipe(
        TE.Do,
        TE.bind("impl", () => InMemoryTaskRepository),
        TE.flatMap(({ impl }) =>
          pipe(
            askForTaskRepository,
            RTE.flatMap((taskRepository) =>
              pipe(
                taskRepository.create(description),
                TE.flatMap(() => taskRepository.create(descriptionB)),
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
        E.map((tasks) => {
          expect(tasks.length).toBe(2);
          expect(tasks[0].description).toBe(description);
          expect(tasks[1].description).toBe(descriptionB);
        }),
      );
    });
  });

  describe("Task Retrieval", () => {
    const descriptions = [
      makeDescription("buy bitcoin"),
      makeDescription("buy solana"),
    ];
    const ids = [makeTaskId(1), makeTaskId(2)];

    beforeAll(() => {
      filecontent = pipe(
        A.zip(ids, descriptions),
        A.map(([id, description]) =>
          pipe(
            makeTask({
              id: id,
              description: description,
              priority: "high",
              status: "todo",
              createdAt: new Date(),
              updatedAt: O.none,
            }),
            TaskFromJson.encode,
          ),
        ),
        JSON.stringify,
      );
    });

    test("GetAll", async () => {
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

      expect(E.isRight(result)).toBe(true);

      pipe(
        result,
        E.map((tasks) => {
          expect(tasks.length).toBe(2);
          expect(tasks[0].id).toBe(1);
          expect(tasks[1].description).toBe(descriptions[1]);
        }),
      );
    });

    test("GetById", async () => {
      const result = await pipe(
        TE.Do,
        TE.bind("impl", () => InMemoryTaskRepository),
        TE.flatMap(({ impl }) =>
          pipe(
            askForTaskRepository,
            RTE.flatMap((taskRepository) =>
              pipe(taskRepository.getById(ids[1]), RTE.fromTaskEither),
            ),
          )(impl),
        ),
      )();

      expect(E.isRight(result)).toBe(true);

      pipe(
        result,
        E.map((task) => {
          expect(O.isSome(task)).toBe(true);
          pipe(
            task,
            O.map((task) => {
              expect(task.id).toBe(ids[1]);
              expect(task.description).toBe(descriptions[1]);
            }),
          );
        }),
      );
    });
  });

  describe("Task Upsert", () => {
    const descriptions = [
      makeDescription("buy bitcoin"),
      makeDescription("buy solana"),
    ];
    const updatedDescription = makeDescription("buy nvidia");
    const ids = [makeTaskId(1), makeTaskId(2)];

    beforeEach(() => {
      filecontent = pipe(
        A.zip(ids, descriptions),
        A.map(([id, description]) =>
          pipe(
            makeTask({
              id: id,
              description: description,
              priority: "high",
              status: "todo",
              createdAt: new Date(),
              updatedAt: O.none,
            }),
            TaskFromJson.encode,
          ),
        ),
        JSON.stringify,
      );
    });

    test("Task Deletion", async () => {
      const result = await pipe(
        TE.Do,
        TE.bind("impl", () => InMemoryTaskRepository),
        TE.flatMap(({ impl }) =>
          pipe(
            askForTaskRepository,
            RTE.flatMap((taskRepository) =>
              pipe(taskRepository.delete(ids[0]), RTE.fromTaskEither),
            ),
          )(impl),
        ),
      )();

      expect(E.isRight(result)).toBe(true);

      pipe(
        filecontent,
        parseJson,
        E.flatMap(TasksFromJson.decode),
        E.map((tasks) => {
          expect(A.size(tasks)).toBe(1);
          expect(tasks[0].description).toBe(descriptions[1]);
        }),
      );
    });

    test("Task Deletion over non existant Id throws", async () => {
      const result = await pipe(
        TE.Do,
        TE.bind("impl", () => InMemoryTaskRepository),
        TE.flatMap(({ impl }) =>
          pipe(
            askForTaskRepository,
            RTE.flatMap((taskRepository) =>
              pipe(taskRepository.delete(makeTaskId(3)), RTE.fromTaskEither),
            ),
          )(impl),
        ),
      )();

      expect(E.isLeft(result)).toBe(true);
      expect(
        pipe(
          result,
          E.mapLeft((error) =>
            expect(error.message).toContain("Cannot delete nonexistant task"),
          ),
        ),
      );
    });

    test("Task Modification", async () => {
      const result = await pipe(
        TE.Do,
        TE.bind("impl", () => InMemoryTaskRepository),
        TE.flatMap(({ impl }) =>
          pipe(
            askForTaskRepository,
            RTE.flatMap((taskRepository) =>
              pipe(
                taskRepository.getById(ids[1]),
                TE.flatMap(
                  flow(
                    O.map((task) => {
                      const updates = {
                        ...task,
                        description: updatedDescription,
                      };
                      return pipe(
                        taskRepository.update(task, updates),
                        TE.as(updates),
                      );
                    }),
                    O.sequence(TE.ApplicativeSeq),
                  ),
                ),
                RTE.fromTaskEither,
              ),
            ),
          )(impl),
        ),
      )();

      expect(E.isRight(result)).toBe(true);
      pipe(
        result,
        E.map((task) => {
          expect(O.isSome(task)).toBe(true);
          expect(
            pipe(
              task,
              O.map((task) => {
                expect(task.description).toBe(updatedDescription);
              }),
            ),
          );
        }),
      );
    });
  });
});

let filecontent = "[]";
const InMemoryFilesystem = () => {
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
