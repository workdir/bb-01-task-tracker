import * as A from "fp-ts/Array";
import { pipe } from "fp-ts/function";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import { Commands } from "./schema";

const app = pipe(
  RTE.Do,
  RTE.let("args", () => pipe(process.argv, A.dropLeft(2))),
  RTE.flatMap(({ args }) => {
    return pipe(
      Commands.decode(args),
      TE.fromEither,
      TE.map((args) => {
        const [command] = args;
        switch (command) {
          case "add": {
            const x = args[0];
            const y = args[1];
            break;
          }
          case "update":
            break;
          case "delete":
            break;
          case "list":
            break;
          case "mark-in-progress":
            break;
          case "mark-done":
            break;
        }
      }),
      RTE.fromTaskEither,
    );
  }),
);
