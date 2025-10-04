import * as t from "io-ts";
import { date, option } from "io-ts-types";
import { Description, Priority, Status, TaskId } from "@/schema.simple";
import { unsafeMake } from "@/utils/schema";

export const Task = t.type({
  id: TaskId,
  description: Description,
  status: Status,
  priority: Priority,
  createdAt: date,
  updatedAt: option(date),
});

export type Task = t.TypeOf<typeof Task>;
export const makeTask = unsafeMake(Task);
export const makeTasks = unsafeMake(t.array(Task));
