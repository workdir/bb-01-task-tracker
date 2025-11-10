import * as O from "fp-ts/Option";
import * as t from "io-ts";
import {
  date,
  NumberFromString,
  option,
  optionFromNullable,
} from "io-ts-types";
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
export type TaskEncoded = t.OutputOf<typeof Task>;
export const makeTasks = unsafeMake(t.array(Task));
export const makeTask = (
  task: Pick<TaskEncoded, "description" | "id"> &
    Partial<Omit<TaskEncoded, "description" | "id">>,
) =>
  unsafeMake(Task)({
    createdAt: new Date(),
    updatedAt: O.none,
    priority: "low",
    status: "todo",
    ...task,
  });

const AddCommand = t.tuple([t.literal("add"), Description]);
const UpdateCommand = t.tuple([
  t.literal("update"),
  NumberFromString.pipe(TaskId),
  Description,
]);
const DeleteCommand = t.tuple([
  t.literal("delete"),
  NumberFromString.pipe(TaskId),
]);
const ListCommand = t.tuple([t.literal("list"), optionFromNullable(Status)]);
const MarkInProgressCommand = t.tuple([
  t.literal("mark-in-progress"),
  NumberFromString.pipe(TaskId),
]);
const MarkDoneCommand = t.tuple([
  t.literal("mark-done"),
  NumberFromString.pipe(TaskId),
]);

export const Commands = t.union([
  AddCommand,
  UpdateCommand,
  DeleteCommand,
  ListCommand,
  MarkInProgressCommand,
  MarkDoneCommand,
]);

export type Commands = t.TypeOf<typeof Commands>;
