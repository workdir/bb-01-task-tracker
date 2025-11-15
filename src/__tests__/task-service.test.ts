import { describe, test, afterEach, expect, beforeAll } from 'vitest'
import * as IO from 'fp-ts/IO'
import * as TE from 'fp-ts/TaskEither'
import * as RTE from 'fp-ts/ReaderTaskEither'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import { Filesystem } from '@/fs'
import { TaskService } from '@/task-service'
import { FilesystemTaskRepository } from '@/task-repository'
import { makeTask, Task } from '@/schema.compound'
import { makeDescription, makeTaskId } from '@/schema.simple'
import { TaskFromJson, TasksFromJson } from '@/schema.dto'
import * as Ord from 'fp-ts/Ord'

describe("TaskService", () => {
  const askForTaskService = pipe(
    RTE.ask<TaskService>(),
    RTE.map((taskService) => taskService.taskService)
  )

  describe("Task Creation", () => {
    const description = makeDescription("buy solana");
    const descriptionB = makeDescription("buy bitcoin");

    afterEach(() => {
      filecontent = "[]";
    });

    test("Create Single", async () => {
      const result = await pipe(
        TE.Do,
        TE.bind('impl', () => InMemoryTaskService),
        TE.flatMap(({ impl }) =>
          pipe(
            askForTaskService,
            RTE.flatMap((taskService) =>
              pipe(
                taskService.create(description),
                RTE.fromTaskEither
              )
            )
          )(impl)
        )
      )()

      expect(E.isRight(result))
    })
  })

  describe("Task Retrieval", () => {

    const doneDescription = makeDescription('buy bitcoin')
    const taskTodo = makeTask({
      description: makeDescription('buy solana'),
      id: makeTaskId(1)
    })

    const taskInProgress = makeTask({
      description: makeDescription('buy shiba'),
      id: makeTaskId(2),
      status: "in-progress"
    })

    const taskDone = makeTask({
      description: doneDescription,
      id: makeTaskId(3),
      status: "done"
    }) 

    beforeAll(() => {
      filecontent = pipe(
        [taskTodo, taskInProgress, taskDone],
        TasksFromJson.encode,
        JSON.stringify,
      );
    })

    test("returns only tasks with status 'done'", async () => {
      const result = await pipe(
        TE.Do,
        TE.bind("impl", () => InMemoryTaskService),
        TE.flatMap(({ impl }) =>
          pipe(
            askForTaskService,
            RTE.flatMap((taskService) =>
              pipe(taskService.getAll({
                where: (task: Task) => task.status === "done",
                orderBy: Ord.getMonoid<Task>().empty
              }), RTE.fromTaskEither),
            ),
          )(impl),
        ),
      )();

      pipe(result, E.map((tasks) => {
        expect(tasks.length).toBe(1)
        expect(tasks[0].description).toBe(doneDescription)
      }))
    })
  })
})


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

const InMemoryTaskService = pipe(
  InMemoryTaskRepository,
  TE.flatMap(TaskService)
)


