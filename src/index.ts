import * as A from "fp-ts/Array";
import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import { Commands, Task } from "./schema.compound";
import { stringifyValidationErrors } from '@/PathReporter'
import { TaskService } from '@/task-service'
import { Default } from '@/default'
import { FilesystemTaskRepository } from '@/task-repository'
import { parseJson, decodeFromJson, encodeToJson } from '@/utils/json'
import { makeTaskId, Description } from '@/schema.simple'
import { Filesystem } from '@/fs'
import * as P from 'fp-ts/Predicate'
import * as Ord from 'fp-ts/Ord'
import * as O from 'fp-ts/Option'

const taskFilterMonoid = P.getMonoidAll<Task>();
const taskOrderMonoid = Ord.getMonoid<Task>();

const askForTaskService = () => pipe(
  RTE.ask<TaskService>(),
  RTE.map((taskService) => taskService.taskService)
)

const app = pipe(
  RTE.Do,
  RTE.let("args", () => pipe(process.argv, A.dropLeft(2))),
  RTE.bindW("default", () => RTE.fromEither(Default)),
  RTE.bindW('taskService', askForTaskService),
  RTE.flatMap(({ args, taskService, default: { logger } }) => { return pipe(
      Commands.decode(args),
      TE.fromEither,
      TE.map((args) => {
        const [command] = args;
        switch (command) {
          case "add": {
            const description = args[1];
            pipe(
              taskService.create(description),
              TE.tapIO((task) => logger.info(JSON.stringify(Task.encode(task))))
             )().then(console.log)
            break;
          }
          case "update": {
            const id = args[1]
            const description = args[2]
            const result = pipe(
              taskService.getById(id),
              TE.flatMap(task =>
                pipe(
                  task,
                  O.map(task => taskService.update(task, { ...task, description })),
                  O.sequence(TE.ApplicativeSeq),
                )
              ),
              TE.map(task => {
                pipe(
                  task,
                  O.match(
                    () => console.log(`id does not exists`),
                    () => console.log(`status changed sucesfully`)
                  )
                )
              })
            )

            result().then(console.log).catch(console.error)
            break;
          }
          case "delete":
            pipe(
              taskService.delete(makeTaskId(0))
             )().then(console.log)
            break;
          case "list": {
            const status = args[1]
            const filter = pipe(
              status,
              O.map(status => (task: Task) => task.status === status),
              O.getOrElse(() => taskFilterMonoid.empty)
            )

            pipe(
              taskService.getAll({
                where: filter,
                orderBy: taskOrderMonoid.empty
              })
             )().then(console.log)
            break;
          }
          case "mark-in-progress": {
            const id = args[1]
            const result = pipe(
              taskService.getById(id),
              TE.flatMap(task =>
                pipe(
                  task,
                  O.map(task => taskService.update(task, { ...task, status: "in-progress" })),
                  O.sequence(TE.ApplicativeSeq),
                )
              ),
              TE.map(task => {
                pipe(
                  task,
                  O.match(
                    () => console.log(`id does not exists`),
                    () => console.log(`status changed sucesfully`)
                  )
                )
              })
            )

            result().then(console.log).catch(console.error)
            break;
          }
          case "mark-done":
            const id = args[1]
            const result = pipe(
              taskService.getById(id),
              TE.flatMap(task =>
                pipe(
                  task,
                  O.map(task => taskService.update(task, { ...task, status: "done" })),
                  O.sequence(TE.ApplicativeSeq),
                )
              ),
              TE.map(task => {
                pipe(
                  task,
                  O.match(
                    () => console.log(`id does not exists`),
                    () => console.log(`status changed sucesfully`)
                  )
                )
              })
            )

            result().then(console.log).catch(console.error)
            break;
        }
      }),
      RTE.fromTaskEither,
    );
  }),
);

const run = pipe(
  FilesystemTaskRepository({ filesystem: Filesystem }),
  TE.flatMap((taskRepository) => TaskService(taskRepository)),
  TE.flatMap(app),
  TE.orElse((errors) => {
    if (Array.isArray(errors)) {
      return TE.right(console.log(stringifyValidationErrors(errors)))
    } else {
      return TE.right(console.log('EnvError'))
    }
  })
)

run().then(console.log).catch(console.error)


interface Command {
  execute: () => void
}

class AddTaskCommand implements Command {
  private description: Description
  // a.k.a receiver
  private taskService: TaskService

  constructor(taskService: TaskService, description: Description) {
    this.description = description 
    this.taskService = taskService
  }

  execute() {
    this.taskService.taskService.create(this.description)
  }
}

