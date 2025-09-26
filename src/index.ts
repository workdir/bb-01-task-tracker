import { pipe } from "fp-ts/function";
import * as E from "fp-ts/Either";
import { TaskTracker } from "./task-tracker";
import { FilesystemStorage } from "./storage";
import { ConsolePresentation } from "./presentation";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as A from "fp-ts/Array";
import { Commands } from "./schema";
import * as TE from "fp-ts/TaskEither";
import * as O from "fp-ts/Option";
import { PathReporter } from "io-ts/PathReporter";
import { Trim } from "./utils/schema";
import { NonEmptyString } from "io-ts-types";
import * as S from "fp-ts/string";

const application = pipe(
  RTE.Do,
  RTE.let("args", () => pipe(process.argv, A.dropLeft(2))),
  RTE.bind("taskTracker", RTE.ask<TaskTracker>),
  RTE.flatMap(({ args, taskTracker }) => {
    return pipe(
      Commands.decode(args),

      TE.fromEither,
      TE.map((args) => {
        const [command] = args;
        switch (command) {
          case "add":
            console.log(`add works`);
            const result = taskTracker.add(args[1])();
            break;
          case "update":
            taskTracker.update(args[1], { description: args[2] });
            break;
          case "delete":
            taskTracker.delete(args[1]);
            break;
          case "list":
            taskTracker.list();
            break;
          case "mark-in-progress":
            taskTracker.update(args[1], { status: "in-progress" });
            break;
          case "mark-done":
            taskTracker.update(args[1], { status: "done" });
            break;
        }
      }),
      RTE.fromTaskEither,
    );
  }),
);

const run = pipe(
  TE.Do,
  TE.bind("storage", () =>
    pipe(
      NonEmptyString.decode(`${process.cwd()}/tasks.json`),
      TE.fromEither,
      TE.flatMap((tasksFilepath) => FilesystemStorage({ tasksFilepath })),
    ),
  ),
  TE.bindW("taskTracker", ({ storage }) => TaskTracker(storage)),
  TE.flatMap(({ taskTracker }) => application(taskTracker)),
);

run()
  .then(console.log)
  .catch(console.error)
  .finally(() => {
    console.log("end of execusion");
  });
