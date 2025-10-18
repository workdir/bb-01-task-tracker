import { flow, pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import { makeDescription, makeTaskId } from "schema.simple";
import { Default } from "@/default";
import { makeTask } from "@/schema.compound";
import { TaskFromJson, TasksFromJson } from "@/schema.dto";
import { type TaskRepository, FilesystemTaskRepository } from "@/task-repository";
import { Filesystem } from '@/fs'
import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'


//      taskRepository.create(makeDescription("buy solana"),
const Consumer = pipe(
  RTE.Do,
  RTE.bind("default", () => RTE.fromEither(Default)),
  RTE.bindW("deps", () => RTE.ask<TaskRepository>()),
  RTE.flatMap(({ deps: { taskRepository }, default: { logger } }) => {
    return pipe(
      //taskRepository.create(makeDescription("buy solana")),
      taskRepository.getById(makeTaskId(2)),
      TE.flatMap(flow(
        O.map(task => {
          const updates = { ...task, description: makeDescription("buy bitcoin") }
          return pipe(
          taskRepository.update(task, updates),
          TE.as(updates)
          )
        }),
        O.sequence(TE.ApplicativeSeq)
      )),
      TE.flatMap(() => taskRepository.delete(makeTaskId(2))),
      TE.flatMap(taskRepository.getAll),
      TE.tapIO(flow(TasksFromJson.encode, JSON.stringify, logger.info)),
      RTE.fromTaskEither
  //  TE.tapIO(flow(TaskFromJson.encode, JSON.stringify, logger.info)),
 //  TE.flatMap((task) => taskRepository.delete(task.id)),
// TE.flatMap(() => taskRepository.getAll()),
 // TE.tapIO(flow(TasksFromJson.encode, JSON.stringify, logger.info)),
  //  TE.flatMap(() => taskRepository.create(makeDescription("buy solana"))),
   //  TE.flatMap((task) => {
   //    const updates = makeTask({ ...task, status: "in-progress" });
   //     return pipe(taskRepository.update(task, updates), TE.as(updates));
  //    }),
 //     TE.tapIO(flow(TaskFromJson.encode, JSON.stringify, logger.info)),
//      TE.flatMap((task) => taskRepository.getById(task.id)),
    );
  }),
);

const run = pipe(
  FilesystemTaskRepository({ filesystem: Filesystem }),
  TE.flatMap(Consumer)
)

run().then(console.log).catch(console.log)


