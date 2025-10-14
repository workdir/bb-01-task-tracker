import { TaskRepository } from '@/task-repository'
import * as RTE from 'fp-ts/ReaderTaskEither'
import * as TE from 'fp-ts/TaskEither'
import { pipe, flow } from 'fp-ts/function'
import { makeDescription } from 'schema.simple'
import { Default } from '@/default'
import { TaskFromJson, TasksFromJson } from '@/schema.dto'
import { makeTask } from '@/schema.compound'

// create
// update
// delete
// getAll
// getById

const Consumer = pipe(
  RTE.Do,
  RTE.bindW('taskRepository', () => RTE.ask<TaskRepository>()),
  RTE.bind("default", () => RTE.fromEither(Default)),
  RTE.map(({ taskRepository: {taskRepository}, default: {logger}  }) => {
    pipe(
      taskRepository.create(makeDescription('buy solana')),
      TE.tapIO(flow(TaskFromJson.encode, JSON.stringify, logger.info)),
      TE.flatMap((task) => taskRepository.delete(task.id)),
      TE.flatMap(() => taskRepository.getAll()),
      TE.tapIO(flow(TasksFromJson.encode, JSON.stringify, logger.info)),
      TE.flatMap(() => taskRepository.create(makeDescription('buy solana'))),
      TE.flatMap(task => {
        const updates = makeTask({ ...task, status: "in-progress" })
        return pipe(taskRepository.update(task, updates), TE.as(updates))
      }),
      TE.tapIO(flow(TaskFromJson.encode, JSON.stringify, logger.info)),
      TE.flatMap((task) => taskRepository.getById(task.id))
    )
  })
)

