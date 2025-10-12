import {
  DecodeFailed,
  defaultTo,
  Environment,
  keyOf,
  optional,
  string,
  type Variable,
  type VariableDecoder,
} from "@herp-inc/environmen-ts";
import { pipe } from "fp-ts/function";
import * as RE from "fp-ts/ReaderEither";
import type { LogLevelString } from "@/logger";
import type { EitherResult } from "./utils/types";

const jsonFileD: VariableDecoder<string> = pipe(
  RE.ask<Variable>(),
  RE.flatMap((variable) => {
    return variable.value.endsWith(".json")
      ? RE.of(variable.value)
      : RE.left(new DecodeFailed(variable, "must be a JSON file"));
  }),
);

const tasksFileD: VariableDecoder<string> = pipe(
  RE.sequenceArray([string({ allowEmpty: false }), jsonFileD]),
  RE.map(([value]) => value),
);

const DEFAULT_TASKS_FILEPATH = "tasks.json";

const tasksFilepathD = pipe(
  optional("TASKS_FILEPATH", tasksFileD),
  defaultTo(() => `${process.cwd()}/${DEFAULT_TASKS_FILEPATH}`),
);

const logLevelD = pipe(
  optional(
    "LOG_LEVEL",
    keyOf({
      ALL: null,
      DEBUG: null,
      INFO: null,
      WARN: null,
      ERROR: null,
      NONE: null,
    }),
  ),
  defaultTo<LogLevelString>(() => "INFO"),
);

const configD = pipe(
  RE.Do,
  RE.bind("tasksFilepath", () => tasksFilepathD),
  RE.bind("logLevel", () => logLevelD),
);

const env = new Environment(process.env);

export const config = configD(env);

export type Config = EitherResult<typeof config>;
