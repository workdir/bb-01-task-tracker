import { pipe, flow } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as O from "fp-ts/Option";
import { PathReporter } from "io-ts/PathReporter";

import { Storage } from "./storage";
import { ReaderResult } from "./utils/types";
import { Task, Description, TaskId, Status } from "./schema";

export type TaskTracker = ReaderResult<typeof TaskTracker>;

export const TaskTracker = pipe(
  RTE.Do,
  RTE.bind(
    "storage",
    flow(
      RTE.ask<Storage>,
      RTE.map((storage) => storage.storage),
    ),
  ),
  RTE.map(({ storage }) => {
    return {
      add(description: Description) {
        return pipe(storage.insert(description), TE.flatMap(this.list));
      },

      delete(id: TaskId) {
        return pipe(storage.delete(id), TE.flatMap(this.list));
      },

      update(
        id: TaskId,
        updates: { description?: Description; status?: Status },
      ) {
        return (
          pipe(
            storage.getById(id),
            TE.map(
              flow(
                O.map((task) => {
                  const newTask = {
                    ...task,
                    description: updates.description ?? task.description,
                    // Typescript doesn't differentiate Status from string / lack of brand on Status
                    status: (updates.status ?? task.status) as Status,
                  };
                  pipe(storage.update(task, newTask), TE.map(console.log));
                }),
                O.getOrElse(() => {
                  console.log(`task with given ${id} doesn't exists`);
                }),
              ),
            ),
          ),
          TE.map(this.list)
        );
      },

      list() {
        return pipe(
          storage.getAll(),
          TE.tapIO((tasks) => () => {
            console.log(tasks);
          }),
        );
      },
    };
  }),
);
