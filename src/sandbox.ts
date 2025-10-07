import * as A from "fp-ts/Array";
import * as Console from "fp-ts/Console";
import * as Date from "fp-ts/Date";
import * as E from "fp-ts/Either";
import { apply, flow, pipe } from "fp-ts/function";
import { ap } from "fp-ts/Identity";
import * as IO from "fp-ts/IO";
import * as IOE from "fp-ts/IOEither";
import * as RA from "fp-ts/ReadonlyArray";
import * as S from "fp-ts/string";
import * as t from "io-ts";
import { PathReporter } from "io-ts/PathReporter";
import { Description } from "@/schema.simple";

const log = Console.log("log message");

const x = pipe(
  Date.create,
  IO.map((date) => date),
);

const date = x();

const User = t.type({
  name: t.string,
  surname: t.string.pipe(Description),
});

const program = pipe(
  E.Do,
  E.let("validations", () =>
    User.decode({
      name: 1,
      surname: "alles clar",
    }),
  ),
  E.map(({ validations }) => {
    pipe(
      validations,
      E.match(
        (errors) => {
          pipe(
            errors,
            A.mapWithIndex((i, error) => {
              const noMessage = error.message ? " " : " no ";
              //           console.log(`error nr: ${i+1}, of value: "${error.value}" with${noMessage}messge ${error.message ? error.message : ''}`)
              const head = `Invalid value ${error.value} supplied to`;

              const getContext = flow(
                RA.map<t.ContextEntry, string>(
                  (context) => `${context.key}: ${context.type.name}`,
                ),
                pipe(RA.intercalate<string>, apply(S.Monoid), apply("/")),
                //RA.intercalate(S.Monoid)('/')
              );
              console.log(`${head} ${getContext(error.context)}`);
              pipe(
                error.context,
                RA.mapWithIndex((_i, context) => {
                  //                console.log(`info nr: ${i}.${_i}, key: ${context.key}, ${JSON.stringify(context.actual)}`)
                  //console.log(context.type.name.replace(/\r\n|\n|\r/g, ' ').trim().toUpperCase())
                }),
              );
            }),
          );
        },
        () => {
          console.log(["No Errors"]);
        },
      ),
    );

    console.log(`--------------------------`);

    return Console.log(PathReporter.report(validations));
  }),
  //  IOE.fromEither
);

const run = pipe(
  program,
  E.mapLeft(E.toError),
  E.getOrElse((error) => Console.log(`failure ${error.message}`)),
);

run();
