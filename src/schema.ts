import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as t from "io-ts";
import { PathReporter } from "io-ts/PathReporter";
import {
  DateFromISOString,
  NonEmptyString,
  NumberFromString,
 optionFromNullable,
  date
} from "io-ts-types";
import { Trim } from "./utils/schema";


// Domain data
export interface TaskIdBrand {
  readonly TaskId: unique symbol;
}

const TaskId = t.brand(
  t.number,
  (n): n is t.Branded<number, TaskIdBrand> => t.number.is(n),
  "TaskId",
);

export type TaskId = t.TypeOf<typeof TaskId>;
export type TaskIdEncoded = t.OutputOf<typeof TaskId>;

export const makeTaskId = (n: TaskIdEncoded) =>
  pipe(
    TaskId.decode(n),
    E.getOrElseW((errors) => {
      throw new Error(PathReporter.report(E.left(errors)).join(","));
    }),
  );

export interface DescriptionBrand {
  readonly Description: unique symbol;
}

const DescriptionC = t.brand(
  t.string,
  (s): s is t.Branded<string, DescriptionBrand> => t.string.is(s),
  "Description",
);

export const Description = t.intersection([Trim, NonEmptyString, DescriptionC]);

export type Description = t.TypeOf<typeof Description>;

export type DescriptionEncoded = t.OutputOf<typeof Description>;

export const makeDescription = (n: DescriptionEncoded) =>
  pipe(
    Description.decode(n),
    E.getOrElseW((errors) => {
      throw new Error(PathReporter.report(E.left(errors)).join(","));
    }),
  );

const Status = t.keyof({
  todo: null,
  ["in-progress"]: null,
  done: null,
});

export type Status = t.TypeOf<typeof Status>;

const Priority = t.keyof({
  low: null,
  medium: null,
  high: null,
});

export type Priority = t.TypeOf<typeof Priority>;

export const Task = t.type({
  id: TaskId,
  description: Description,
  status: Status,
  createdAt: date,
  updatedAt: date,
});

export type Task = t.TypeOf<typeof Task>;
export type TaskEncoded = t.OutputOf<typeof Task>;

export const makeTask = (n: TaskEncoded) =>
  pipe(
    Task.decode(n),
    E.getOrElseW((errors) => {
      throw new Error(PathReporter.report(E.left(errors)).join(","));
    }),
  );

// Domain data end

const Tasks = t.array(Task);
export const decodeTasks = Tasks.decode;
export const encodeTasks = Tasks.encode;

// Domain behaviour
// maybe i need lenses
// shouldn't it be in the TaskTracker instead of here?
const changeStatus = (task: Task, status: Status): Task => {
  return makeTask({
    id: task.id,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    description: task.description,
    status: status,
  });
};

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
