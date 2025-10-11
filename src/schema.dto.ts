import * as t from "io-ts";
import {
  DateFromISOString,
  NumberFromString,
  optionFromNullable,
} from "io-ts-types";
import { Task } from "@/schema.compound";
import { TaskId } from "@/schema.simple";

export const TaskFromJson = t.type({
  ...Task.props,
  id: NumberFromString.pipe(TaskId),
  createdAt: DateFromISOString,
  updatedAt: optionFromNullable(DateFromISOString),
});

export type TaskFromJson = t.TypeOf<typeof TaskFromJson>;
export type EncodedTaskFromJson = t.OutputOf<typeof TaskFromJson>;

export const TasksFromJson = t.array(TaskFromJson);
