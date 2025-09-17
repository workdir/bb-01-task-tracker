import * as t from "io-ts";
import {
  DateFromISOString,
  NonEmptyString,
  NumberFromString,
  optionFromNullable,
} from "io-ts-types";
import { Trim } from './utils/schema'

import { pipe } from 'fp-ts/function';
import * as E from 'fp-ts/Either'
import { PathReporter } from 'io-ts/PathReporter'

export const TaskId = NumberFromString;
export type TaskId = t.TypeOf<typeof TaskId>

export const Description = t.intersection([NonEmptyString, Trim], "Description")
export type Description = t.TypeOf<typeof Description>

const Status = t.keyof({
  todo: null,
  ['in-progress']: null,
  done: null,
});

export type Status = t.TypeOf<typeof Status>

export const Task = t.type({
  id: TaskId,
  description: Description,
  status: Status,
  createdAt: DateFromISOString,
  updatedAt: DateFromISOString,
});

export const InsertTask = t.type({
  description: Task.props.description,
  status: Task.props.status
})

const Tasks = t.array(Task)
export const decodeTasks = Tasks.decode
export const encodeTasks = Tasks.encode

export type Task = t.TypeOf<typeof Task>;

export type InsertTask = Pick<Task, "description" | "status"> 

const AddCommand = t.tuple([t.literal("add"), Description])
const UpdateCommand = t.tuple([t.literal("update"), TaskId, Description])
const DeleteCommand = t.tuple([t.literal("delete"), TaskId])
const ListCommand = t.tuple([t.literal("list"), optionFromNullable(Status)])
const MarkInProgressCommand = t.tuple([t.literal('mark-in-progress'), TaskId])
const MarkDoneCommand = t.tuple([t.literal('mark-done'), TaskId])

export const Commands =
  t.union(
    [
      AddCommand,
      UpdateCommand,
       DeleteCommand,
      ListCommand,
      MarkInProgressCommand,
      MarkDoneCommand
    ]
  )

export type Commands = t.TypeOf<typeof Commands>

export const Env = t.type({
  tasksFilepath: NonEmptyString,
});

export type Env = t.TypeOf<typeof Env>;
