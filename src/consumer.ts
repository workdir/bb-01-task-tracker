import { flow, pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import { makeDescription, makeTaskId, Status, Priority } from "schema.simple";
import { Default } from "@/default";
import { makeTask, type Task } from "@/schema.compound";
import { type TaskRepository, FilesystemTaskRepository } from "@/task-repository";
import { Filesystem } from '@/fs'
import * as O from 'fp-ts/Option'
import { TaskService } from "./task-service";
import * as R from 'fp-ts/Record'
import * as RA from 'fp-ts/ReadonlyArray'
import * as P from 'fp-ts/Predicate'
import * as M from 'fp-ts/Monoid'
import * as Ord from 'fp-ts/Ord'
import * as Alg from '@/task.algebra'

type OrdKeys = Extract<keyof Task, "priority" | "status"> 
type OrdMap  = Record<OrdKeys, Ord.Ord<Task>> 

const ordMap: OrdMap = {
  priority: Alg.byStatus,
  status: Alg.byStatus
}

interface Options {
  where: {
    status: O.Option<Status>,
    priority: O.Option<Priority>
  },
  orderBy: Array<OrdKeys>
}

const Consumer = pipe(
  RTE.Do,
  RTE.bind("default", () => RTE.fromEither(Default)),
  RTE.bindW("deps", () => RTE.ask<TaskService>()),
  RTE.flatMap(({ deps: { taskService }, default: { logger } }) => {

    const getSomeValue = <T>(o: O.Some<T>) => o.value

    const options: Options = {
      where: {
        status: O.some("todo"),
        priority: O.none
      },
      orderBy: ["status"]
    }

    const where = pipe(
      [
        pipe(options.where.status, O.map(status => (task: Task) => task.status === status)),
        pipe(options.where.priority, O.map(priority => (task: Task) => task.priority === priority))
      ],
      RA.filter(O.isSome),
      RA.map(getSomeValue),
      M.concatAll(P.getMonoidAll<Task>())
    )

    const orderBy = pipe(
      options.orderBy, 
      RA.map(ord => R.lookup(ord)(ordMap)),
      RA.filter(O.isSome),
      RA.map(getSomeValue),
      M.concatAll(Ord.getMonoid<Task>())
    )

    return pipe(
      taskService.getAll({
        where,
        orderBy,
      }),
      //taskRepository.create(makeDescription("buy solana")),
      // taskRepository.getById(makeTaskId(2)),
    //  TE.flatMap(flow(
     //   O.map(task => {
      //    const updates = { ...task, description: makeDescription("buy bitcoin") }
       //   return pipe(
        //  taskRepository.update(task, updates),
        //  TE.as(updates)
         // )
        //}),
        //O.sequence(TE.ApplicativeSeq)
      //)),
   //   TE.flatMap(() => taskRepository.delete(makeTaskId(2))),
  //    TE.flatMap(taskRepository.getAll),
 //     TE.tapIO(flow(TasksFromJson.encode, JSON.stringify, logger.info)),
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
  //TE.flatMap(Consumer)
)

run().then(console.log).catch(console.log)


