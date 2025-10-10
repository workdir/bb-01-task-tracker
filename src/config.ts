import {
  DecodeFailed,
  defaultTo,
  Environment,
  optional,
  string,
  keyOf,
  type Variable,
  type VariableDecoder,
} from "@herp-inc/environmen-ts";
import { pipe } from "fp-ts/function";
import * as RE from "fp-ts/ReaderEither";
import type { EitherResult } from "./utils/types";
import type { Level as LogLevel } from '@/logger'
import * as E from 'fp-ts/Either'

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
    'LOG_LEVEL',
    keyOf({
      debug: null,
      info: null,
      warning: null,
      error: null,
    }),
  ),
  defaultTo<LogLevel>(() => 'info'),
);

const configD = pipe(
  RE.Do,
  RE.bind("tasksFilepath", () => tasksFilepathD),
  RE.bind("logLevel", () => logLevelD),
);

const env = new Environment(process.env);

export const config = pipe(configD(env), E.bindTo('config'));

export type Config = EitherResult<typeof config> 
