import * as t from "io-ts";
import * as G from 'io-ts/Guard'
import * as S from 'io-ts/Schema'

import {
  DateFromISOString,
  NonEmptyString,
  NumberFromString,
} from "./utils/schema";

const Status = t.keyof({
  todo: null,
  ['in-progress']: null,
  done: null,
});

export const Task = t.type({
  id: NumberFromString,
  description: NonEmptyString,
  status: Status,
  createdAt: DateFromISOString,
  updatedAt: DateFromISOString,
});

export type Task = t.TypeOf<typeof Task>;

export const Env = t.type({
  tasksFilepath: NonEmptyString,
});

export type Env = t.TypeOf<typeof Env>;
