import { flow, pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import { makeDescription } from "schema.simple";
import { Default } from "@/default";
import { makeTask } from "@/schema.compound";
import { TaskFromJson, TasksFromJson } from "@/schema.dto";
import { type TaskRepository, FilesystemTaskRepository } from "@/task-repository";
import { Filesystem } from '@/fs'
import * as Sem from 'fp-ts/Semigroup'

// create
// update
// delete
// getAll
// getById

interface Printer {
  printer: {
    print: string
  }
}

const Consumer = pipe(
  RTE.Do,
  RTE.bind("default", () => RTE.fromEither(Default)),
  RTE.bindW("deps", () => RTE.ask<TaskRepository & Printer>()),
  RTE.map(({ deps: { taskRepository, printer }, default: { logger } }) => {
    pipe(
      taskRepository.create(makeDescription("buy solana")),
      TE.tapIO(flow(TaskFromJson.encode, JSON.stringify, logger.info)),
      TE.flatMap((task) => taskRepository.delete(task.id)),
      TE.flatMap(() => taskRepository.getAll()),
      TE.tapIO(flow(TasksFromJson.encode, JSON.stringify, logger.info)),
      TE.flatMap(() => taskRepository.create(makeDescription("buy solana"))),
      TE.flatMap((task) => {
        const updates = makeTask({ ...task, status: "in-progress" });
        return pipe(taskRepository.update(task, updates), TE.as(updates));
      }),
      TE.tapIO(flow(TaskFromJson.encode, JSON.stringify, logger.info)),
      TE.flatMap((task) => taskRepository.getById(task.id)),
    );
  }),
);


