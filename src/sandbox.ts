import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as M from "fp-ts/Monoid";
import * as O from "fp-ts/Option";
import * as Ord from "fp-ts/Ord";
import * as P from "fp-ts/Predicate";
import * as RA from "fp-ts/ReadonlyArray";
import * as R from "fp-ts/Record";
import { makeTask, type Task } from "@/schema.compound";
import { TaskFromJson } from "@/schema.dto";
import type { Priority, Status } from "@/schema.simple";
import * as Alg from "@/task.algebra";
import { encodeToJson } from "@/utils/json";

type OrdKeys = Extract<keyof Task, "priority" | "status">;
type OrdMap = Record<OrdKeys, Ord.Ord<Task>>;

const ordMap: OrdMap = {
  priority: Alg.byStatus,
  status: Alg.byStatus,
};

interface Options {
  where: {
    status: O.Option<Status>;
    priority: O.Option<Priority>;
  };
  orderBy: Array<OrdKeys>;
}

const fn = (
  optoins: Options = {
    where: { status: O.none, priority: O.none },
    orderBy: [],
  },
) => {};

fn({ where: { status: O.none, priority: O.none }, orderBy: [] });

const getSomeValue = <T>(o: O.Some<T>) => o.value;

const options: Options = {
  where: {
    status: O.some("todo"),
    priority: O.some("high"),
  },
  orderBy: ["status"],
};

const where = pipe(
  [
    pipe(
      options.where.status,
      O.map((status) => (task: Task) => task.status === status),
    ),
    pipe(
      options.where.priority,
      O.map((priority) => (task: Task) => task.priority === priority),
    ),
  ],
  RA.filter(O.isSome),
  RA.map(getSomeValue),
  M.concatAll(P.getMonoidAll<Task>()),
);

const orderBy = pipe(
  options.orderBy,
  RA.map((ord) => R.lookup(ord)(ordMap)),
  RA.filter(O.isSome),
  RA.map(getSomeValue),
  M.concatAll(Ord.getMonoid<Task>()),
);

const task = makeTask({
  id: 1,
  description: "buy dogecoin",
  status: "done",
});

const result = TaskFromJson.encode(task);
const resultShow = pipe(
  encodeToJson(TaskFromJson)(task),
  E.getOrElseW(() => {
    throw new Error("io-ts is not working properly");
  }),
);

const tasks = [
  makeTask({
    id: 1,
    description: "buy dogecoin",
    status: "done",
  }),
  makeTask({
    id: 1,
    description: "buy solana",
    priority: "high",
  }),
  makeTask({
    id: 1,
    description: "buy bitcoin",
  }),
];

console.log(RA.sort(orderBy)(tasks));
