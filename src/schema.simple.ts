import * as t from "io-ts";
import { NonEmptyString } from "io-ts-types";
import { Trim, unsafeMake } from "@/utils/schema";

export interface TaskIdBrand {
  readonly TaskId: unique symbol;
}

export const TaskId = t.brand(
  t.number,
  (n): n is t.Branded<number, TaskIdBrand> => t.number.is(n),
  "TaskId",
);

export type TaskId = t.TypeOf<typeof TaskId>;
export type TaskIdEncoded = t.OutputOf<typeof TaskId>;

export const makeTaskId = unsafeMake(TaskId);

export const Description = t.intersection([Trim, NonEmptyString]);
export type Description = t.TypeOf<typeof Description>;

export const makeDescription = unsafeMake(Description);

export const Status = t.keyof({
  todo: null,
  ["in-progress"]: null,
  done: null,
});
export type Status = t.TypeOf<typeof Status>;

export const Priority = t.keyof({
  low: null,
  medium: null,
  high: null,
});
export type Priority = t.TypeOf<typeof Priority>;
