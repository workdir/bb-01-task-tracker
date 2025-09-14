import * as t from "io-ts";

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

export type Status = t.TypeOf<typeof Status>

export const Task = t.type({
  id: NumberFromString,
  description: NonEmptyString,
  status: Status,
  createdAt: DateFromISOString,
  updatedAt: DateFromISOString,
});

const Tasks = t.array(Task)
export const decodeTasks = Tasks.decode
export const encodeTasks = Tasks.encode

export type Task = t.TypeOf<typeof Task>;

export const Env = t.type({
  tasksFilepath: NonEmptyString,
});

export type Env = t.TypeOf<typeof Env>;
