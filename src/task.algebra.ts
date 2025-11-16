import * as A from "fp-ts/Array";
import * as D from "fp-ts/Date";
import * as Eq from "fp-ts/Eq";
import * as N from "fp-ts/number";
import * as O from "fp-ts/Option";
import * as Ord from "fp-ts/Ord";
import * as Sem from "fp-ts/Semigroup";
import * as S from "fp-ts/string";
import type { Task } from "@/schema.compound";
import type { Description, Priority, Status, TaskId } from "@/schema.simple";

// EQUALITY STRATEGY

const eqTask = Eq.contramap<number, Task>((task) => task.id)(N.Eq);

// ORDERING/SORTING STRATEGY

// I have doupts about schema defintion for priority, maybe it should have serverity build in.
const priorityLookup = (priority: Priority) => {
  const priorityMap: Record<Priority, number> = {
    high: 3,
    medium: 2,
    low: 1,
  };
  return priorityMap[priority] ?? -1;
};

// same about status
const statusLookup = (status: Status) => {
  const statusMap: Record<Status, number> = {
    done: 3,
    "in-progress": 2,
    todo: 1,
  };
  return statusMap[status] ?? -1;
};

export const byPriority = Ord.contramap<number, Task>((task) =>
  priorityLookup(task.priority),
)(N.Ord);
export const byStatus = Ord.contramap<number, Task>((task) =>
  statusLookup(task.status),
)(N.Ord);
/*const byCreationDate = Ord.contramap<Date, Task>((task) => task.createdAt)(
  D.Ord,
);
const byUpdateDate = Ord.contramap<O.Option<Date>, Task>(
  (task) => task.updatedAt,
)(O.getOrd(D.Ord));
const byDescription = Ord.contramap<string, Task>((task) => task.description)(
  S.Ord,
);

const TaskOrdMonoid = Ord.getMonoid<Task>();

const taskOrd = TaskOrdMonoid.concat(byPriority, byStatus);
const sortA = A.sort(taskOrd);
const sortB = A.sortBy<Task>([byPriority, byStatus]);
*/

// MERGING STRATEGRY
const semigroupTask = Sem.struct<Task>({
  id: Sem.first<TaskId>(),
  description: Sem.last<Description>(),
  status: Sem.last<Status>(),
  priority: Sem.last<Priority>(),
  createdAt: Sem.first<Date>(),
  updatedAt: Sem.last<O.Option<Date>>(),
});

// COLLECTIONS
export const findById = (id: TaskId) =>
  A.findFirst<Task>((task) => task.id === id);
export const deleteById = (id: TaskId) =>
  A.filter<Task>((task) => task.id !== id);
export const update = semigroupTask.concat;
export const replace = (match: Task, replacement: Task) =>
  A.map<Task, Task>((task) => (task.id === match.id ? replacement : task));
