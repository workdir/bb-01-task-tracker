import * as E from "fp-ts/Either";
import { identity, pipe } from "fp-ts/function";
import * as t from "io-ts";
import { PathReporter } from "io-ts/PathReporter";
import {
  DateFromISOString,
  NonEmptyString,
  NumberFromString,
  optionFromNullable,
} from "io-ts-types";
import { Trim } from "./utils/schema";

export interface TaskIdBrand {
  readonly TaskId: unique symbol;
}

export type TaskId = t.Branded<number, TaskIdBrand>;

export const TaskId = NumberFromString.pipe(
  new t.Type<TaskId, number, unknown>(
    "TaskId",
    (input: unknown): input is TaskId => t.string.is(input),
    (u, c) =>
      pipe(
        t.number.validate(u, c),
        E.map((s) => s as TaskId),
      ),
    identity,
  ),
);

export interface DescriptionBrand {
  readonly Description: unique symbol;
}

export type Description = t.Branded<string, DescriptionBrand>;

export const Description = new t.Type<Description, string, unknown>(
  "Description",
  (input: unknown): input is Description => Trim.is(input),
  (u, c) =>
    pipe(
      Trim.validate(u, c),
      E.map((d) => d as unknown as Description),
    ),
  String,
);

const Status = t.keyof({
  todo: null,
  ["in-progress"]: null,
  done: null,
});

export type Status = t.TypeOf<typeof Status>;

export const Task = t.type({
  id: TaskId,
  description: Description,
  status: Status,
  createdAt: DateFromISOString,
  updatedAt: DateFromISOString,
});

export type TaskEncoded = t.OutputOf<typeof Task>;

export const InsertTask = t.type({
  description: Task.props.description,
  status: Task.props.status,
});

const Tasks = t.array(Task);
export const decodeTasks = Tasks.decode;
export const encodeTasks = Tasks.encode;

export type Task = t.TypeOf<typeof Task>;

export type InsertTask = Pick<Task, "description" | "status">;

const AddCommand = t.tuple([t.literal("add"), earescription]);
const UpdateCommand = t.tuple([t.literal("update"), TaskId, Description]);
const DeleteCommand = t.tuple([t.literal("delete"), TaskId]);
const ListCommand = t.tuple([t.literal("list"), optionFromNullable(Status)]);
const MarkInProgressCommand = t.tuple([t.literal("mark-in-progress"), TaskId]);
const MarkDoneCommand = t.tuple([t.literal("mark-done"), TaskId]);

export const Commands = t.union([
  AddCommand,
  UpdateCommand,
  DeleteCommand,
  ListCommand,
  MarkInProgressCommand,
  MarkDoneCommand,
]);

export type Commands = t.TypeOf<typeof Commands>;

export const Env = t.type({
  tasksFilepath: NonEmptyString,
});

export type Env = t.TypeOf<typeof Env>;
