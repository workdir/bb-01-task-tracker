import * as t from "io-ts";
import {
  DateFromISOString,
  NonEmptyString,
  NumberFromString,
} from "./utils/schema";

const Status = t.union([
  t.literal("todo"),
  t.literal("in-progress"),
  t.literal("done"),
]);

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
